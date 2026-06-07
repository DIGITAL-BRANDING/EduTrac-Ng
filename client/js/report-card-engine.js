// ============================================================
//  EduTrack NG — js/report-card-engine.js
//  ONE shared file for ALL report card rendering.
//  Imported by:
//    - report-card/index.html       (admin / class view)
//    - portals/parent/result-checker.html  (public PIN checker)
//
//  To change card layout, grades, styles, sections — edit HERE only.
// ============================================================

/* ═══════════════════════════════════════════════════════════
   CSS  — injected once into <head> so both pages share styles
═══════════════════════════════════════════════════════════ */
(function injectReportCardStyles() {
  if (document.getElementById('rc-engine-styles')) return; // already injected
  const style = document.createElement('style');
  style.id = 'rc-engine-styles';
  style.textContent = `
/* ── Google Fonts (loaded once) ─────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:wght@400;700;900&family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Poppins:wght@400;500;600;700&family=Quicksand:wght@500;600;700&display=swap');

/* ── CSS variables (theme) ───────────────────────────────── */
:root {
  --primary:#1a2e6e; --primary-dark:#111e4a; --primary-light:#2a44a0;
  --accent:#c8860a;  --accent-light:#f0c040;
  --co-bg:#fff8e6;   --co-hdr:#c8860a;
  --disc-bg:#e6f3fb; --disc-hdr:#1a6eaa;
  --grade-row:#e8f0fc;
}

/* ── Loader ──────────────────────────────────────────────── */
.rc-loader{max-width:820px;margin:80px auto;text-align:center;font-family:sans-serif;color:#555;}
.rc-spinner{width:44px;height:44px;border:4px solid #ddd;border-top-color:var(--primary);border-radius:50%;animation:rcSpin .8s linear infinite;margin:0 auto 16px;}
@keyframes rcSpin{to{transform:rotate(360deg)}}
.rc-loader-steps{margin-top:12px;font-size:12px;color:#888;line-height:1.8;}
.step-done{color:#16a34a;} .step-active{color:var(--primary);font-weight:600;} .step-wait{color:#ccc;}

/* ── Error box ───────────────────────────────────────────── */
.err-box{max-width:820px;margin:50px auto;padding:32px 28px;background:white;border-radius:8px;
  box-shadow:0 2px 14px rgba(0,0,0,.12);font-family:sans-serif;border-left:5px solid #ef4444;}
.err-box h2{color:#b91c1c;font-size:16px;margin-bottom:8px;}
.err-box p{font-size:13px;color:#555;margin-bottom:6px;}
.err-box code{display:block;margin-top:10px;background:#fef2f2;border:1px solid #fca5a5;padding:8px 12px;
  border-radius:5px;font-size:12px;color:#991b1b;word-break:break-all;white-space:pre-wrap;}
.err-retry{display:inline-block;margin-top:14px;padding:8px 18px;background:var(--primary);color:white;
  border:none;border-radius:5px;font-size:13px;font-family:sans-serif;cursor:pointer;font-weight:600;}

/* ── No results box ──────────────────────────────────────── */
.no-report-card{max-width:820px;margin:30px auto;background:#fff3cd;border-left:5px solid #ffc107;
  border-radius:8px;padding:32px 28px;text-align:center;font-family:'Segoe UI',sans-serif;
  box-shadow:0 2px 14px rgba(0,0,0,.08);}
.no-report-card svg{width:64px;height:64px;margin-bottom:16px;color:#856404;}
.no-report-card h3{color:#856404;font-size:22px;margin-bottom:12px;}
.no-report-card p{color:#533f03;font-size:14px;margin-bottom:20px;}
.no-report-card button{background:#856404;color:white;border:none;padding:10px 24px;
  border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin:0 8px;}
.no-report-card button:hover{background:#6c4a04;}

/* ── Card wrapper ────────────────────────────────────────── */
.card-wrap{max-width:820px;margin:14px auto 0;}
.report-card{background:white;box-shadow:0 4px 22px rgba(0,0,0,.15);padding:10px;}
.card-stamp{text-align:center;font-size:9px;color:#aaa;font-style:italic;padding:5px;border-top:1px solid #eee;background:white;}

/* ── Decorative border ───────────────────────────────────── */
.deco-border{border:4px solid var(--primary);padding:5px;position:relative;}
.deco-border::before{content:'';position:absolute;inset:4px;border:none;pointer-events:none;z-index:0;}
.deco-border::after{content:'';position:absolute;inset:0;
  background-image:radial-gradient(circle at 0% 0%,var(--accent) 0,transparent 14px),radial-gradient(circle at 100% 0%,var(--accent) 0,transparent 14px),radial-gradient(circle at 0% 100%,var(--accent) 0,transparent 14px),radial-gradient(circle at 100% 100%,var(--accent) 0,transparent 14px);
  pointer-events:none;z-index:1;}
.card-inner{border:none;position:relative;z-index:2;background:white;overflow:hidden;}
.card-inner::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,#bbb 1px,transparent 1px);background-size:22px 22px;opacity:.05;pointer-events:none;z-index:0;}
.card-inner>*{position:relative;z-index:1;}
.deco-strip{height:11px;background:repeating-linear-gradient(90deg,var(--primary) 0px,var(--primary) 6px,var(--accent-light) 6px,var(--accent-light) 12px);opacity:.82;}

/* ── Card header (secondary) ─────────────────────────────── */
.rc-header{padding:13px 15px 9px;display:grid;grid-template-columns:80px 1fr 88px;gap:10px;align-items:center;border-bottom:2px solid var(--primary);}
.logo-circle{width:70px;height:70px;border-radius:50%;border:3px double var(--primary);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f7f7f7;flex-shrink:0;}
.logo-circle img{width:100%;height:100%;object-fit:cover;}
.logo-fb{font-family:'Cinzel',serif;font-size:9px;font-weight:700;color:var(--primary);text-align:center;line-height:1.3;padding:5px;}
.hc{text-align:center;min-width:0;}
.school-name{font-family:'Cinzel',serif;font-size:clamp(11px,1.8vw,20px);font-weight:900;color:var(--primary);letter-spacing:.5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media print{.school-name{font-size:14px;white-space:normal;word-break:break-word;}}
.school-meta{font-size:10px;color:#555;margin-top:3px;font-style:italic;}
.gold-div{height:2px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent-light),var(--accent),transparent);margin:5px auto;width:75%;}
.card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--primary);}
.sess-txt{font-size:12px;color:var(--accent);font-weight:600;margin-top:2px;}
.cls-line{font-size:12px;color:#333;margin-top:3px;font-style:italic;}
.cls-line span{border-bottom:1px dotted #888;min-width:70px;display:inline-block;font-style:normal;font-weight:700;color:var(--primary-dark);}

/* ── Passport photo ──────────────────────────────────────── */
.pp-box{display:flex;flex-direction:column;align-items:center;gap:3px;}
.pp-frame{width:76px;height:92px;border:2px solid var(--primary);background:#f7f7f7;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;}
.pp-frame img{width:100%;height:100%;object-fit:cover;}
.pp-ph{text-align:center;font-size:9px;color:#bbb;font-family:sans-serif;line-height:1.4;padding:4px;}
.pp-ph svg{display:block;margin:0 auto 3px;}
.pp-lbl{font-size:9px;color:#999;font-style:italic;}

/* ── Info strip ──────────────────────────────────────────── */
.info-strip{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid var(--primary);font-size:12px;}
.info-row{display:flex;align-items:baseline;padding:5px 13px;border-bottom:1px solid #e4e4e4;gap:5px;}
.info-row:nth-child(odd){border-right:1px solid #ddd;}
.info-row:nth-last-child(-n+2){border-bottom:none;}
.il{font-weight:700;color:#333;white-space:nowrap;min-width:106px;}
.iv{border-bottom:1px dotted #bbb;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;}

/* ── Section headers ─────────────────────────────────────── */
.sec-hdr{background:var(--primary);color:white;font-family:'Cinzel',serif;font-size:9px;letter-spacing:1.5px;padding:4px 13px;text-transform:uppercase;font-weight:600;}

/* ── Academic table ──────────────────────────────────────── */
.aw{overflow-x:auto;}
table.ac{width:100%;border-collapse:collapse;font-size:11.5px;}
table.ac th,table.ac td{border:1px solid var(--primary);padding:4px 5px;text-align:center;vertical-align:middle;}
table.ac th{background:var(--primary);color:white;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:.4px;font-weight:600;}
td.sn{text-align:left!important;font-weight:700;font-size:12px;color:var(--primary-dark);padding-left:11px;background:#fafbff;}
th.sn-h{text-align:left!important;padding-left:11px;}
table.ac tr:nth-child(even) td:not(.sn){background:#f5f8ff;}
.gb{display:inline-block;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:700;}
.gAp{background:#dcfce7;color:#15803d}.gA{background:#bbf7d0;color:#166534}.gBp{background:#dbeafe;color:#1d4ed8}
.gB{background:#bfdbfe;color:#1e40af}.gCp{background:#fef9c3;color:#854d0e}.gC{background:#fde68a;color:#92400e}
.gD{background:#fed7aa;color:#9a3412}.gF{background:#fee2e2;color:#991b1b}.gDf{background:#f3f4f6;color:#6b7280}

/* ── Summary band ────────────────────────────────────────── */
.sum-band{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid var(--primary);border-bottom:2px solid var(--primary);}
.sum-cell{text-align:center;padding:7px 4px;border-right:1px solid var(--primary);}
.sum-cell:last-child{border-right:none;}
.sl{display:inline-block;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:1px;text-transform:uppercase;color:white;padding:1px 7px;border-radius:2px;margin-bottom:4px;}
.sl.c1{background:var(--primary)}.sl.c2{background:var(--accent)}.sl.c3{background:#16a34a}.sl.c4{background:#7c3aed}
.sv{display:block;font-family:'Playfair Display',serif;font-size:20px;font-weight:700;line-height:1;}

/* ── Co-scholastic / discipline ──────────────────────────── */
.two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #ddd;}
.co-col{border-right:2px solid var(--primary);}
.co-h,.di-h{text-align:center;padding:4px 8px;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:white;}
.co-h{background:var(--co-hdr);}.di-h{background:var(--disc-hdr);}
.ach{display:flex;justify-content:space-between;align-items:center;padding:3px 11px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.4px;}
.co-col .ach{background:rgba(200,134,10,.1);color:#7a4f00;}
.di-col .ach{background:rgba(26,110,170,.1);color:#0a3d5e;}
.ar{display:flex;align-items:center;justify-content:space-between;padding:4px 11px;border-bottom:1px solid rgba(0,0,0,.07);font-size:11px;}
.co-col .ar{background:var(--co-bg);}
.di-col .ar{background:var(--disc-bg);}
.ar:nth-child(even){filter:brightness(.97);}
.grade-box{min-width:38px;height:18px;border:1px solid #aaa;background:white;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#333;}

/* ── Remarks ─────────────────────────────────────────────── */
.rm-row{padding:6px 13px;font-size:11.5px;border-top:1px solid #eee;}
.rm-lbl{font-family:'Cinzel',serif;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:2px;}
.promo-band{padding:7px 15px;border-top:1px solid #ddd;background:#fffef0;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:var(--primary-dark);}
.promo-band span{border-bottom:1.5px dotted var(--accent);min-width:60px;display:inline-block;font-style:italic;}
.nt-row{padding:5px 15px;font-size:11px;border-top:1px solid #eee;background:#fffbeb;}

/* ── Grading scale ───────────────────────────────────────── */
.gs-wrap{padding:6px 13px;border-top:1px solid #ddd;background:#f8f8f8;}
.gs-title{font-family:'Cinzel',serif;font-size:8px;text-align:center;letter-spacing:1.5px;text-transform:uppercase;color:var(--primary);margin-bottom:4px;font-weight:600;}
table.gs{width:100%;border-collapse:collapse;font-size:11px;}
table.gs th{background:var(--primary);color:white;padding:4px 5px;text-align:center;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.4px;}
table.gs td{border:1px solid #ccc;padding:3px 5px;text-align:center;background:white;font-weight:600;}
table.gs tr td:first-child{background:var(--grade-row);}

/* ── Signatures ──────────────────────────────────────────── */
.sig-ft{display:grid;grid-template-columns:repeat(4,1fr);padding:9px 15px 7px;border-top:2px solid var(--primary);background:#fafafa;gap:5px;}
.sig-bl{text-align:center;}
.sig-ln{border-top:1px solid #666;margin:24px auto 4px;width:76%;min-height:42px;display:flex;align-items:flex-end;justify-content:center;}
.sig-ln img{max-height:40px;max-width:90%;object-fit:contain;}
.sig-la{font-family:'Cinzel',serif;font-size:9px;color:#333;letter-spacing:.4px;}
.sig-sl{font-size:8px;color:#999;margin-top:1px;}

/* ── Print rules ─────────────────────────────────────────── */
@media print {
  /* ── Hide all UI chrome ── */
  .no-print { display:none!important; }
  .rc-shell-header { display:none!important; }   /* portal nav/header */
  .rc-page-header  { display:none!important; }   /* legacy portal header class */
  .card-action-bar { display:none!important; }
  .usage-banner-ok, .usage-banner-expired { display:none!important; }
  .control-bar { display:none!important; }
  .class-banner { display:none!important; }
  .card-action-bar { display:none!important; }
  /* ── AI assistant floating button ── */
  #ai-assistant-btn,
  #assistant-btn,
  .ai-assistant,
  .assistant-fab,
  [id*="assistant"],
  [class*="assistant-btn"],
  [class*="ai-fab"] { display:none!important; }
  /* ── Clean page background ── */
  .rc-shell { background:white!important; padding:0!important; min-height:unset!important; }
  body { background:white!important; padding:0!important; }
  /* ── Card cosmetics ── */
  .report-card { box-shadow:none!important; }
  .card-wrap { margin:0!important; }
  .deco-border { border:3px solid #000!important; }
  .print-page-break { page-break-before:always; }
}

/* ══ NURSERY SECTION ══════════════════════════════════════ */
.ns-card{font-family:'Nunito',sans-serif;}
.ns-card .report-card{padding:0;border-radius:18px;overflow:hidden;}
.ns-card .deco-border{border:5px dashed #ff6b6b !important;border-radius:18px;padding:8px;background:linear-gradient(135deg,#fff9f0 0%,#f0faff 50%,#fff0f9 100%);}
.ns-card .deco-border::before{border:none;}
.ns-card .deco-border::after{background-image:none;}
.ns-card .card-inner{border-radius:12px;border:none;overflow:visible;}
.ns-card .card-inner::before{display:none;}
.ns-rainbow-strip{height:14px;background:linear-gradient(90deg,#ff6b6b,#ff9f43,#ffd32a,#0be881,#18dcff,#7d5fff,#ff6b6b);border-radius:8px 8px 0 0;}
.ns-header{padding:16px 16px 12px;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 50%,#a18cd1 100%);position:relative;overflow:hidden;}
.ns-header::before{content:'⭐';position:absolute;top:-6px;right:12px;font-size:40px;opacity:.18;}
.ns-logo{width:76px;height:76px;border-radius:50%;border:4px solid white;overflow:hidden;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.18);flex-shrink:0;}
.ns-logo img{width:100%;height:100%;object-fit:cover;}
.ns-logo-fb{font-size:8px;font-weight:800;color:#e65c00;text-align:center;padding:4px;font-family:'Fredoka One',sans-serif;}
.ns-hc{flex:1;text-align:center;}
.ns-school{font-family:'Fredoka One',cursive;font-size:clamp(14px,3vw,24px);color:#3d0c8f;text-shadow:1px 1px 0 rgba(255,255,255,.7);line-height:1.2;}
.ns-meta{font-size:10px;color:#5a3a6b;margin:3px 0 5px;}
.ns-title{font-family:'Fredoka One',cursive;font-size:17px;color:#e65c00;letter-spacing:.5px;}
.ns-sess{font-size:11px;color:#7d4cbb;font-weight:600;margin-top:2px;}
.ns-class{font-size:12px;color:#444;font-weight:700;margin-top:2px;}
.ns-pp{width:70px;height:88px;border-radius:8px;border:3px solid white;overflow:hidden;background:#f3e8ff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.2);cursor:pointer;flex-shrink:0;}
.ns-pp img{width:100%;height:100%;object-fit:cover;}
.ns-pp-ph{text-align:center;font-size:9px;color:#aaa;font-family:sans-serif;line-height:1.4;padding:4px;}
.ns-info{display:grid;grid-template-columns:1fr 1fr;border-bottom:3px solid #ffd32a;font-size:12px;font-family:'Nunito',sans-serif;}
.ns-info-row{display:flex;padding:5px 13px;gap:5px;align-items:center;border-bottom:1px solid rgba(0,0,0,.05);}
.ns-info-row:nth-child(odd){background:#fff9f0;border-right:2px dashed #ffd32a;}
.ns-info-row:nth-child(even){background:#f0faff;}
.ns-il{font-weight:800;color:#5a3a6b;white-space:nowrap;min-width:90px;font-size:11px;}
.ns-iv{font-weight:600;color:#333;flex:1;}
.ns-sec-hdr{padding:6px 14px;font-family:'Fredoka One',cursive;font-size:13px;letter-spacing:.5px;color:white;background:linear-gradient(90deg,#7d5fff,#18dcff);}
.ns-skill-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.ns-skill-item{display:flex;align-items:center;justify-content:space-between;padding:6px 13px;border-bottom:1px solid rgba(0,0,0,.05);}
.ns-skill-item:nth-child(odd){background:#fff3e0;border-right:2px dashed #ff9f43;}
.ns-skill-item:nth-child(even){background:#e8f5e9;}
.ns-skill-name{font-weight:700;color:#444;font-size:11.5px;}
.ns-star-fill{color:#ffd32a;font-size:14px;}
.ns-star-empty{color:#ddd;font-size:14px;}
.ns-grade-pill{padding:2px 10px;border-radius:20px;font-size:11px;font-weight:800;background:#ffd32a;color:#7d4c00;}
.ns-subj-table{width:100%;border-collapse:collapse;font-size:11.5px;font-family:'Nunito',sans-serif;}
.ns-subj-table th{padding:6px 8px;text-align:center;font-family:'Fredoka One',cursive;font-size:11px;letter-spacing:.3px;}
.ns-subj-table th:first-child{text-align:left;padding-left:14px;}
.ns-subj-table td{border-bottom:1px solid rgba(0,0,0,.06);padding:5px 7px;text-align:center;vertical-align:middle;}
.ns-subj-table td:first-child{text-align:left;font-weight:700;color:#3d0c8f;padding-left:14px;}
.ns-subj-table tr:nth-child(odd){background:#fff9f0;}
.ns-subj-table tr:nth-child(even){background:#f0f9ff;}
.ns-th-row{background:linear-gradient(90deg,#ff9f43,#ffd32a);}
.ns-summary{display:flex;gap:0;border-top:3px solid #ffd32a;border-bottom:3px solid #ffd32a;}
.ns-sum-cell{flex:1;text-align:center;padding:10px 5px;position:relative;}
.ns-sum-cell:not(:last-child){border-right:2px dashed #ffd32a;}
.ns-sum-cell:nth-child(1){background:#fff3e0;}.ns-sum-cell:nth-child(2){background:#e8f5e9;}
.ns-sum-cell:nth-child(3){background:#e3f2fd;}.ns-sum-cell:nth-child(4){background:#fce4ec;}
.ns-sum-lbl{font-family:'Fredoka One',cursive;font-size:9px;letter-spacing:.5px;display:block;color:#666;}
.ns-sum-val{font-family:'Fredoka One',cursive;font-size:22px;line-height:1;display:block;margin-top:2px;}
.ns-sum-icon{font-size:18px;display:block;margin-bottom:2px;}
.ns-remark{padding:7px 13px;font-size:12px;border-top:2px dashed rgba(0,0,0,.08);background:#fffbf0;}
.ns-remark-lbl{font-family:'Fredoka One',cursive;font-size:10px;color:#e65c00;display:block;margin-bottom:2px;}
.ns-promo{padding:9px 14px;background:linear-gradient(90deg,#e0f7fa,#f9fbe7);font-family:'Fredoka One',cursive;font-size:14px;color:#00796b;border-top:2px dashed #80cbc4;}
.ns-sig{display:grid;grid-template-columns:1fr 1fr;padding:10px 14px 8px;border-top:3px dashed #ffd32a;background:#fffbf0;gap:8px;}
.ns-sig-bl{text-align:center;}
.ns-sig-ln{border-top:2px dashed #bbb;margin:22px auto 4px;width:76%;min-height:36px;display:flex;align-items:flex-end;justify-content:center;}
.ns-sig-ln img{max-height:34px;max-width:88%;object-fit:contain;}
.ns-sig-la{font-family:'Fredoka One',cursive;font-size:10px;color:#5a3a6b;letter-spacing:.3px;}
.ns-sig-sl{font-size:8.5px;color:#aaa;margin-top:1px;}

/* ══ PRIMARY SECTION ══════════════════════════════════════ */
.pr-card{font-family:'Poppins',sans-serif;}
.pr-card .report-card{padding:8px;}
.pr-card .deco-border{border:4px solid #1a7a4e !important;border-radius:4px;}
.pr-card .deco-border::before{border-color:#4ade80;}
.pr-card .deco-border::after{background-image:radial-gradient(circle at 0% 0%,#1a7a4e 0,transparent 14px),radial-gradient(circle at 100% 0%,#1a7a4e 0,transparent 14px),radial-gradient(circle at 0% 100%,#1a7a4e 0,transparent 14px),radial-gradient(circle at 100% 100%,#1a7a4e 0,transparent 14px);}
.pr-card .card-inner{border-color:#1a7a4e;}
.pr-card .deco-strip{background:repeating-linear-gradient(90deg,#1a7a4e 0px,#1a7a4e 6px,#4ade80 6px,#4ade80 12px);}
.pr-header{padding:13px 15px 10px;display:grid;grid-template-columns:82px 1fr 90px;gap:10px;align-items:center;border-bottom:3px solid #1a7a4e;background:linear-gradient(135deg,#f0faf4 0%,#e8f8f2 100%);}
.pr-logo{width:72px;height:72px;border-radius:50%;border:3px solid #1a7a4e;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;}
.pr-logo img{width:100%;height:100%;object-fit:cover;}
.pr-logo-fb{font-family:'Poppins',sans-serif;font-size:8px;font-weight:700;color:#1a7a4e;text-align:center;padding:5px;line-height:1.3;}
.pr-hc{text-align:center;}
.pr-school{font-family:'Quicksand',sans-serif;font-size:clamp(13px,2.5vw,22px);font-weight:700;color:#1a7a4e;letter-spacing:.4px;line-height:1.2;}
.pr-meta{font-size:10px;color:#555;margin-top:3px;font-style:italic;}
.pr-divider{height:2px;background:linear-gradient(90deg,transparent,#4ade80,#1a7a4e,#4ade80,transparent);margin:5px auto;width:75%;}
.pr-title{font-family:'Quicksand',sans-serif;font-size:16px;font-weight:700;color:#1a7a4e;}
.pr-sess{font-size:12px;color:#2d6a4f;font-weight:600;margin-top:2px;}
.pr-class{font-size:12px;color:#444;margin-top:2px;font-style:italic;}
.pr-class span{border-bottom:1px dotted #888;min-width:70px;display:inline-block;font-style:normal;font-weight:700;color:#1a4a32;}
.pr-pp{width:76px;height:92px;border:2px solid #1a7a4e;background:#f0faf4;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;}
.pr-pp img{width:100%;height:100%;object-fit:cover;}
.pr-pp-ph{text-align:center;font-size:9px;color:#bbb;font-family:sans-serif;line-height:1.4;padding:4px;}
.pr-info{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #1a7a4e;font-size:12px;}
.pr-info-row{display:flex;align-items:baseline;padding:5px 13px;border-bottom:1px solid #e0f0e8;gap:5px;}
.pr-info-row:nth-child(odd){background:#f8fffe;border-right:1px solid #cde8d8;}
.pr-info-row:nth-child(even){background:#ffffff;}
.pr-info-row:nth-last-child(-n+2){border-bottom:none;}
.pr-il{font-weight:700;color:#2d6a4f;white-space:nowrap;min-width:106px;}
.pr-iv{border-bottom:1px dotted #98d8b4;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;}
.pr-sec-hdr{background:linear-gradient(90deg,#1a7a4e,#2d9e68);color:white;font-family:'Quicksand',sans-serif;font-size:10px;letter-spacing:1.5px;padding:5px 13px;text-transform:uppercase;font-weight:700;}
.pr-table{width:100%;border-collapse:collapse;font-size:11.5px;}
.pr-table th,.pr-table td{border:1px solid #b7e4c7;padding:4px 5px;text-align:center;vertical-align:middle;}
.pr-table th{background:linear-gradient(90deg,#1a7a4e,#40916c);color:white;font-family:'Quicksand',sans-serif;font-size:9px;letter-spacing:.5px;font-weight:700;}
.pr-table td.sn{text-align:left;font-weight:700;font-size:12px;color:#1a4a32;padding-left:11px;background:#f0faf4;}
.pr-table tr:nth-child(even) td:not(.sn){background:#f0fef4;}
.pr-sum{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid #1a7a4e;border-bottom:2px solid #1a7a4e;}
.pr-sum-cell{text-align:center;padding:8px 4px;border-right:1px solid #b7e4c7;}
.pr-sum-cell:last-child{border-right:none;}
.pr-sum-cell:nth-child(1){background:#f0faf4;}.pr-sum-cell:nth-child(2){background:#fffbf0;}
.pr-sum-cell:nth-child(3){background:#f0fff4;}.pr-sum-cell:nth-child(4){background:#f5f0ff;}
.pr-sl{display:inline-block;font-family:'Quicksand',sans-serif;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:white;padding:1px 8px;border-radius:3px;margin-bottom:4px;}
.pr-sv{display:block;font-family:'Quicksand',sans-serif;font-size:20px;font-weight:700;line-height:1;}
.pr-two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #cde8d8;}
.pr-co-col{border-right:2px solid #1a7a4e;}
.pr-co-h{background:linear-gradient(90deg,#2d9e68,#52b788);color:white;text-align:center;padding:5px 8px;font-family:'Quicksand',sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;}
.pr-di-h{background:linear-gradient(90deg,#0077b6,#0096c7);color:white;text-align:center;padding:5px 8px;font-family:'Quicksand',sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;}
.pr-ach{display:flex;justify-content:space-between;align-items:center;padding:3px 11px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.4px;}
.pr-co-col .pr-ach{background:rgba(26,122,78,.08);color:#1a4a32;}
.pr-di-col .pr-ach{background:rgba(0,119,182,.08);color:#00487c;}
.pr-ar{display:flex;align-items:center;justify-content:space-between;padding:4px 11px;border-bottom:1px solid rgba(0,0,0,.06);font-size:11px;}
.pr-co-col .pr-ar{background:#f0faf4;}
.pr-di-col .pr-ar{background:#f0f8ff;}
.pr-ar:nth-child(even){filter:brightness(.97);}
.pr-grade-box{min-width:38px;height:18px;border:1px solid #b7e4c7;background:white;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1a4a32;}
.pr-promo{padding:7px 15px;border-top:1px solid #cde8d8;background:#f0faf4;font-family:'Quicksand',sans-serif;font-size:13px;font-weight:700;color:#1a4a32;}
.pr-promo span{border-bottom:1.5px dotted #2d9e68;min-width:60px;display:inline-block;font-style:italic;}
.pr-sig{display:grid;grid-template-columns:repeat(4,1fr);padding:9px 15px 7px;border-top:2px solid #1a7a4e;background:#f8fffe;gap:5px;}
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════════════════
   SHARED STATE — set by the page that imports this file
═══════════════════════════════════════════════════════════ */
let _school      = null;
let _scale       = null;
let _exams       = null;
let _term        = null;
let _classRow    = null;
let _classSubjects  = null;
let _bulkResults    = null;
let _bulkAtt        = null;
let _bulkAffective  = null;
let _allTerms       = [];
let _currentStudent = null;

/* ═══════════════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════════════ */
function gradeFromScale(score, scale) {
  if (score === null || score === undefined || !scale?.length) return { grade:'—', remark:'' };
  const g = scale.find(s => score >= s.min_score && score <= s.max_score);
  return g ? { grade: g.grade, remark: g.remark || '' } : { grade:'—', remark:'' };
}

function gradeBadge(g) {
  if (!g || g === '—') return '<span class="gb gDf">—</span>';
  const m = {'A+':'Ap','A':'A','B+':'Bp','B':'B','C+':'Cp','C':'C','D':'D','F':'F','F9':'F','E8':'F','D7':'D'};
  const c = m[g] || (g.startsWith('A') ? 'Ap' : g.startsWith('B') ? 'Bp' : g.startsWith('C') ? 'Cp' : 'Df');
  return `<span class="gb g${c}">${g}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' }); }
  catch { return d; }
}

function sigHTML(label, url) {
  return `<div class="sig-bl"><div class="sig-ln">${url ? `<img src="${url}" alt="${label}" crossorigin="anonymous">` : ''}</div>
    <div class="sig-la">${label}</div><div class="sig-sl">Signature &amp; Stamp</div></div>`;
}

function rmHTML(label, text, bg, color) {
  if (!text) return '';
  return `<div class="rm-row" style="background:${bg}"><span class="rm-lbl" style="color:${color}">${label}</span>${text}</div>`;
}

function actRows(fields, data) {
  return fields.map(([k,l]) => `<div class="ar"><span>${l}</span><span class="grade-box">${data?.[k] || ''}</span></div>`).join('');
}

function loadPP(e, sid) {
  const file = e.target.files[0]; if (!file) return;
  const rd = new FileReader();
  rd.onload = ev => {
    const img = document.getElementById('ppImg_' + sid);
    const ph  = document.getElementById('ppPh_'  + sid);
    if (img) { img.src = ev.target.result; img.style.display = 'block'; }
    if (ph)  ph.style.display = 'none';
  };
  rd.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════════
   SECTION TYPE DETECTION
═══════════════════════════════════════════════════════════ */
function getSectionType(classRow) {
  const s = (classRow?.level || classRow?.section || classRow?.name || '').toLowerCase();
  if (/nursery|crèche|creche|toddler|kinder|reception|pre[\s-]?school|early|playgroup|kg|k\.g|kindergarten/.test(s)) return 'nursery';
  if (/primary|junior|basic|elementary|standard|pry|jss|jnr|lower/.test(s)) return 'primary';
  return 'secondary';
}

/* ═══════════════════════════════════════════════════════════
   SHARED DATA PREP
═══════════════════════════════════════════════════════════ */
function prepCardData(student, results, attData, affective) {
  const cn  = _classRow?.name || '—';
  const sec = (_classRow?.section || _classRow?.level || '').toUpperCase();
  const classLabel = sec ? `${cn} — Section ${sec}` : cn;

  // Deduplicate exams
  const examMap = new Map();
  const rawExamList = _exams?.length ? _exams : [...new Map((results||[]).map(r=>[r.exam_id, r.exams])).values()].filter(Boolean);
  rawExamList.forEach(e => { if (e && !examMap.has(e.id)) examMap.set(e.id, e); });
  const examList = [...examMap.values()];

  // Build subject base
  let subjectBase;
  if (_classSubjects?.length) {
    const seen = new Map();
    _classSubjects.forEach(cs => {
      if (!seen.has(cs.subject_id)) seen.set(cs.subject_id, { id: cs.subject_id, name: cs.subjects?.name || cs.subject_name || '—' });
    });
    subjectBase = [...seen.values()];
  } else {
    const seen = new Map();
    (results||[]).forEach(r => { if (!seen.has(r.subject_id)) seen.set(r.subject_id, { id: r.subject_id, name: r.subjects?.name || '—' }); });
    subjectBase = [...seen.values()];
  }

  const subRows = subjectBase.sort((a,b) => a.name.localeCompare(b.name)).map(sub => {
    const subResults = (results||[]).filter(r => r.subject_id === sub.id);
    const tw = subResults.reduce((s,r) => s + (r.exams?.weight||1), 0);
    const ws = subResults.reduce((s,r) => s + (r.score / (r.exams?.max_score||100)) * 100 * (r.exams?.weight||1), 0);
    const total = tw > 0 ? Math.round(ws / tw * 10) / 10 : null;
    const g = gradeFromScale(total, _scale||[]);
    return { name: sub.name, rows: subResults, total, grade: g.grade, remark: g.remark };
  });

  const validRows = subRows.filter(s => s.total !== null);
  const avg = validRows.length ? Math.round(validRows.reduce((s,r) => s+r.total, 0) / validRows.length * 10) / 10 : null;
  const raw = results?.reduce((s,r) => s + (r.score||0), 0) ?? null;
  const og  = gradeFromScale(avg, _scale||[]);

  const days = new Set((attData||[]).map(a => a.date)).size;
  const pres = (attData||[]).filter(a => a.status==='P' || a.status==='L').length;
  const att  = days > 0 ? Math.round(pres/days*100) : null;

  const parts = [
    _school?.affiliation_no ? `Affiliation No.: ${_school.affiliation_no}` : null,
    _school?.phone          ? `Ph: ${_school.phone}` : null,
    _school?.email          ? `Email: ${_school.email}` : null,
  ].filter(Boolean);
  const meta = parts.length ? parts.join(' &nbsp;|&nbsp; ') : [_school?.address, _school?.lga, _school?.state].filter(Boolean).join(', ') || '&nbsp;';
  const sessLabel = (_term?.academic_years?.label || _term?.name) ? `Academic Session — ${_term?.academic_years?.label || _term?.name}` : 'Academic Session';
  const logoH = _school?.logo_url ? `<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=logo-fb>SCHOOL<br>CREST</div>'">` : `<div class="logo-fb">SCHOOL<br>CREST</div>`;
  const pp  = student.photo_url || student.passport_url || student.avatar_url || '';
  const sid = student.id.replace(/-/g, '_');

  return { cn, classLabel, examList, subRows, avg, raw, og, att, meta, sessLabel, logoH, pp, sid, days, pres };
}

/* ═══════════════════════════════════════════════════════════
   NURSERY CARD BUILDER
═══════════════════════════════════════════════════════════ */
function buildNurseryCard(student, results, attData, affective) {
  const d = prepCardData(student, results, attData, affective);
  const { classLabel, subRows, avg, raw, og, att, meta, sessLabel, pp, sid } = d;

  function gradeToStars(grade) {
    const map = {'A+':5,'A':5,'B+':4,'B':4,'C+':3,'C':3,'D':2,'F':1,'—':0};
    const n = map[grade] ?? 3;
    return Array.from({length:5}, (_,i) => `<span class="${i<n?'ns-star-fill':'ns-star-empty'}">★</span>`).join('');
  }

  const logoH   = _school?.logo_url ? `<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=ns-logo-fb>CREST</div>'">` : `<div class="ns-logo-fb">🏫<br>CREST</div>`;
  const eHdrs   = d.examList.map(e => `<th>${e.name}<br><span style="font-weight:600;font-size:8px;opacity:.8">/${e.max_score}</span></th>`).join('');
  const sRows   = subRows.map(sub => {
    const cells = d.examList.map(e => { const r = sub.rows.find(r => r.exam_id===e.id); return `<td>${r!==undefined?r.score:'—'}</td>`; }).join('');
    return `<tr><td>${sub.name}</td>${cells}<td><strong style="color:#7d5fff">${sub.total??'—'}</strong></td><td><span class="ns-grade-pill">${sub.grade}</span></td></tr>`;
  }).join('') || `<tr><td colspan="99" style="text-align:center;padding:14px;color:#aaa;font-size:12px">No scores recorded yet 📚</td></tr>`;

  const coF = [['work_education','Work Education 🎨'],['art_education','Arts & Crafts 🖌️'],['physical_education','Physical Education 🏃'],['social_skills','Social Skills 🤝'],['sports','Sports & Play ⚽']];
  const diF = [['punctuality','Punctuality ⏰'],['sincerity','Sincerity 💛'],['conduct','Behaviour & Values 🌟'],['respect','Respectfulness 🙏'],['attitude_teachers','Attitude to Teachers 👩‍🏫'],['attitude_society','Community Spirit 🌍']];
  const skillsHtml = (fields, data) => fields.map(([k,l]) => {
    const grade = data?.[k] || '—';
    return `<div class="ns-skill-item"><span class="ns-skill-name">${l}</span><span>${gradeToStars(grade)} <span class="ns-grade-pill" style="margin-left:4px">${grade}</span></span></div>`;
  }).join('');
  const scaleRef = (_scale||[]).length ? (_scale||[]).map(g=>`<span style="margin:0 5px"><strong>${g.grade}</strong>: ${g.min_score}–${g.max_score}</span>`).join(' | ') : '<span>90–100: A+ | 80–89: A | 70–79: B+ | 60–69: B | 50–59: C | 40–49: D | Below 40: F</span>';
  const faceIcon = avg===null?'🙂':avg>=80?'🌟':avg>=60?'😊':avg>=45?'🙂':'💪';

  return `
<div class="card-wrap ns-card">
<div class="report-card"><div class="deco-border"><div class="card-inner">
<div class="ns-rainbow-strip"></div>
<div class="ns-header">
  <div class="ns-logo">${logoH}</div>
  <div class="ns-hc">
    <div class="ns-school">${_school?.name||'School Name'}</div>
    <div class="ns-meta">${meta}</div>
    <div class="ns-title">✨ Nursery Progress Report ✨</div>
    <div class="ns-sess">${sessLabel}</div>
    <div class="ns-class">Class: <strong>${classLabel}</strong></div>
  </div>
  <div>
    <div class="ns-pp" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp?'':'display:none'}" alt="Photo">
      <div class="ns-pp-ph" id="ppPh_${sid}" ${pp?'style="display:none"':''}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Photo</div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div style="text-align:center;font-size:8.5px;color:#aaa;margin-top:3px;font-family:sans-serif">Passport</div>
  </div>
</div>
<div class="ns-info">
  <div class="ns-info-row"><span class="ns-il">👦 Name</span><span class="ns-iv">${student.full_name||'—'}</span></div>
  <div class="ns-info-row"><span class="ns-il">🔢 Adm. No.</span><span class="ns-iv">${student.admission_no||student.roll_no||'—'}</span></div>
  <div class="ns-info-row"><span class="ns-il">👩 Mother</span><span class="ns-iv">${student.mother_name||'—'}</span></div>
  <div class="ns-info-row"><span class="ns-il">🎂 Date of Birth</span><span class="ns-iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
  <div class="ns-info-row"><span class="ns-il">👨 Father/Guardian</span><span class="ns-iv">${student.father_name||student.guardian_name||'—'}</span></div>
  <div class="ns-info-row"><span class="ns-il">📋 Scholar No.</span><span class="ns-iv">${student.scholar_no||student.id?.slice(0,8).toUpperCase()||'—'}</span></div>
</div>
<div class="ns-sec-hdr">📚 Scholastic Performance</div>
<div style="overflow-x:auto"><table class="ns-subj-table">
  <thead><tr class="ns-th-row" style="color:#5a3a00"><th style="text-align:left;padding-left:14px;min-width:110px">Subject</th>${eHdrs}<th>Total</th><th>Grade</th></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="ns-summary">
  <div class="ns-sum-cell"><span class="ns-sum-icon">📊</span><span class="ns-sum-lbl">Total Marks</span><span class="ns-sum-val" style="color:#e65c00">${raw??'—'}</span></div>
  <div class="ns-sum-cell"><span class="ns-sum-icon">📈</span><span class="ns-sum-lbl">Average %</span><span class="ns-sum-val" style="color:#1a7a4e">${avg!==null?avg+'%':'—'}</span></div>
  <div class="ns-sum-cell"><span class="ns-sum-icon">${faceIcon}</span><span class="ns-sum-lbl">Grade</span><span class="ns-sum-val" style="color:#0077b6">${og.grade}</span></div>
  <div class="ns-sum-cell"><span class="ns-sum-icon">📅</span><span class="ns-sum-lbl">Attendance</span><span class="ns-sum-val" style="color:#7d5fff">${att!==null?att+'%':'—'}</span></div>
</div>
<div class="ns-sec-hdr">🌟 Skills & Activities</div>
<div class="ns-skill-grid">${skillsHtml(coF, affective)}</div>
<div class="ns-sec-hdr">🌈 Character & Discipline</div>
<div class="ns-skill-grid">${skillsHtml(diF, affective)}</div>
${affective?.class_teacher_remark ? `<div class="ns-remark"><span class="ns-remark-lbl">👩‍🏫 Class Teacher's Remark</span>${affective.class_teacher_remark}</div>` : ''}
${affective?.principal_remark ? `<div class="ns-remark" style="background:#f0faf4"><span class="ns-remark-lbl" style="color:#1a7a4e">🎓 Head Teacher's Remark</span>${affective.principal_remark}</div>` : ''}
<div class="ns-promo">🎉 Promoted to: <strong>${affective?.promoted_to||'_______________________'}</strong></div>
${affective?.next_term_begins ? `<div style="padding:4px 14px;font-size:11px;background:#e8f8f2;font-family:'Nunito',sans-serif"><strong>📅 Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>` : ''}
<div style="padding:5px 13px;font-size:10px;color:#888;border-top:2px dashed #ffd32a;background:#fffbf0;font-family:sans-serif;text-align:center"><strong style="color:#5a3a6b">Grading Scale:</strong> ${scaleRef}</div>
<div class="ns-sig">
  <div class="ns-sig-bl"><div class="ns-sig-ln">${_school?.class_teacher_signature_url?`<img src="${_school.class_teacher_signature_url}" style="max-height:34px">`:''}</div><div class="ns-sig-la">Class Teacher</div><div class="ns-sig-sl">Signature</div></div>
  <div class="ns-sig-bl"><div class="ns-sig-ln">${_school?.principal_signature_url?`<img src="${_school.principal_signature_url}" style="max-height:34px">`:''}</div><div class="ns-sig-la">Head Teacher / Principal</div><div class="ns-sig-sl">Signature</div></div>
</div>
<div class="ns-rainbow-strip"></div>
<div class="card-stamp" style="font-family:'Nunito',sans-serif">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   PRIMARY CARD BUILDER
═══════════════════════════════════════════════════════════ */
function buildPrimaryCard(student, results, attData, affective) {
  const d = prepCardData(student, results, attData, affective);
  const { classLabel, subRows, avg, raw, og, att, meta, sessLabel, pp, sid } = d;

  const logoH = _school?.logo_url ? `<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=pr-logo-fb>CREST</div>'">` : `<div class="pr-logo-fb">SCHOOL<br>CREST</div>`;
  const eHdrs = d.examList.map(e => `<th>${e.name}<br><span style="font-weight:500;font-size:7.5px;opacity:.85">/${e.max_score}</span></th>`).join('');
  const sRows = subRows.map(sub => {
    const cells = d.examList.map(e => { const r = sub.rows.find(r => r.exam_id===e.id); return `<td>${r!==undefined?r.score:'—'}</td>`; }).join('');
    return `<tr><td class="sn" style="color:#1a4a32">${sub.name}</td>${cells}<td><strong style="color:#1a7a4e">${sub.total??'—'}</strong></td><td>${gradeBadge(sub.grade)}</td><td style="font-size:10px;color:#555;text-align:left">${sub.remark||'—'}</td></tr>`;
  }).join('') || `<tr><td colspan="99" style="text-align:center;padding:16px;color:#999;font-size:12px">No results recorded for this term.</td></tr>`;

  const coF = [['work_education','Work Education'],['art_education','Art Education'],['physical_education','Health & Physical Ed.'],['social_skills','Social Skills'],['sports','Sports']];
  const diF = [['punctuality','Regularity & Punctuality'],['sincerity','Sincerity'],['conduct','Behaviour & Values'],['respect','Respectfulness'],['attitude_teachers','Attitude to Teachers'],['attitude_society','Attitude to Society']];
  const prActRows = (fields, data) => fields.map(([k,l]) => `<div class="pr-ar"><span>${l}</span><span class="pr-grade-box">${data?.[k]||''}</span></div>`).join('');
  const scH = (_scale||[]).length
    ? `<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</tr></thead><tbody><tr><td>Marks</td>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr><tr><td>Remark</td>${(_scale||[]).map(g=>`<td style="font-size:8px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    : `<thead><tr><th>91–100</th><th>81–90</th><th>71–80</th><th>61–70</th><th>51–60</th><th>41–50</th><th>32–40</th></tr></thead><tbody><tr><td>A+</td><td>A</td><td>B+</td><td>B</td><td>C+</td><td>C</td><td>D</td></tr></tbody>`;

  return `
<div class="card-wrap pr-card">
<div class="report-card"><div class="deco-border" style="border-color:#1a7a4e !important"><div class="card-inner" style="border-color:#1a7a4e">
<div class="deco-strip" style="background:repeating-linear-gradient(90deg,#1a7a4e 0px,#1a7a4e 6px,#4ade80 6px,#4ade80 12px)"></div>
<div class="pr-header">
  <div class="pr-logo">${logoH}</div>
  <div class="pr-hc">
    <div class="pr-school">${_school?.name||'School Name'}</div>
    <div class="pr-meta">${meta}</div>
    <div class="pr-divider"></div>
    <div class="pr-title">Academic Report Card</div>
    <div class="pr-sess">${sessLabel}</div>
    <div class="pr-class">Class: <span>${classLabel}</span></div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
    <div class="pr-pp" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp?'':'display:none'}" alt="Student Photo">
      <div class="pr-pp-ph" id="ppPh_${sid}" ${pp?'style="display:none"':''}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Affix Photo</div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div style="font-size:8.5px;color:#999;font-family:sans-serif">Passport Size</div>
  </div>
</div>
<div class="pr-info">
  <div class="pr-info-row"><span class="pr-il">Name of Student</span><span class="pr-iv">${student.full_name||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Roll No.</span><span class="pr-iv">${student.admission_no||student.roll_no||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Mother's Name</span><span class="pr-iv">${student.mother_name||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Scholar No.</span><span class="pr-iv">${student.scholar_no||student.id?.slice(0,8).toUpperCase()||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Father / Guardian</span><span class="pr-iv">${student.father_name||student.guardian_name||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Date of Birth</span><span class="pr-iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
</div>
<div class="pr-sec-hdr">Scholastic Area — Academic Performance</div>
<div style="overflow-x:auto"><table class="pr-table">
  <thead><tr><th class="sn-h" rowspan="2" style="min-width:140px">Subjects</th>${eHdrs}<th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:65px">Remark</th></tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="pr-sum">
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#1a7a4e">Over All Marks</span><span class="pr-sv" style="color:#1a7a4e">${raw??'—'}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#f59e0b">Percentage</span><span class="pr-sv" style="color:#d97706">${avg!==null?avg+'%':'—'}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#16a34a">Grade</span><span class="pr-sv" style="color:#16a34a">${og.grade}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#7c3aed">Attendance</span><span class="pr-sv" style="color:#7c3aed">${att!==null?att+'%':'—'}</span></div>
</div>
<div class="pr-two-col">
  <div class="pr-co-col"><div class="pr-co-h">Co-Scholastic Activities</div><div class="pr-ach"><span>Activity</span><span>Grade</span></div>${prActRows(coF, affective)}</div>
  <div class="pr-di-col"><div class="pr-di-h">Discipline & Values</div><div class="pr-ach"><span>Activity</span><span>Grade</span></div>${prActRows(diF, affective)}</div>
</div>
${affective?.class_teacher_remark ? `<div class="rm-row" style="background:#f0faf4"><span class="rm-lbl" style="color:#1a7a4e">Class Teacher's Remark</span>${affective.class_teacher_remark}</div>` : ''}
${affective?.vp_academic_remark   ? `<div class="rm-row" style="background:#eff6ff"><span class="rm-lbl" style="color:#1e40af">VP Academic's Remark</span>${affective.vp_academic_remark}</div>` : ''}
${affective?.principal_remark     ? `<div class="rm-row" style="background:#f0fdf4"><span class="rm-lbl" style="color:#166534">Principal's Remark</span>${affective.principal_remark}</div>` : ''}
<div class="pr-promo">🎓 Promoted to Class — <span>${affective?.promoted_to||'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins ? `<div style="padding:5px 15px;font-size:11px;border-top:1px solid #cde8d8;background:#e8f9f0"><strong>Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>` : ''}
<div style="padding:6px 13px;border-top:1px solid #cde8d8;background:#f0faf4">
  <div style="font-family:'Quicksand',sans-serif;font-size:8px;text-align:center;letter-spacing:1.5px;text-transform:uppercase;color:#1a7a4e;margin-bottom:4px;font-weight:700">Grading Scale for Scholastic Areas</div>
  <table class="gs">${scH}</table>
</div>
<div class="pr-sig">
  ${sigHTML('Class Teacher', _school?.class_teacher_signature_url)}
  ${sigHTML('VP Academic',   _school?.vp_signature_url)}
  ${sigHTML('Exam Officer',  _school?.exam_officer_signature_url)}
  ${sigHTML('Principal',     _school?.principal_signature_url)}
</div>
<div class="deco-strip" style="background:repeating-linear-gradient(90deg,#1a7a4e 0px,#1a7a4e 6px,#4ade80 6px,#4ade80 12px)"></div>
<div class="card-stamp" style="font-family:'Poppins',sans-serif">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   SECONDARY CARD BUILDER  (default)
═══════════════════════════════════════════════════════════ */
function buildSecondaryCard(student, results, attData, affective, extraClass='') {
  const d = prepCardData(student, results, attData, affective);
  const { classLabel, subRows, avg, raw, og, att, meta, sessLabel, logoH, pp, sid } = d;

  const eHdrs = d.examList.map(e => `<th>${e.name}<br><span style="font-weight:400;font-size:7.5px">/${e.max_score}</span></th>`).join('');
  const sRows = subRows.map(sub => {
    const cells = d.examList.map(e => { const r = sub.rows.find(r => r.exam_id===e.id); return `<td>${r!==undefined?r.score:'—'}</td>`; }).join('');
    return `<tr><td class="sn">${sub.name}</td>${cells}
      <td><strong style="color:var(--primary)">${sub.total??'—'}</strong></td>
      <td>${gradeBadge(sub.grade)}</td>
      <td style="font-size:10px;color:#555;text-align:left">${sub.remark||'—'}</td></tr>`;
  }).join('') || `<tr><td colspan="99" style="text-align:center;padding:18px;color:#999;font-family:sans-serif;font-size:12px">No results recorded for this term.</td></tr>`;

  const coF = [['work_education','Work Education'],['art_education','Art Education'],['physical_education','Health &amp; Physical Education'],['social_skills','Social Skills'],['sports','Sports']];
  const diF = [['punctuality','Regularity &amp; Punctuality'],['sincerity','Sincerity'],['conduct','Behaviour &amp; Values'],['respect','Respectfulness for Rules &amp; Reg.'],['attitude_teachers','Attitude Towards Teachers'],['attitude_society','Attitude Towards Society']];

  const scH = (_scale||[]).length
    ? `<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</thead>
       <tbody><tr><th>Marks</th>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr>
       <tr><th>Remark</th>${(_scale||[]).map(g=>`<td style="font-size:8.5px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    : `<thead><tr><th>91–100</th><th>81–90</th><th>71–80</th><th>61–70</th><th>51–60</th><th>41–50</th><th>32–40</th></thead>
       <tbody><tr><td>A+</td><td>A</td><td>B+</td><td>B</td><td>C+</td><td>C</td><td>D</td></tr></tbody>`;

  return `
<div class="card-wrap ${extraClass}">
<div class="report-card"><div class="deco-border"><div class="card-inner">
<div class="deco-strip"></div>
<div class="rc-header">
  <div class="logo-circle">${logoH}</div>
  <div class="hc">
    <div class="school-name">${_school?.name||'School Name'}</div>
    <div class="school-meta">${meta}</div>
    <div class="gold-div"></div>
    <div class="card-title">Academic Report Card</div>
    <div class="sess-txt">${sessLabel}</div>
    <div class="cls-line">Class : <span>${classLabel}</span></div>
  </div>
  <div class="pp-box">
    <div class="pp-frame" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp?'':'display:none'}" alt="Student Photo">
      <div class="pp-ph" id="ppPh_${sid}" ${pp?'style="display:none"':''}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Affix<br>Student<br>Photo
      </div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div class="pp-lbl">Passport Size</div>
  </div>
</div>
<div class="info-strip">
  <div class="info-row"><span class="il">Name of Student</span><span class="iv">${student.full_name||'—'}</span></div>
  <div class="info-row"><span class="il">Roll No.</span><span class="iv">${student.admission_no||student.roll_no||'—'}</span></div>
  <div class="info-row"><span class="il">Mother's Name</span><span class="iv">${student.mother_name||'—'}</span></div>
  <div class="info-row"><span class="il">Scholar No.</span><span class="iv">${student.scholar_no||student.id?.slice(0,8).toUpperCase()||'—'}</span></div>
  <div class="info-row"><span class="il">Father's Name</span><span class="iv">${student.father_name||student.guardian_name||'—'}</span></div>
  <div class="info-row"><span class="il">Date of Birth</span><span class="iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
</div>
<div class="sec-hdr">Scholastic Area — Academic Performance</div>
<div class="aw"><table class="ac">
  <thead><tr><th class="sn-h" rowspan="2" style="min-width:140px">Subjects</th>${eHdrs}<th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:65px">Remark</th></tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="sum-band">
  <div class="sum-cell"><span class="sl c1">Over All Marks</span><span class="sv" style="color:var(--primary)">${raw??'—'}</span></div>
  <div class="sum-cell"><span class="sl c2">Percentage</span><span class="sv" style="color:var(--accent)">${avg!==null?avg+'%':'—'}</span></div>
  <div class="sum-cell"><span class="sl c3">Grade</span><span class="sv" style="color:#16a34a">${og.grade}</span></div>
  <div class="sum-cell"><span class="sl c4">Attendance</span><span class="sv" style="color:#7c3aed">${att!==null?att+'%':'—'}</span></div>
</div>
<div class="two-col">
  <div class="co-col"><div class="co-h">Co-Schooling Area</div><div class="ach"><span>Activity</span><span>Grade</span></div>${actRows(coF, affective)}</div>
  <div class="di-col"><div class="di-h">Discipline</div><div class="ach"><span>Activity</span><span>Grade</span></div>${actRows(diF, affective)}</div>
</div>
${rmHTML("Class Teacher's Remark", affective?.class_teacher_remark, '#f8faff', 'var(--primary)')}
${rmHTML("VP Academic's Remark",   affective?.vp_academic_remark,   '#eff6ff', '#1e40af')}
${rmHTML("Exam Officer's Remark",  affective?.exam_officer_remark,  '#faf5ff', '#6b21a8')}
${rmHTML("Principal's Remark",     affective?.principal_remark,     '#f0fdf4', '#166534')}
<div class="promo-band">Congratulations ! &nbsp; Promoted to Class — <span>${affective?.promoted_to||'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins ? `<div class="nt-row"><strong>Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>` : ''}
<div class="gs-wrap"><div class="gs-title">Grading Scale for Scholastic Areas</div><table class="gs">${scH}</table></div>
<div class="sig-ft">
  ${sigHTML('Class Teacher', _school?.class_teacher_signature_url)}
  ${sigHTML('VP Academic',   _school?.vp_signature_url)}
  ${sigHTML('Exam Officer',  _school?.exam_officer_signature_url)}
  ${sigHTML('Principal',     _school?.principal_signature_url)}
</div>
<div class="deco-strip"></div>
<div class="card-stamp">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN ENTRY — routes to the right section builder
═══════════════════════════════════════════════════════════ */
async function buildCard(student, termId, extraClass='') {
  // -- fetch or get from bulk cache --
  let studentResults = [];

  if (_bulkResults !== null) {
    studentResults = _bulkResults.filter(r => r.student_id === student.id);
  } else {
    const { data: checkResults, count } = await db.from('results')
      .select('id', { count:'exact', head:true })
      .eq('student_id', student.id).eq('term_id', termId);
    if (!count || count === 0) return null;
    studentResults = await sq(`Results for ${student.full_name||student.id}`,
      db.from('results')
        .select('score,student_id,subject_id,exam_id,subjects(id,name,code),exams(id,name,max_score,weight)')
        .eq('student_id', student.id).eq('term_id', termId));
  }

  if (!studentResults || studentResults.length === 0) return null;

  let attData, affective;
  if (_bulkAtt !== null && _bulkAffective !== null) {
    attData   = _bulkAtt.filter(a => a.student_id === student.id);
    affective = _bulkAffective.find(a => a.student_id === student.id) || null;
  } else {
    [attData, affective] = await Promise.all([
      sq(`Attendance for ${student.full_name||student.id}`, db.from('attendance').select('status,date,student_id').eq('student_id',student.id).eq('term_id',termId)),
      sq(`Affective domain for ${student.full_name||student.id}`, db.from('affective_domain').select('*').eq('student_id',student.id).eq('term_id',termId).maybeSingle()),
    ]);
  }

  // Deduplicate results per (subject_id, exam_id) pair
  const resultSeen = new Set();
  studentResults = studentResults.filter(r => {
    const k = `${r.subject_id}||${r.exam_id}`;
    if (resultSeen.has(k)) return false;
    resultSeen.add(k); return true;
  });

  // Deduplicate exams
  const examSeen = new Set(), examDeduped = [];
  (_exams||[]).forEach(e => { if (e && !examSeen.has(e.id)) { examSeen.add(e.id); examDeduped.push(e); } });
  if (examDeduped.length) _exams = examDeduped;

  // Store for certificate/testimonial pages
  _currentStudent = { student, results: studentResults, attData, affective };

  // Route
  const sType = getSectionType(_classRow);
  if (sType === 'nursery') return buildNurseryCard(student, studentResults, attData, affective);
  if (sType === 'primary') return buildPrimaryCard(student, studentResults, attData, affective);
  return buildSecondaryCard(student, studentResults, attData, affective, extraClass);
}
