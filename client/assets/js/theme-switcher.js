/* ============================================================
   EduTrack NG — Universal Theme Switcher v2.0
   Works on every page: landing, login, admin, portals, etc.
   ============================================================ */

(function () {
  'use strict';

  /* ── Theme definitions ─────────────────────────────────── */
  const THEMES = [
    {
      id: 'green',
      label: 'EduTrack Green',
      sub: 'Default',
      color: '#0a6e3f',
      icon: 'check',
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      sub: 'Night',
      color: '#0f172a',
      icon: 'moon',
    },
    {
      id: 'gold',
      label: 'Royal Gold',
      sub: 'Premium',
      color: '#b8860b',
      icon: 'star',
    },
    {
      id: 'blue',
      label: 'Sapphire Blue',
      sub: '',
      color: '#1a56db',
      icon: '',
    },
    {
      id: 'purple',
      label: 'Violet Purple',
      sub: '',
      color: '#7c3aed',
      icon: '',
    },
    {
      id: 'teal',
      label: 'Ocean Teal',
      sub: '',
      color: '#0d9488',
      icon: '',
    },
    {
      id: 'red',
      label: 'Crimson Red',
      sub: '',
      color: '#dc2626',
      icon: '',
    },
  ];

  const ICON_SVG = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  };

  /* ── CSS injection ─────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('edutrack-theme-css')) return;
    const style = document.createElement('style');
    style.id = 'edutrack-theme-css';
    style.textContent = `
/* ── EduTrack Theme Variables ── */
/* Landing page uses --G / --AU variables; inner pages use --primary / --accent */

/* DEFAULT: green (no data-theme needed) */

/* DARK */
body[data-theme="dark"] {
  /* Landing vars */
  --G: #22c55e; --G2: #16a34a; --G3: #4ade80;
  --GL: #14532d; --GL2: #166534;
  --AU: #fbbf24; --AUL: #1c1400;
  --W: #0f172a; --S: #1e293b; --S2: #334155; --BD: #475569;
  --T: #f1f5f9; --T2: #cbd5e1; --T3: #94a3b8;
  --INK: #020617; --INK2: #0f172a; --INK3: #1e293b;
  /* Inner page vars */
  --primary: #22c55e; --primary-dark: #16a34a; --primary-light: #14532d;
  --accent: #fbbf24; --accent-light: #1c1400;
  --surface: #1e293b; --surface-2: #0f172a; --surface-3: #334155;
  --ink: #f1f5f9; --ink-2: #cbd5e1; --ink-3: #94a3b8; --ink-4: #64748b;
  --border: #334155; --border-2: #475569;
  color-scheme: dark;
}
body[data-theme="dark"] .sidebar { background: #020617; }
body[data-theme="dark"] .card,
body[data-theme="dark"] .stat-card { background: var(--surface); border-color: var(--border); }
body[data-theme="dark"] .topbar { background: var(--surface); border-color: var(--border); }
body[data-theme="dark"] .topbar__title { color: var(--ink); }
body[data-theme="dark"] input, body[data-theme="dark"] select, body[data-theme="dark"] textarea {
  background: var(--surface-3); color: var(--ink); border-color: var(--border);
}
body[data-theme="dark"] .form-control { background: var(--surface-3); color: var(--ink); }
body[data-theme="dark"] table { color: var(--ink); }
body[data-theme="dark"] th { background: var(--surface-3) !important; color: var(--ink-2) !important; }
body[data-theme="dark"] td { border-color: var(--border) !important; }
body[data-theme="dark"] .modal-box, body[data-theme="dark"] .modal-content { background: var(--surface); color: var(--ink); }

/* GOLD */
body[data-theme="gold"] {
  --G: #b8860b; --G2: #8b6508; --G3: #d4a017;
  --GL: #fef9e7; --GL2: #fdf0c2;
  --AU: #1a1a1a; --AUL: #f5f5f0;
  --W: #fffdf4; --S: #fef9e7; --S2: #fef0c7; --BD: #f0d080;
  --T: #1a0f00; --T2: #4a3500; --T3: #8a6a00;
  --INK: #0a0600; --INK2: #1a0f00; --INK3: #2a1f00;
  --primary: #b8860b; --primary-dark: #8b6508; --primary-light: #fef9e7;
  --accent: #0a6e3f; --accent-light: #e6f4ed;
  --surface: #fffdf4; --surface-2: #fef9e7; --surface-3: #fef0c7;
  --ink: #1a0f00; --ink-2: #4a3500; --ink-3: #8a6a00; --ink-4: #b8960a;
  --border: #f0d080; --border-2: #e8c050;
}
body[data-theme="gold"] .sidebar { background: #1a0f00; }
body[data-theme="gold"] .nav-item.active { border-left-color: var(--primary); }
body[data-theme="gold"] .sidebar__logo-icon { background: var(--primary) !important; }
body[data-theme="gold"] .sidebar__avatar { background: var(--primary) !important; }
body[data-theme="gold"] .btn--primary { background: var(--primary); }
body[data-theme="gold"] .btn--primary:hover { background: var(--primary-dark); }

/* BLUE */
body[data-theme="blue"] {
  --G: #1a56db; --G2: #1240a5; --G3: #2563eb;
  --GL: #dbeafe; --GL2: #bfdbfe;
  --AU: #f59e0b; --AUL: #fffbeb;
  --primary: #1a56db; --primary-dark: #1240a5; --primary-light: #dbeafe;
  --accent: #f59e0b; --accent-light: #fffbeb;
}
/* PURPLE */
body[data-theme="purple"] {
  --G: #7c3aed; --G2: #5b21b6; --G3: #8b5cf6;
  --GL: #ede9fe; --GL2: #ddd6fe;
  --AU: #f59e0b; --AUL: #fffbeb;
  --primary: #7c3aed; --primary-dark: #5b21b6; --primary-light: #ede9fe;
  --accent: #f59e0b; --accent-light: #fffbeb;
}
/* TEAL */
body[data-theme="teal"] {
  --G: #0d9488; --G2: #0f766e; --G3: #14b8a6;
  --GL: #ccfbf1; --GL2: #99f6e4;
  --AU: #f59e0b; --AUL: #fffbeb;
  --primary: #0d9488; --primary-dark: #0f766e; --primary-light: #ccfbf1;
  --accent: #f59e0b; --accent-light: #fffbeb;
}
/* RED */
body[data-theme="red"] {
  --G: #dc2626; --G2: #b91c1c; --G3: #ef4444;
  --GL: #fee2e2; --GL2: #fecaca;
  --AU: #f59e0b; --AUL: #fffbeb;
  --primary: #dc2626; --primary-dark: #b91c1c; --primary-light: #fee2e2;
  --accent: #f59e0b; --accent-light: #fffbeb;
}

/* ── Inner-page sidebar accent syncing ── */
body[data-theme] .nav-item.active { border-left-color: var(--primary); }
body[data-theme] .sidebar__avatar { background: var(--primary) !important; }
body[data-theme] .btn--primary { background: var(--primary); }
body[data-theme] .btn--primary:hover:not(:disabled) { background: var(--primary-dark); }
body[data-theme] .stat-card__value { color: var(--primary); }

/* ── Theme Switcher Widget ── */
.et-theme-switcher {
  position: fixed;
  left: 16px;
  bottom: 24px;
  z-index: 9995;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
}

/* Push switcher right on pages with a 260px sidebar */
.app-shell ~ .et-theme-switcher,
body:has(.sidebar) .et-theme-switcher {
  left: 276px;
}

@media (max-width: 820px) {
  body:has(.sidebar) .et-theme-switcher,
  .app-shell ~ .et-theme-switcher {
    left: 16px;
    bottom: 72px; /* above bottom-nav */
  }
}

.et-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,.1);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
  display: none;
  flex-direction: column;
  gap: 0;
  min-width: 224px;
  animation: etPanelUp .18s ease;
  transform-origin: bottom left;
}
.et-panel.open { display: flex; }
@keyframes etPanelUp {
  from { opacity:0; transform: scale(.96) translateY(6px); }
  to   { opacity:1; transform: scale(1)  translateY(0); }
}

body[data-theme="dark"] .et-panel {
  background: #1e293b;
  border-color: rgba(255,255,255,.1);
  box-shadow: 0 16px 48px rgba(0,0,0,.5);
}

.et-panel-title {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #9ca3af;
  margin-bottom: 8px;
  padding: 0 4px;
}
body[data-theme="dark"] .et-panel-title { color: #64748b; }

.et-options { display: flex; flex-direction: column; gap: 2px; }

.et-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 6px 0;
}
body[data-theme="dark"] .et-divider { background: #334155; }

.et-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 11px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  transition: background .12s;
  text-align: left;
  width: 100%;
}
body[data-theme="dark"] .et-opt { color: #e2e8f0; }
.et-opt:hover { background: #f9fafb; }
body[data-theme="dark"] .et-opt:hover { background: #334155; }
.et-opt.active { background: #f0fdf4; color: var(--G, #0a6e3f); }
body[data-theme="dark"]  .et-opt.active { background: rgba(34,197,94,.1); color: #4ade80; }
body[data-theme="gold"]  .et-opt.active { background: #fef9e7; color: #b8860b; }
body[data-theme="blue"]  .et-opt.active { background: #dbeafe; color: #1a56db; }
body[data-theme="purple"].et-opt.active { background: #ede9fe; color: #7c3aed; }
body[data-theme="teal"]  .et-opt.active { background: #ccfbf1; color: #0d9488; }
body[data-theme="red"]   .et-opt.active { background: #fee2e2; color: #dc2626; }

.et-opt-inner { display: flex; align-items: center; gap: 10px; flex: 1; }
.et-opt-badge { font-size: 10px; color: #9ca3af; font-weight: 500; }
body[data-theme="dark"] .et-opt-badge { color: #64748b; }

.et-swatch {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,.14);
  transition: box-shadow .15s;
}
.et-swatch svg { width: 13px; height: 13px; }
.et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px var(--G, #0a6e3f); }
body[data-theme="gold"]   .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #b8860b; }
body[data-theme="blue"]   .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #1a56db; }
body[data-theme="purple"] .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #7c3aed; }
body[data-theme="teal"]   .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #0d9488; }
body[data-theme="red"]    .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #dc2626; }
body[data-theme="dark"]   .et-opt.active .et-swatch { box-shadow: 0 0 0 2.5px #22c55e; }

/* Toggle button */
.et-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 15px;
  border-radius: 28px;
  background: rgba(8,12,16,.85);
  border: 1px solid rgba(255,255,255,.15);
  color: rgba(255,255,255,.82);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: all .2s;
  letter-spacing: .2px;
  white-space: nowrap;
}
body[data-theme="gold"] .et-toggle {
  background: rgba(26,15,0,.85);
  border-color: rgba(240,200,80,.3);
}
.et-toggle:hover {
  background: rgba(8,12,16,.96);
  border-color: rgba(255,255,255,.3);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(0,0,0,.32);
}

.et-toggle-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--G, #0a6e3f);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background .25s;
}
.et-toggle-dot svg { width: 10px; height: 10px; stroke: white; fill: none; stroke-width: 2; }

.et-chevron {
  width: 13px;
  height: 13px;
  opacity: .5;
  margin-left: 1px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2.5;
  transition: transform .2s;
  flex-shrink: 0;
}
.et-theme-switcher.open .et-chevron { transform: rotate(180deg); }

/* Landing-page overrides: switcher is already dark-bg friendly */
/* On light inner pages (with .app-shell) auto-adjust the toggle bg: */
body:has(.app-shell) .et-toggle {
  background: rgba(8,12,16,.78);
}
`;
    document.head.appendChild(style);
  }

  /* ── Build the widget HTML ─────────────────────────────── */
  function buildWidget() {
    const wrap = document.createElement('div');
    wrap.className = 'et-theme-switcher';
    wrap.id = 'etSwitcher';

    // Panel
    const panel = document.createElement('div');
    panel.className = 'et-panel';
    panel.id = 'etPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Display theme chooser');

    const title = document.createElement('div');
    title.className = 'et-panel-title';
    title.textContent = 'Display & Appearance';
    panel.appendChild(title);

    const opts = document.createElement('div');
    opts.className = 'et-options';

    // Separate premium (dark, gold) from the colour themes
    const premium = THEMES.filter(t => ['dark', 'gold'].includes(t.id));
    const colours = THEMES.filter(t => !['dark', 'gold'].includes(t.id));

    function makeOpt(t) {
      const btn = document.createElement('button');
      btn.className = 'et-opt';
      btn.dataset.theme = t.id;
      btn.setAttribute('aria-pressed', 'false');
      const iconHtml = t.icon && ICON_SVG[t.icon]
        ? ICON_SVG[t.icon]
        : '';
      btn.innerHTML = `
        <div class="et-opt-inner">
          <span class="et-swatch" style="background:${t.color}">${iconHtml}</span>
          ${t.label}
        </div>
        ${t.sub ? `<span class="et-opt-badge">${t.sub}</span>` : ''}
      `;
      btn.addEventListener('click', () => applyTheme(t.id));
      return btn;
    }

    colours.forEach(t => opts.appendChild(makeOpt(t)));

    const div = document.createElement('div');
    div.className = 'et-divider';
    opts.appendChild(div);

    premium.forEach(t => opts.appendChild(makeOpt(t)));

    panel.appendChild(opts);
    wrap.appendChild(panel);

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'et-toggle';
    toggle.id = 'etToggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'etPanel');
    toggle.setAttribute('title', 'Change appearance');
    toggle.innerHTML = `
      <span class="et-toggle-dot" id="etDot">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </span>
      Appearance
      <svg class="et-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    wrap.appendChild(toggle);

    document.body.appendChild(wrap);
  }

  /* ── Panel open/close ──────────────────────────────────── */
  function togglePanel() {
    const panel  = document.getElementById('etPanel');
    const toggle = document.getElementById('etToggle');
    const wrap   = document.getElementById('etSwitcher');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    wrap.classList.toggle('open', isOpen);
  }

  function closePanel() {
    const panel  = document.getElementById('etPanel');
    const toggle = document.getElementById('etToggle');
    const wrap   = document.getElementById('etSwitcher');
    if (!panel) return;
    panel.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    wrap?.classList.remove('open');
  }

  /* ── Apply a theme ─────────────────────────────────────── */
  function applyTheme(id) {
    const body = document.body;

    if (id === 'green') {
      body.removeAttribute('data-theme');
    } else {
      body.setAttribute('data-theme', id);
    }

    // Sync active state on buttons
    document.querySelectorAll('.et-opt').forEach(btn => {
      const active = btn.dataset.theme === id;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active);
    });

    // Sync dot colour
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const dot = document.getElementById('etDot');
    if (dot) dot.style.background = theme.color;

    // Persist
    try { localStorage.setItem('edutrack-theme', id); } catch {}

    closePanel();
  }

  /* ── Restore saved theme ───────────────────────────────── */
  function restoreTheme() {
    let saved = 'green';
    try { saved = localStorage.getItem('edutrack-theme') || 'green'; } catch {}
    applyTheme(saved);
  }

  /* ── Keyboard: Escape closes panel ────────────────────── */
  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel();
    });
  }

  /* ── Outside click closes panel ───────────────────────── */
  function bindOutsideClick() {
    document.addEventListener('click', e => {
      const wrap = document.getElementById('etSwitcher');
      if (wrap && !wrap.contains(e.target)) closePanel();
    });
  }

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    injectCSS();
    buildWidget();
    restoreTheme();
    bindKeyboard();
    bindOutsideClick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose globally so index.html's inline script keeps working */
  window.EduTrackTheme = { apply: applyTheme };

})();
