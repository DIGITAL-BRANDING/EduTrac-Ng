// ============================================================
//  EduTrack NG v2 — api/auth.js
//  Unified Auth Guard: checks login status, role vs folder,
//  redirects instantly on mismatch.
//
//  OFFLINE FIX (v2.1):
//   • User profile is cached in localStorage after every
//     successful network fetch (key: 'et_user_profile').
//   • When offline, authGuard falls back to the cached profile
//     instead of redirecting to login.
//   • Redirects to login ONLY when navigator.onLine is true
//     AND the network fetch genuinely returns no user.
//   • On reconnect, the next successful fetch refreshes the
//     cache so it never goes stale.
// ============================================================

const PROFILE_CACHE_KEY = 'et_user_profile';

// Map each role to its portal folder
const ROLE_PORTALS = {
  admin:        '/admin/',
  exam_officer: '/portals/academic-office/',
  vp_academic:  '/portals/academic-office/',
  vp_admin:     '/portals/admin-office/',
  registrar:    '/portals/admin-office/',
  accountant:   '/portals/bursary/',
  bursary:      '/portals/bursary/',
  teacher:      '/portals/staff/',
  parent:       '/portals/parent/',
  student:      '/portals/student/',
  saas_owner:   '/saas-console/',
};

// Which roles are allowed in each portal folder
const PORTAL_ALLOWED_ROLES = {
  '/admin/':                   ['admin', 'saas_owner'],
  '/portals/academic-office/': ['exam_officer', 'vp_academic', 'admin'],
  '/portals/admin-office/':    ['vp_admin', 'registrar', 'admin'],
  '/portals/bursary/':         ['accountant', 'bursary', 'admin'],
  '/portals/staff/':           ['teacher', 'admin'],
  '/portals/parent/':          ['parent'],
  '/portals/student/':         ['student'],
  '/saas-console/':            ['saas_owner'],
};

// ── Profile cache helpers ──────────────────────────────────────
function _saveProfileCache(user) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user)); } catch {}
}

function _loadProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _clearProfileCache() {
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
}

// ── Main Auth Guard ────────────────────────────────────────────
// Call at top of every portal page. Returns user or null.
// Pass explicit allowedRoles to override folder-based check.
async function authGuard(allowedRoles = null) {
  // ── 1. Check Supabase session (works offline — stored in localStorage)
  let session = null;
  try {
    session = await db.auth.getSession().then(r => r.data.session);
  } catch { session = null; }

  if (!session) {
    // No session at all — must login regardless of connectivity
    _redirectToLogin();
    return null;
  }

  // ── 2. Try fetching fresh user profile from Supabase
  let user = null;
  let fetchedFromNetwork = false;

  try {
    const { data, error } = await db.from('users')
      .select('*, schools(*)')
      .eq('id', session.user.id)
      .single();

    if (data && !error) {
      user = data;
      fetchedFromNetwork = true;
      _saveProfileCache(user); // ← keep cache fresh on every successful load
    }
  } catch {
    // Network unavailable — will fall back to cache below
  }

  // ── 3. If network fetch failed, fall back to cached profile
  if (!user) {
    user = _loadProfileCache();

    if (user) {
      // Validate cached profile belongs to this session
      if (user.id !== session.user.id) {
        _clearProfileCache();
        user = null;
      }
    }
  }

  // ── 4. No user at all — only redirect if we are truly online
  //       (offline with no cache → show offline page, don't kick out)
  if (!user) {
    if (navigator.onLine) {
      _redirectToLogin();
    } else {
      _showOfflineBanner();
    }
    return null;
  }

  // ── 5. Account deactivated — only enforce when online
  //       (avoid signing out someone who is offline)
  if (user.is_active === false && fetchedFromNetwork) {
    _clearProfileCache();
    await db.auth.signOut();
    _redirectToLogin();
    return null;
  }

  // ── 6. Role check
  const roles = allowedRoles || _getRolesForCurrentPath();

  if (roles.length && !roles.includes(user.role)) {
    const correctPortal = ROLE_PORTALS[user.role];
    if (correctPortal) {
      window.location.href = correctPortal + 'index.html';
    } else {
      _redirectToLogin();
    }
    return null;
  }

  return user;
}

// ── Login page: redirect if already authed ─────────────────────
async function redirectIfLoggedIn() {
  // Only try to redirect if we're online OR have a valid cached session
  const session = await db.auth.getSession().then(r => r.data.session).catch(() => null);
  if (!session) {
    // No session at all — don't block login page
    return;
  }

  // Session exists — try to get user role
  let user = null;
  
  // Online: fetch fresh user data
  if (navigator.onLine) {
    try {
      const { data } = await db.from('users')
        .select('role,is_active')
        .eq('id', session.user.id)
        .single();
      if (data) {
        user = data;
        // Cache the user for offline access
        try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data)); } catch {}
      }
    } catch (err) {
      // Network fetch failed — fall through to cache
      console.warn('[AUTH] Network fetch failed, trying cache:', err.message);
    }
  }

  // Offline OR network fetch failed: use cache
  if (!user) {
    const cached = _loadProfileCache();
    if (cached && cached.id === session.user.id) {
      user = { role: cached.role, is_active: cached.is_active };
    }
  }

  // Only redirect if we have an active user
  if (!user || user.is_active === false) return;
  
  const portal = ROLE_PORTALS[user.role];
  if (portal) window.location.href = portal + 'index.html';
}

// ── Role-based redirect after login ───────────────────────────
function redirectByRole(role) {
  const portal = ROLE_PORTALS[role];
  window.location.href = portal ? portal + 'index.html' : '/login.html';
}

// ── Logout ─────────────────────────────────────────────────────
async function logout() {
  // Clear SW portal cache so next user on same device sees nothing
  if (typeof clearPortalCacheOnLogout === 'function') clearPortalCacheOnLogout();
  _clearProfileCache();
  try { localStorage.removeItem('user'); sessionStorage.removeItem('user'); } catch {}
  
  // CRITICAL: Sign out from Supabase FIRST, then clear ALL auth storage
  try {
    await db.auth.signOut();
  } catch (e) {
    console.warn('Signout failed:', e);
  }
  
  // Force clear ALL possible auth storage locations to prevent auto-login
  try {
    // Clear Supabase session storage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('et_user') || key.includes('et_student'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB if it exists
    if (window.indexedDB) {
      const dbs = await indexedDB.databases();
      dbs.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    }
  } catch (e) {
    console.warn('Error clearing auth storage:', e);
  }
  
  // Add a small delay to ensure storage is cleared before redirect
  await new Promise(resolve => setTimeout(resolve, 100));
  
  window.location.href = '/login.html';
}

// ── Student Portal Auth (PIN-based, no Supabase auth) ──────────
function getStudentSession() {
  try {
    const s = sessionStorage.getItem('et_student_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function requireStudentAuth() {
  const s = getStudentSession();
  if (!s) { window.location.href = '/portals/student/login.html'; return null; }
  if (Date.now() - new Date(s.logged_in_at).getTime() > 8 * 60 * 60 * 1000) {
    sessionStorage.removeItem('et_student_session');
    window.location.href = '/portals/student/login.html';
    return null;
  }
  return s;
}

function studentLogout() {
  sessionStorage.removeItem('et_student_session');
  window.location.href = '/login.html';
}

// ── Private Helpers ────────────────────────────────────────────
function _redirectToLogin() {
  window.location.href = '/login.html';
}

function _getRolesForCurrentPath() {
  const path = window.location.pathname;
  for (const [folder, roles] of Object.entries(PORTAL_ALLOWED_ROLES)) {
    if (path.startsWith(folder)) return roles;
  }
  return [];
}

// ── Offline banner (non-blocking — keeps user on current page) ─
function _showOfflineBanner() {
  if (document.getElementById('_et_offline_banner')) return;
  const bar = document.createElement('div');
  bar.id = '_et_offline_banner';
  bar.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:99999;' +
    'background:#b45309;color:#fff;font-size:13px;font-family:system-ui;' +
    'padding:10px 16px;text-align:center;';
  bar.textContent = '📶 You are offline. Some data may be unavailable until you reconnect.';
  document.body.prepend(bar);

  // Auto-dismiss when connectivity returns and refresh user data
  window.addEventListener('online', async () => {
    bar.remove();
    // Silently refresh profile cache in background
    try {
      const session = await db.auth.getSession().then(r => r.data.session);
      if (session) {
        const { data } = await db.from('users')
          .select('*, schools(*)')
          .eq('id', session.user.id)
          .single();
        if (data) _saveProfileCache(data);
      }
    } catch {}
  }, { once: true });
}
