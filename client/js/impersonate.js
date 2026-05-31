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
      bursar_officer: 'Bursary Officer', admin: 'Admin', staff: 'Staff'
    };
    const roleLabel = roleLabels[user.role] || user.role;

    // Detect how many levels deep we are to build the back link
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const backPath = depth <= 2 ? './admin/index.html' : '../'.repeat(depth - 1) + 'admin/index.html';

    const banner = document.createElement('div');
    banner.id = 'impersonate-banner';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'background:#f59e0b', 'color:#1a1a2e', 'font-size:13px', 'font-weight:600',
      'padding:8px 16px', 'display:flex', 'align-items:center',
      'justify-content:space-between', 'gap:12px',
      'box-shadow:0 2px 8px rgba(0,0,0,0.2)'
    ].join(';');

    const nameEl = document.createElement('span');
    nameEl.textContent = `👁️ Viewing as ${user.full_name} — ${roleLabel}`;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to Admin';
    backBtn.style.cssText = 'background:#1a1a2e;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;';
    backBtn.onclick = () => window.location.href = backPath;

    banner.appendChild(nameEl);
    banner.appendChild(backBtn);
    document.body.prepend(banner);

    // Push content down so banner doesn't cover the top of the page
    document.body.style.paddingTop = ((parseInt(document.body.style.paddingTop) || 0) + 40) + 'px';
  });
})();
