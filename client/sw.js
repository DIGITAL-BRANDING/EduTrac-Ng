// ============================================================
//  EduTrack NG — Service Worker v3.2 (ENHANCED)
//  ─────────────────────────────────────────────────────────
//  IMPROVEMENTS vs v3.1:
//   ① Better offline fallback for unmemoized pages
//   ② Smarter cache invalidation strategy
//   ③ Offline page listing endpoint
//   ④ Better error recovery for portal pages
//   ⑤ Request deduplication for concurrent fetch
//   ⑥ Improved cache cleanup on activation
//   ⑦ Broadcast offline state to clients
// ============================================================

const SW_VERSION    = 'v3.2';
const SHELL_CACHE   = `edutrack-${SW_VERSION}-shell`;
const PORTAL_CACHE  = `edutrack-${SW_VERSION}-portal`;
const CDN_CACHE     = `edutrack-${SW_VERSION}-cdn`;

// Track in-flight requests to avoid duplicate fetches
const _inflightRequests = new Map();

// ── Pre-cached shell assets ───────────────────────────────────
const APP_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/offline.html',
  '/manifest.json',
  // ★ config.js MUST be here — contains Supabase URL + anon key
  '/js/config.js',
  '/js/supabase.js',
  '/js/pwa-v2.1.js',
  '/js/sync-engine.js',
  '/js/layout.js',
  '/js/notifications.js',
  '/js/ai-assistant.js',
  '/api/database.js',
  '/api/auth.js',
  '/api/calculations.js',
  '/assets/js/sidebar.js',
  '/assets/css/global.css',
  '/css/global.css',
];

// CDN origins to cache
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Portal URL-path prefixes (all treated as portal pages)
const PORTAL_PREFIXES = [
  '/portals/',
  '/admin/',
  '/report-card/',
  '/saas-console/',
];

// ── Helpers ───────────────────────────────────────────────────
const isPortalPage  = url => url.pathname !== '/portals/student/login.html'
                            && PORTAL_PREFIXES.some(p => url.pathname.startsWith(p));
const isSupabase    = url => url.hostname.includes('supabase.co');
const isCdn         = url => CDN_ORIGINS.includes(url.hostname);

/**
 * Returns a cache key Request using PATHNAME only (strips query
 * string) so ?class=X and ?class=Y both hit the same cached entry.
 */
function portalCacheKey(url) {
  return new Request(url.origin + url.pathname, { mode: 'same-origin' });
}

/**
 * Clone a Response synchronously right away, then fire-and-forget
 * the async cache write. The clone is captured before any awaits
 * so the body stream is still available.
 */
function cacheResponse(cacheName, cacheKey, response) {
  if (!response || !response.ok) return;
  const clone = response.clone();
  caches.open(cacheName).then(c => {
    c.put(cacheKey, clone).catch(e =>
      console.warn(`[SW ${SW_VERSION}] cache.put failed (${cacheName}):`, e.message)
    );
  });
}

/**
 * Deduplicate concurrent fetch requests
 * If the same request is in-flight, return that Promise instead of fetching again
 */
function deduplicatedFetch(request) {
  const key = request.url;
  
  if (_inflightRequests.has(key)) {
    console.log(`[SW ${SW_VERSION}] Deduplicating fetch: ${key}`);
    return _inflightRequests.get(key);
  }
  
  const promise = fetch(request)
    .finally(() => _inflightRequests.delete(key));
  
  _inflightRequests.set(key, promise);
  return promise;
}

/**
 * Broadcast offline state change to all clients
 */
async function broadcastOfflineState(isOffline) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({
      type: 'OFFLINE_STATE_CHANGED',
      isOffline: isOffline,
    });
  });
}

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log(`[SW ${SW_VERSION}] Installing…`);
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => Promise.allSettled(
        APP_SHELL.map(url =>
          c.add(url).catch(e => console.warn(`[SW] Shell miss: ${url}`, e.message))
        )
      ))
      .then(() => {
        console.log(`[SW ${SW_VERSION}] Shell cached (${APP_SHELL.length} items). Activating.`);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log(`[SW ${SW_VERSION}] Activating…`);
  event.waitUntil(
    caches.keys()
      .then(keys => {
        const validCaches = [SHELL_CACHE, PORTAL_CACHE, CDN_CACHE];
        return Promise.all(
          keys
            .filter(k => !validCaches.includes(k))
            .map(k => {
              console.log(`[SW ${SW_VERSION}] Purging stale cache:`, k);
              return caches.delete(k);
            })
        );
      })
      .then(() => {
        console.log(`[SW ${SW_VERSION}] Active. Claiming clients.`);
        return self.clients.claim();
      })
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  let url;
  try { url = new URL(request.url); } catch { return; }

  // Only handle GET requests over HTTP(S)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Special endpoint: list offline pages
  if (url.pathname === '/.api/offline-pages' && (request.destination === 'document' || request.mode === 'cors')) {
    event.respondWith(handleOfflinePagesAPI());
    return;
  }

  // ── 1. Supabase — always network-only ────────────────────
  if (isSupabase(url)) return;

  // ── 2. CDN — cache-first ─────────────────────────────────
  if (isCdn(url)) {
    event.respondWith(handleCdn(request, url));
    return;
  }

  // ── 3. Portal HTML navigation — network-first + SW cache ─
  if (isPortalPage(url) &&
      (request.destination === 'document' || request.mode === 'navigate')) {
    event.respondWith(handlePortalNav(request, url));
    return;
  }

  // ── 4. Public navigation (/, /login.html…) — cache-first ─
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(handlePublicNav(request));
    return;
  }

  // ── 5. Sub-resources (JS, CSS, fonts, images) ────────────
  event.respondWith(handleSubResource(request));
});

// ── Strategy implementations ──────────────────────────────────

async function handleCdn(request, url) {
  const cached = await caches.match(request, { cacheName: CDN_CACHE });
  if (cached) return cached;
  try {
    const resp = await deduplicatedFetch(request);
    cacheResponse(CDN_CACHE, request, resp);
    return resp;
  } catch (e) {
    console.warn(`[SW ${SW_VERSION}] CDN fetch failed:`, e.message);
    return cached || Response.error();
  }
}

async function handlePortalNav(request, url) {
  const key = portalCacheKey(url);

  try {
    // Try network first for fresh content
    const resp = await deduplicatedFetch(request);
    cacheResponse(PORTAL_CACHE, key, resp);
    return resp;
  } catch (e) {
    console.warn(`[SW ${SW_VERSION}] Portal fetch failed: ${url.pathname}`, e.message);
    
    // Offline: try cached version
    const cached = await caches.match(key, { cacheName: PORTAL_CACHE });
    if (cached) {
      console.log(`[SW ${SW_VERSION}] Serving offline portal: ${url.pathname}`);
      return cached;
    }

    // Never visited while online — show helpful offline page
    const offlinePage = await caches.match('/offline.html', { cacheName: SHELL_CACHE });
    if (offlinePage) return offlinePage;

    // Fallback: generate offline HTML
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
       <meta name="viewport" content="width=device-width,initial-scale=1">
       <title>Offline — EduTrack NG</title>
       <style>
         body {
           font-family: system-ui, -apple-system, sans-serif;
           background: #0d1117;
           color: #e2e8f0;
           display: flex;
           align-items: center;
           justify-content: center;
           min-height: 100vh;
           margin: 0;
           padding: 20px;
           text-align: center;
         }
         .container {
           max-width: 380px;
         }
         .icon {
           font-size: 48px;
           margin-bottom: 16px;
         }
         h2 {
           font-size: 20px;
           margin: 0 0 12px 0;
         }
         p {
           color: #64748b;
           font-size: 14px;
           line-height: 1.6;
           margin: 0 0 20px 0;
         }
         a {
           display: inline-block;
           padding: 10px 24px;
           background: #0a6e3f;
           color: white;
           border-radius: 8px;
           text-decoration: none;
           font-weight: 700;
           font-size: 14px;
         }
         a:hover { background: #0d8a4a; }
       </style>
       </head><body>
       <div class="container">
         <div class="icon">📶</div>
         <h2>You are offline</h2>
         <p>The page "<strong>${url.pathname}</strong>" hasn't been cached yet.<br>
         Visit it once while connected so it works offline.</p>
         <a href="/">← Back to Dashboard</a>
       </div>
       </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function handlePublicNav(request) {
  const cached = await caches.match(request, { cacheName: SHELL_CACHE });
  
  // Background revalidate (non-blocking)
  const networkPromise = deduplicatedFetch(request)
    .then(resp => {
      cacheResponse(SHELL_CACHE, request, resp);
      return resp;
    })
    .catch(e => {
      console.warn(`[SW ${SW_VERSION}] Network fetch failed:`, e.message);
      return null;
    });

  // Return cache immediately if available, else wait for network
  if (cached) {
    // Fire revalidation in background but don't wait
    networkPromise.catch(() => {});
    return cached;
  }

  return networkPromise.then(r => r || caches.match('/offline.html', { cacheName: SHELL_CACHE }));
}

async function handleSubResource(request) {
  const cached = await caches.match(request);

  const networkPromise = deduplicatedFetch(request)
    .then(resp => {
      if (resp && resp.status === 200 && resp.type !== 'opaque')
        cacheResponse(SHELL_CACHE, request, resp);
      return resp;
    })
    .catch(e => {
      console.warn(`[SW ${SW_VERSION}] SubResource fetch failed:`, e.message);
      return null;
    });

  // Serve cached immediately, update in background
  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  return networkPromise;
}

/**
 * API endpoint to list offline-cached pages
 * Can be called from frontend: fetch('/.api/offline-pages')
 */
async function handleOfflinePagesAPI() {
  try {
    const cache = await caches.open(PORTAL_CACHE);
    if (!cache) {
      return new Response(JSON.stringify({ pages: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const keys = await cache.keys();
    const pages = [];

    for (const req of keys) {
      try {
        const url = new URL(req.url);
        if (url.search.includes('?')) continue;

        const pathname = url.pathname;
        const parts = pathname.split('/').filter(p => p);
        const lastPart = parts.pop() || 'dashboard';

        pages.push({
          pathname,
          title: lastPart
            .replace('.html', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
          url: pathname,
          cached: true,
        });
      } catch {}
    }

    // Deduplicate
    const unique = Array.from(
      new Map(pages.map(p => [p.pathname, p])).values()
    );

    console.log(`[SW ${SW_VERSION}] Offline pages API: ${unique.length} pages`);

    return new Response(JSON.stringify({ pages: unique, count: unique.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.warn(`[SW ${SW_VERSION}] Offline pages API failed:`, e.message);
    return new Response(JSON.stringify({ pages: [], error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── MESSAGES ─────────────────────────────────────────────────
self.addEventListener('message', event => {
  const { type, urls } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'CLEAR_PORTAL_CACHE') {
    console.log(`[SW ${SW_VERSION}] Clearing portal cache on logout…`);
    caches.delete(PORTAL_CACHE)
      .then(() => console.log(`[SW ${SW_VERSION}] Portal cache cleared.`));
    return;
  }

  if (type === 'CACHE_URLS' && Array.isArray(urls)) {
    const safe = urls.filter(u => {
      try { return !isSupabase(new URL(u, self.location.origin)); } catch { return false; }
    });
    caches.open(SHELL_CACHE)
      .then(c => Promise.allSettled(safe.map(u => c.add(u).catch(() => {}))));
    return;
  }

  if (type === 'PING') {
    event.source?.postMessage({ type: 'PONG', version: SW_VERSION });
    return;
  }
});

// ── BACKGROUND SYNC ───────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'edutrack-sync') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          clients.forEach(c => c.postMessage({ type: 'BACKGROUND_SYNC' }));
          console.log(`[SW ${SW_VERSION}] BG sync — notified ${clients.length} tab(s).`);
        })
    );
  }
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let d;
  try { d = event.data.json(); } catch { d = { title: 'EduTrack NG', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(d.title || 'EduTrack NG', {
      body:    d.body    || 'You have a new notification',
      icon:    d.icon    || '/icons/icon-192.png',
      badge:              '/icons/icon-72.png',
      tag:     d.tag     || 'edutrack',
      data:    d.data    || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
