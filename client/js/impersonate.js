// ============================================================
//  EduTrack NG — Admin Impersonation Helper
//  Drop this script into any staff portal page AFTER supabase.js:
//  <script src="../../js/impersonate.js"></script>
//  No other changes needed in the portal files.
// ============================================================

(async function initImpersonation() {
  const params       = new URLSearchParams(window.location.search);
  const impersonateId = params.get('impersonate');
  if (!impersonateId) return; // Not impersonating — behave normally

  // ── Override getCurrentUser so every portal page gets the impersonated user ──
  window.getCurrentUser = async function () {
    if (window._impersonatedUser) return window._impersonatedUser;
    const { data } = await db.from('users')
      .select('*, schools(*)')
      .eq('id', impersonateId)
      .single();
    window._impersonatedUser = data;
    return data;
  };

  // ── Override requireAuth so portals don't redirect to login ──
  window.requireAuth = async function (allowedRoles = []) {
    const user = await window.getCurrentUser();
    if (!user) { window.location.href = '/login.html'; return null; }
    // Skip role check — admin can access any portal
    return user;
  };

  // ── Inject the warning banner once DOM is ready ──
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await window.getCurrentUser();
    if (!user) return;

    const roleLabels = {
      teacher: 'Teacher', exam_officer: 'Exam Officer',
      vp_academic: 'VP Academic', vp_admin: 'VP Admin',
      registrar: 'Registrar', accountant: 'Accountant',
      bursary: 'Bursary Officer', admin: 'Admin', staff: 'Staff'
    };
    const roleLabel = roleLabels[user.role] || user.role;

    // Detect how many levels deep we are to build the back link
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const backPath = depth <= 2 ? './admin/index.html' : '../'.repeat(depth - 1) + 'admin/index.html';

    const initials = user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const banner = document.createElement('div');
    banner.id = 'impersonate-banner';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
      'color:#fff', 'font-family:inherit',
      'padding:0 20px', 'height:48px',
      'display:flex', 'align-items:center', 'justify-content:space-between', 'gap:16px',
      'box-shadow:0 2px 12px rgba(0,0,0,0.35)'
    ].join(';');

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0;box-shadow:0 0 6px #f59e0b;animation:et-pulse 2s infinite;"></div>
        <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#f59e0b;flex-shrink:0;">Impersonating</span>
        <div style="width:1px;height:16px;background:rgba(255,255,255,0.15);flex-shrink:0;"></div>
        <div style="width:28px;height:28px;border-radius:50%;background:#f59e0b;color:#1a1a2e;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0;">${initials}</div>
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.full_name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:1px;">${roleLabel}</div>
        </div>
      </div>
      <button id="impersonate-back-btn"
        style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background 0.2s;"
        onmouseover="this.style.background='rgba(255,255,255,0.16)'"
        onmouseout="this.style.background='rgba(255,255,255,0.08)'">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Admin
      </button>
      <style>
        @keyframes et-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      </style>`;

    document.getElementById('impersonate-back-btn')?.addEventListener('click', () => window.location.href = backPath);
    document.body.prepend(banner);

    // Push content down so banner doesn't cover the top of the page
    document.body.style.paddingTop = ((parseInt(document.body.style.paddingTop) || 0) + 48) + 'px';
  });
})();
