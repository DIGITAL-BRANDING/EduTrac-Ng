// ============================================================
//  EduTrack NG — PWA Manager (js/pwa-v2.1) - ENHANCED
//  ─────────────────────────────────────────────────────────
//  CRITICAL FIXES APPLIED:
//   ✅ Fix #1: Correct cache version from v3.2 -> v3.3
//   ✅ Fix #2: Redundant connectivity check (multi-endpoint)
//   ✅ Fix #3: Parallel SyncEngine initialization (not delayed)
//   ✅ Fix #4: Add prefetch hook after successful auth
//
//  IMPROVEMENTS in v2.1:
//   ① Exponential backoff for SyncEngine ready promise
//   ② Persistent sync metadata in IndexedDB
//   ③ Offline-first data loading strategy
//   ④ Critical endpoint pre-caching while online
//   ⑤ Enhanced offline pages discovery with metadata
//   ⑥ Better connectivity state management
//   ⑦ Improved error recovery with exponential backoff
//   ⑧ Automatic sync on reconnection with jitter
// ============================================================

// ── GLOBAL STATE & PROMISES ───────────────────────────────────

const SYNC_METADATA_STORE = 'syncMetadata';
const OFFLINE_PAGES_STORE = 'offlinePages';
const CONNECTIVITY_TIMEOUT = 5000; // 5s timeout for network checks

/** Resolves when SyncEngine is ready for queries */
window._syncEngineReady = createSyncEngineReadyPromise();

function createSyncEngineReadyPromise() {
  return new Promise(resolve => {
    let attempts = 0;
    const maxAttempts = 50; // ~5 seconds with exponential backoff
    
    const checkReady = () => {
      if (window._eduSyncEngine && window._eduSyncEngine.initialized) {
        resolve(window._eduSyncEngine);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.warn('[PWA] SyncEngine not ready after max attempts');
        resolve(null);
        return;
      }
      
      attempts++;
      const delay = Math.min(100 * Math.pow(1.1, attempts), 1000);
      setTimeout(checkReady, delay);
    };
    
    checkReady();
  });
}

/** Tracks sync operations and errors with persistence */
window._syncStatus = {
  syncing: false,
  lastError: null,
  lastSyncTime: null,
  pendingChanges: 0,
  syncAttempts: 0,
  failedSyncAttempts: 0,
  lastFailureTime: null,
  nextRetryTime: null,
};

// Restore sync metadata from IndexedDB
restoreSyncMetadata();

// ── IndexedDB HELPERS ──────────────────────────────────────────

/**
 * Open or create the sync metadata store
 */
async function openSyncMetadataDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('edutrack-pwa-meta', 1);
    
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_METADATA_STORE)) {
        db.createObjectStore(SYNC_METADATA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(OFFLINE_PAGES_STORE)) {
        db.createObjectStore(OFFLINE_PAGES_STORE, { keyPath: 'pathname' });
      }
    };
  });
}

/**
 * Restore sync metadata from IndexedDB
 */
async function restoreSyncMetadata() {
  try {
    const db = await openSyncMetadataDB();
    const tx = db.transaction(SYNC_METADATA_STORE, 'readonly');
    const store = tx.objectStore(SYNC_METADATA_STORE);
    
    return new Promise((resolve) => {
      const req = store.get('sync-metadata');
      req.onsuccess = () => {
        if (req.result) {
          Object.assign(window._syncStatus, req.result.data);
          console.log('[PWA] Restored sync metadata:', window._syncStatus);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('[PWA] Could not restore sync metadata:', e);
  }
}

/**
 * Persist sync metadata to IndexedDB
 */
async function persistSyncMetadata() {
  try {
    const db = await openSyncMetadataDB();
    const tx = db.transaction(SYNC_METADATA_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_METADATA_STORE);
    
    store.put({
      id: 'sync-metadata',
      data: window._syncStatus,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('[PWA] Could not persist sync metadata:', e);
  }
}

// ── Service Worker Registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] SW registered:', reg.scope);

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, version } = event.data || {};
        
        if (type === 'BACKGROUND_SYNC') {
          console.log('[PWA] Background sync triggered by SW');
          window._performSync().catch(e => console.warn('[Sync] BG sync failed:', e));
        }
        
        if (type === 'PONG') {
          console.log('[PWA] SW is alive, version:', version);
        }
      });

      // Show update banner when a new SW version is waiting
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
      
      // Verify SW health periodically
      setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'PING' });
        }
      }, 30000);
      
    } catch (err) {
      console.warn('[PWA] SW registration failed:', err);
    }
  });
}

// ── IndexedDB Validation ──────────────────────���────────────────
/**
 * Validates IndexedDB is accessible and has proper configuration
 */
async function validateIndexedDB() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('edutrack', 1);
      req.onerror = () => {
        console.warn('[PWA] IndexedDB unavailable:', req.error);
        resolve(false);
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const stores = Array.from(db.objectStoreNames);
          console.log('[PWA] IndexedDB ready. Stores:', stores.join(', '));
          resolve(true);
        } catch (e) {
          console.warn('[PWA] IndexedDB validation failed:', e);
          resolve(false);
        } finally {
          db.close();
        }
      };
      req.onblocked = () => {
        console.warn('[PWA] IndexedDB open blocked — check other tabs');
      };
    } catch (e) {
      console.warn('[PWA] IndexedDB not available:', e.message);
      resolve(false);
    }
  });
}

// ── Network Connectivity Detector ──────────────────────────────
/**
 * Check if network is actually available (not just online flag)
 * ✅ FIX #2: Multi-endpoint fallback for robust connectivity detection
 */
async function checkNetworkConnectivity() {
  if (!navigator.onLine) return false;
  
  // Try multiple endpoints with fallback
  const endpoints = ['/manifest.json', '/', '/api/health'];
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT);
      
      // Ping endpoint (HEAD or GET)
      const resp = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      }).catch(() => 
        // Fallback to GET if HEAD not supported
        fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        })
      );
      
      clearTimeout(timeoutId);
      if (resp && resp.ok) {
        console.log(`[PWA] Connectivity verified via ${endpoint}`);
        return true;
      }
    } catch (e) {
      // Try next endpoint
      console.debug(`[PWA] Endpoint ${endpoint} failed, trying next...`);
    }
  }
  
  console.warn('[PWA] No connectivity endpoints available');
  return false;
}

// ── Logout helper — clears portal cache in SW ─────────────────
window.clearPortalCacheOnLogout = function () {
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_PORTAL_CACHE' });
      console.log('[PWA] Portal cache cleared on logout');
    }
    // Reset SyncEngine
    window._eduSyncEngine = null;
    window._syncStatus = {
      syncing: false,
      lastError: null,
      lastSyncTime: null,
      pendingChanges: 0,
      syncAttempts: 0,
      failedSyncAttempts: 0,
      lastFailureTime: null,
      nextRetryTime: null,
    };
    persistSyncMetadata();
  } catch (e) {
    console.warn('[PWA] Logout cleanup failed:', e);
  }
};

// ── SyncEngine Auto-Init with improved error handling ──────────
// ✅ FIX #3: Parallel initialization instead of 1.5s delay
window.addEventListener('DOMContentLoaded', () => {
  // Start validation and init in parallel
  validateIndexedDB().catch(console.warn);
  tryInitSyncEngine(); // Start immediately, don't wait
});

/**
 * Initialize SyncEngine with comprehensive fallback logic
 * Handles: missing user data, offline at startup, IDB unavailable
 */
async function tryInitSyncEngine() {
  if (window._eduSyncEngine) return;
  if (typeof SyncEngine === 'undefined') {
    console.warn('[PWA] SyncEngine not loaded');
    return;
  }
  if (typeof window._supabase === 'undefined') {
    console.warn('[PWA] Supabase client not loaded');
    return;
  }

  let schoolId = null;
  let authUser = null;

  // ① Try localStorage/sessionStorage (normal case)
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      schoolId = u?.school_id || u?.schools?.id || null;
      authUser = u;
    }
  } catch (e) {
    console.warn('[PWA] Could not parse stored user:', e);
  }

  // ② Fallback: try Supabase auth.user() if available
  if (!schoolId && window._supabase?.auth) {
    try {
      const session = await window._supabase.auth.getSession();
      if (session?.data?.user) {
        authUser = session.data.user;
        schoolId = session.data.user.user_metadata?.school_id;
        console.log('[PWA] Retrieved schoolId from Supabase auth');
      }
    } catch (e) {
      console.warn('[PWA] Supabase auth fetch failed:', e);
    }
  }

  // ③ Still no schoolId? Use placeholder
  if (!schoolId && authUser?.id) {
    schoolId = 'unknown-school';
    console.warn('[PWA] Using placeholder schoolId (auth exists but no school_id)');
  }

  if (!schoolId && !authUser) {
    console.log('[PWA] No user context found — SyncEngine init skipped (user not logged in)');
    return;
  }

  // ④ Initialize SyncEngine
  try {
    const engine = new SyncEngine(window._supabase, schoolId || 'unknown-school');
    
    // Mark as initializing
    engine.initialized = false;
    
    await engine.init();
    
    // Mark as initialized
    engine.initialized = true;
    window._eduSyncEngine = engine;
    
    console.log('[PWA] SyncEngine initialised for school:', schoolId);

    // ⑤ Load data based on connectivity
    const isConnected = await checkNetworkConnectivity();
    
    if (isConnected) {
      console.log('[PWA] Online at startup — pulling fresh data');
      engine.pull()
        .then(() => {
          window._syncStatus.lastSyncTime = Date.now();
          window._syncStatus.failedSyncAttempts = 0;
          persistSyncMetadata();
          console.log('[PWA] Initial data pull complete');
        })
        .catch(e => {
          console.warn('[PWA] Initial pull failed:', e);
          window._syncStatus.lastError = e.message;
          window._syncStatus.failedSyncAttempts++;
          persistSyncMetadata();
        });
    } else {
      console.log('[PWA] Offline at startup — using cached IndexedDB data');
    }
  } catch (e) {
    console.warn('[PWA] SyncEngine init failed:', e);
    window._syncStatus.lastError = e.message;
    persistSyncMetadata();
  }
}

// ── SYNC ENGINE API ───────────────────────────────────────────

/**
 * Calculate exponential backoff delay for sync retries
 */
function getBackoffDelay() {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const exponentialDelay = baseDelay * Math.pow(2, window._syncStatus.failedSyncAttempts);
  const delay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (±20%)
  return delay * (0.8 + Math.random() * 0.4);
}

/**
 * Performs a full sync: push pending changes, then pull fresh data
 * Prevents concurrent syncs and tracks errors with exponential backoff
 */
window._performSync = async function() {
  if (window._syncStatus.syncing) {
    console.log('[Sync] Already syncing — skipping duplicate');
    return;
  }

  const isConnected = await checkNetworkConnectivity();
  
  if (!isConnected) {
    console.log('[Sync] Offline — changes queued locally, will sync when online');
    return;
  }

  if (!window._eduSyncEngine) {
    console.warn('[Sync] SyncEngine not ready');
    return;
  }

  // Check if we should retry based on backoff
  if (window._syncStatus.nextRetryTime && Date.now() < window._syncStatus.nextRetryTime) {
    const waitTime = Math.ceil((window._syncStatus.nextRetryTime - Date.now()) / 1000);
    console.log(`[Sync] Backoff active — retry in ${waitTime}s`);
    return;
  }

  window._syncStatus.syncing = true;
  window._syncStatus.syncAttempts++;

  try {
    console.log('[Sync] Starting sync operation…');

    // Push local changes first
    console.log('[Sync] Pushing pending changes…');
    await window._eduSyncEngine.push();

    // Then pull fresh data
    console.log('[Sync] Pulling fresh data…');
    await window._eduSyncEngine.pull();

    window._syncStatus.lastError = null;
    window._syncStatus.lastSyncTime = Date.now();
    window._syncStatus.failedSyncAttempts = 0;
    window._syncStatus.nextRetryTime = null;

    console.log('[Sync] ✓ Sync complete');

    // Broadcast to other tabs
    try {
      localStorage.setItem('_sync_event', JSON.stringify({
        timestamp: Date.now(),
        status: 'complete',
        attempt: window._syncStatus.syncAttempts,
      }));
    } catch (e) {
      console.warn('[Sync] Could not broadcast to other tabs:', e);
    }

    persistSyncMetadata();
    return true;
  } catch (e) {
    window._syncStatus.lastError = e.message;
    window._syncStatus.failedSyncAttempts++;
    window._syncStatus.lastFailureTime = Date.now();
    window._syncStatus.nextRetryTime = Date.now() + getBackoffDelay();
    
    console.warn('[Sync] ✗ Sync failed:', e.message);
    console.log(`[Sync] Next retry in ${Math.ceil((window._syncStatus.nextRetryTime - Date.now()) / 1000)}s`);
    
    persistSyncMetadata();
    return false;
  } finally {
    window._syncStatus.syncing = false;
  }
};

/**
 * Pre-fetches critical data into IndexedDB for offline use
 * Call this during initial app load while online
 * ✅ FIX #4: Hook this after successful auth
 */
window.prefetchCriticalDataForOffline = async function() {
  if (!window._eduSyncEngine) {
    console.warn('[PWA] SyncEngine not ready for prefetch');
    return false;
  }

  const isConnected = await checkNetworkConnectivity();
  
  if (!isConnected) {
    console.log('[PWA] Already offline — cannot prefetch');
    return false;
  }

  try {
    console.log('[PWA] Pre-fetching critical offline data…');
    await window._eduSyncEngine.pull();
    window._syncStatus.lastSyncTime = Date.now();
    persistSyncMetadata();
    console.log('[PWA] ✓ Offline data pre-fetch complete');
    return true;
  } catch (e) {
    console.warn('[PWA] Pre-fetch failed:', e);
    window._syncStatus.lastError = e.message;
    persistSyncMetadata();
    return false;
  }
};

/**
 * Lists all cached portal pages for offline navigation
 * Enhanced with metadata for better UX
 * ✅ FIX #1: Updated cache version to v3.3
 */
window._getOfflinePages = async function() {
  try {
    // Dynamically find the portal cache (name contains 'portal') instead of hardcoding version
    const cacheNames = await caches.keys();
    const portalCacheName = cacheNames.find(n => n.includes('-portal'));
    if (!portalCacheName) {
      console.warn('[PWA] Portal cache not found');
      return [];
    }
    const cache = await caches.open(portalCacheName);

    const keys = await cache.keys();
    const pages = keys
      .map(req => {
        try {
          return new URL(req.url);
        } catch {
          return null;
        }
      })
      .filter(url => url !== null && url.search === '')
      .map(url => {
        const pathname = url.pathname;
        const parts = pathname.split('/').filter(p => p);
        const lastPart = parts.pop() || 'dashboard';
        
        return {
          pathname,
          title: lastPart
            .replace('.html', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
          url: pathname,
          icon: getPageIcon(pathname),
          cached: true,
        };
      })
      .filter((v, i, a) => a.findIndex(t => t.pathname === v.pathname) === i); // Deduplicate

    console.log('[PWA] Found', pages.length, 'cached offline pages');
    return pages;
  } catch (e) {
    console.warn('[PWA] Could not list offline pages:', e);
    return [];
  }
};

/**
 * Get appropriate icon for a page based on URL
 */
function getPageIcon(pathname) {
  if (pathname.includes('report-card')) return '📋';
  if (pathname.includes('admin')) return '⚙️';
  if (pathname.includes('student')) return '👤';
  if (pathname.includes('class')) return '📚';
  if (pathname.includes('dashboard')) return '📊';
  return '📄';
}

// ── Connectivity Tracking ──────────────────────────────────────
let _lastOnlineTime = Date.now();

window.addEventListener('online', async () => {
  console.log('[PWA] Online detected');
  hideOfflinePill();
  
  // Small delay to allow network to stabilize
  setTimeout(() => {
    window._performSync().catch(e => console.warn('[Sync] Online sync failed:', e));
  }, 500);
});

window.addEventListener('offline', () => {
  console.log('[PWA] Offline detected');
  _lastOnlineTime = Date.now();
  showOfflinePill();
});

// ─────────────────────────────────────────────────────────────
//  OFFLINE PILL BANNER (unchanged from v2.0)
// ─────────────────────────────────────────────────────────────

const PILL_ID     = 'et-offline-pill';
const UPDATE_ID   = 'et-update-bar';
let _pillDismissCount = 0;
let _pillTimeout  = null;

const PILL_STYLES = `
  #${PILL_ID} {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    z-index: 9998;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 30, 40, 0.92);
    color: #fbbf24;
    border: 1px solid rgba(251,191,36,0.35);
    border-radius: 999px;
    padding: 9px 16px 9px 14px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.1);
    white-space: nowrap;
    max-width: calc(100vw - 32px);
    animation: pillSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: opacity 0.25s, transform 0.25s;
    cursor: pointer;
  }
  #${PILL_ID}:hover {
    background: rgba(30, 30, 40, 0.98);
    border-color: rgba(251,191,36,0.5);
  }
  #${PILL_ID}.hiding {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
  #${PILL_ID}.syncing {
    color: #60a5fa;
    border-color: rgba(96,165,250,0.35);
  }
  #${PILL_ID}.sync-error {
    color: #f87171;
    border-color: rgba(248,113,113,0.35);
  }
  #${PILL_ID} .pill-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #f59e0b;
    flex-shrink: 0;
    animation: pillBlink 1.8s ease-in-out infinite;
  }
  #${PILL_ID}.syncing .pill-dot {
    background: #60a5fa;
    animation: pillSpin 1s linear infinite;
  }
  #${PILL_ID}.sync-error .pill-dot {
    background: #f87171;
    animation: none;
  }
  #${PILL_ID} .pill-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #${PILL_ID} .pill-close {
    background: none; border: none; cursor: pointer;
    color: rgba(251,191,36,0.6); font-size: 16px; line-height: 1;
    padding: 0 0 0 4px; margin: 0; flex-shrink: 0;
    transition: color 0.15s;
  }
  #${PILL_ID} .pill-close:hover { color: #fbbf24; }
  #${PILL_ID} .pill-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 15, 20, 0.95);
    color: #e2e8f0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    margin-bottom: 8px;
    border: 1px solid rgba(251,191,36,0.2);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  #${PILL_ID}:hover .pill-tooltip {
    opacity: 1;
  }
  @keyframes pillSlideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes pillBlink {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  @keyframes pillSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @media (max-width: 480px) {
    #${PILL_ID} {
      bottom: 0;
      left: 0;
      right: 0;
      transform: none;
      border-radius: 12px 12px 0 0;
      width: 100%;
      max-width: 100%;
      justify-content: center;
      font-size: 12px;
      padding: 10px 14px;
      border-left: none; border-right: none; border-bottom: none;
      animation: pillSlideUpMobile 0.3s ease both;
    }
    #${PILL_ID}.hiding {
      transform: translateY(100%);
    }
    #${PILL_ID} .pill-tooltip {
      display: none;
    }
    @keyframes pillSlideUpMobile {
      from { opacity: 0; transform: translateY(100%); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
`;

function injectPillStyles() {
  if (document.getElementById('et-pill-styles')) return;
  const s = document.createElement('style');
  s.id = 'et-pill-styles';
  s.textContent = PILL_STYLES;
  document.head.appendChild(s);
}

function showOfflinePill() {
  injectPillStyles();
  clearTimeout(_pillTimeout);

  // Remove existing pill if present
  document.getElementById(PILL_ID)?.remove();

  const pill = document.createElement('div');
  pill.id = PILL_ID;
  
  let statusText = 'You are offline — cached pages still work';
  let statusClass = '';

  if (window._syncStatus.syncing) {
    statusText = 'Syncing data…';
    statusClass = 'syncing';
  } else if (window._syncStatus.lastError) {
    statusText = 'Sync failed — retrying…';
    statusClass = 'sync-error';
  }

  const lastSyncText = window._syncStatus.lastSyncTime
    ? `Last sync: ${new Date(window._syncStatus.lastSyncTime).toLocaleTimeString()}`
    : 'Never synced';

  pill.className = statusClass;
  pill.innerHTML = `
    <span class="pill-dot"></span>
    <span class="pill-text">${statusText}</span>
    <span class="pill-tooltip">${lastSyncText}</span>
    <button class="pill-close" onclick="event.stopPropagation(); window._dismissOfflinePill()" title="Dismiss">×</button>
  `;
  
  // Click to trigger sync
  pill.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      window._performSync().catch(console.warn);
    }
  });

  document.body.appendChild(pill);

  // Auto-dismiss after 8 s (unless user has dismissed before — then stay)
  if (_pillDismissCount < 2) {
    _pillTimeout = setTimeout(() => window._dismissOfflinePill(true), 8000);
  }
}

window._dismissOfflinePill = function (auto = false) {
  clearTimeout(_pillTimeout);
  const pill = document.getElementById(PILL_ID);
  if (!pill) return;
  pill.classList.add('hiding');
  setTimeout(() => pill.remove(), 280);
  if (!auto) _pillDismissCount++;
};

/**
 * Handle transition to online mode
 * Triggers sync and shows confirmation
 */
function hideOfflinePill() {
  clearTimeout(_pillTimeout);
  const pill = document.getElementById(PILL_ID);
  if (!pill) return;
  pill.classList.add('hiding');
  setTimeout(() => pill.remove(), 280);
  _pillDismissCount = 0;

  // Show "back online" notification
  if (typeof toast === 'function') {
    toast('Back online!', 'success');
  } else {
    showOnlineToast();
  }
}

function showOnlineToast() {
  injectPillStyles();
  const t = document.createElement('div');
  t.id = 'et-online-toast';
  t.style.cssText = `
    position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    z-index:9998;display:flex;align-items:center;gap:8px;
    background:rgba(5,46,22,0.92);color:#4ade80;
    border:1px solid rgba(74,222,128,0.3);border-radius:999px;
    padding:9px 18px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    font-size:13px;font-weight:600;backdrop-filter:blur(10px);
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    animation:pillSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  `;
  t.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0"></span> Back online!`;
  document.body.appendChild(t);
  setTimeout(() => { 
    t.style.opacity='0'; 
    t.style.transition='opacity 0.3s'; 
    setTimeout(()=>t.remove(), 300); 
  }, 2500);
}

// Listen for sync status changes from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === '_sync_event') {
    try {
      const data = JSON.parse(e.newValue);
      if (data.status === 'complete') {
        console.log('[PWA] Sync complete in another tab');
        // Update UI to reflect sync
      }
    } catch {}
  }
});

// Show immediately if starting offline
if (!navigator.onLine) {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', showOfflinePill);
  } else {
    showOfflinePill();
  }
}

// ── Update Banner ─────────────────────────────────────────────
function showUpdateBanner() {
  if (document.getElementById(UPDATE_ID)) return;
  const bar = document.createElement('div');
  bar.id = UPDATE_ID;
  bar.style.cssText = `
    position:fixed;bottom:16px;right:16px;z-index:9999;
    background:rgba(10,46,30,0.95);color:#4ade80;
    border:1px solid rgba(74,222,128,0.3);border-radius:14px;
    padding:12px 16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    font-size:13px;backdrop-filter:blur(12px);
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    display:flex;align-items:center;gap:12px;max-width:320px;
  `;
  bar.innerHTML = `
    <span style="font-size:20px">🔄</span>
    <div style="flex:1">
      <div style="font-weight:700;margin-bottom:2px">Update available</div>
      <div style="font-size:11px;color:#86efac;opacity:.8">New version of EduTrack NG is ready</div>
    </div>
    <button onclick="navigator.serviceWorker.controller?.postMessage({type:'SKIP_WAITING'});location.reload()" style="
      background:#0a6e3f;color:white;border:none;border-radius:8px;
      padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;
      font-family:inherit;white-space:nowrap;
    ">Update</button>
    <button onclick="this.parentElement.remove()" style="
      background:none;border:none;color:rgba(74,222,128,.5);
      font-size:18px;cursor:pointer;padding:0;line-height:1;
    ">×</button>
  `;
  document.body.appendChild(bar);
}

// ── Install Prompt ────────────────────────────────────────────
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) {
    btn.style.display = 'flex';
    btn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      btn.style.display = 'none';
    });
  }
});
window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; });

// ── PUBLIC API FOR LOGIN PAGES ────────────────────────────────
/**
 * Call this after successful authentication to pre-fetch offline data
 * ✅ FIX #4: Hook for prefetching after login
 */
window.onAuthSuccess = async function(user, schoolId) {
  console.log('[Auth] User logged in:', user.id, 'school:', schoolId);
  
  // SyncEngine will auto-init via DOMContentLoaded
  // Wait for it to be ready, then prefetch
  const engine = await window._syncEngineReady;
  
  if (engine) {
    console.log('[Auth] SyncEngine ready, prefetching offline data...');
    window.prefetchCriticalDataForOffline()
      .then(success => {
        if (success) {
          console.log('[Auth] ✓ Offline data prefetched successfully');
        }
      })
      .catch(e => console.warn('[Auth] Prefetch failed:', e));
  }
};
