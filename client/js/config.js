/**
 * EduTrack NG — Client Configuration
 *
 * API_BASE_URL:
 *   - Set this to your Railway backend URL after deploying.
 *     Example: 'https://edutrac-backend-production.up.railway.app'
 *   - Leave as '' only when client and server are on the same origin.
 */
// js/config.js
// Values are injected by Netlify at build time via _headers or snippet injection.
// Fallback to empty string — will fail gracefully if not set.
const SUPABASE_URL      = (window.__EDUTRAC_CONFIG__ || {}).SUPABASE_URL;
const SUPABASE_ANON_KEY = (window.__EDUTRAC_CONFIG__ || {}).SUPABASE_ANON_KEY;
  // ⬇ Set this to your Railway backend URL after deploying the server.
  // Example: 'https://edutrac-backend-production.up.railway.app'
  API_BASE_URL: 'https://edutrac-ng-production.up.railway.app',
};

// ── Validate at load time ─────────────────────────────────────────
(function () {
  const cfg = window.__EDUTRAC_CONFIG__;
  const missing = [];
  if (!cfg.SUPABASE_URL      || cfg.SUPABASE_URL.startsWith('REPLACE_'))      missing.push('SUPABASE_URL');
  if (!cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.startsWith('REPLACE_')) missing.push('SUPABASE_ANON_KEY');
  if (!cfg.API_BASE_URL      || cfg.API_BASE_URL.startsWith('REPLACE_'))      missing.push('API_BASE_URL (set to your Railway URL)');

  if (missing.length) {
    const msg =
      '❌ EduTrack NG — Missing configuration: ' + missing.join(', ') + '.\n' +
      'Open client/js/config.js and fill in the real values.';
    console.error(msg);
    document.addEventListener('DOMContentLoaded', function () {
      const banner = document.createElement('div');
      banner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:99999;' +
        'background:#c0392b;color:#fff;font-family:monospace;' +
        'font-size:13px;padding:12px 16px;white-space:pre-wrap;';
      banner.textContent = msg;
      document.body.prepend(banner);
    });
  }
})();
