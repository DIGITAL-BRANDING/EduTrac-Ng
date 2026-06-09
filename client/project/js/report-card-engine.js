// ============================================================
//  EduTrack NG — js/report-card-engine.js
//  SINGLE SOURCE OF TRUTH for all report card rendering.
//
//  Imported by:
//    - portals/academic-office/report-cards.html  (VP/Exam Officer view)
//    - portals/parent/result-checker.html          (public PIN checker)
//
//  To change card layout, styles, grading, sections — edit THIS FILE ONLY.
// ============================================================

/* ═══════════════════════════════════════════════════════════
   CSS — injected once into <head> on first load
═══════════════════════════════════════════════════════════ */
(function injectReportCardStyles() {
  if (document.getElementById('rc-engine-styles')) return;
  const style = document.createElement('style');
  style.id = 'rc-engine-styles';
  style.textContent = `
:root {
  --primary:#1a2e6e; --primary-dark:#111e4a; --primary-light:#2a44a0;
  --accent:#c8860a;  --accent-light:#f0c040;
  --co-bg:#fff8e6;   --co-hdr:#c8860a;
  --disc-bg:#e6f3fb; --disc-hdr:#1a6eaa;
  --grade-row:#e8f0fc;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#d8dde8;font-family:'EB Garamond',Georgia,serif;padding:0 0 60px;}
.no-print{}

.rc-loader{max-width:480px;margin:60px auto;text-align:center;font-family:sans-serif;color:#555;
  background:white;border-radius:14px;padding:36px 28px 28px;box-shadow:0 4px 24px rgba(0,0,0,.10);}
.rc-loader #loadMsg{font-size:14px;font-weight:600;color:#2d3748;margin:0 0 4px;}
.rc-spinner{width:44px;height:44px;border:4px solid #e8ecf4;border-top-color:var(--primary);
  border-radius:50%;animation:spin .9s linear infinite;margin:0 auto 18px;}
@keyframes spin{to{transform:rotate(360deg)}}
.rc-loader-steps{margin-top:14px;font-size:11.5px;color:#aaa;line-height:1.9;
  background:#f8f9fc;border-radius:8px;padding:8px 12px;text-align:left;max-width:300px;margin-left:auto;margin-right:auto;}
.step-done{color:#16a34a;} .step-active{color:var(--primary);font-weight:600;} .step-wait{color:#ccc;}

.err-box{max-width:820px;margin:50px auto;padding:32px 28px;background:white;border-radius:8px;
  box-shadow:0 2px 14px rgba(0,0,0,.12);font-family:sans-serif;border-left:5px solid #ef4444;}
.err-box h2{color:#b91c1c;font-size:16px;margin-bottom:8px;}
.err-box p{font-size:13px;color:#555;margin-bottom:6px;}
.err-box code{display:block;margin-top:10px;background:#fef2f2;border:1px solid #fca5a5;padding:8px 12px;
  border-radius:5px;font-size:12px;color:#991b1b;word-break:break-all;white-space:pre-wrap;}
.err-retry{display:inline-block;margin-top:14px;padding:8px 18px;background:var(--primary);color:white;
  border:none;border-radius:5px;font-size:13px;font-family:sans-serif;cursor:pointer;font-weight:600;}

.no-report-card{max-width:820px;margin:30px auto;background:#fff3cd;border-left:5px solid #ffc107;
  border-radius:8px;padding:32px 28px;text-align:center;font-family:'Segoe UI',sans-serif;
  box-shadow:0 2px 14px rgba(0,0,0,.08);}
.no-report-card svg{width:64px;height:64px;margin-bottom:16px;color:#856404;}
.no-report-card h3{color:#856404;font-size:22px;margin-bottom:12px;}
.no-report-card p{color:#533f03;font-size:14px;margin-bottom:20px;}
.no-report-card button{background:#856404;color:white;border:none;padding:10px 24px;
  border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin:0 8px;}
.no-report-card button:hover{background:#6c4a04;}

.control-bar{
  position:sticky;top:0;z-index:200;background:white;
  box-shadow:0 2px 10px rgba(0,0,0,.13);
  padding:9px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  font-family:'Segoe UI',sans-serif;font-size:13px;
}
.ssel-wrap{display:flex;align-items:center;gap:7px;flex:1;min-width:180px;}

/* ── Institution theme selector ── */
.inst-theme-bar{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.inst-theme-bar label{font-size:11px;color:#555;font-weight:600;white-space:nowrap;}
.inst-theme-sel{padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;
  font-family:'Segoe UI',sans-serif;color:#111;background:white;cursor:pointer;max-width:160px;}
.inst-theme-sel:focus{outline:none;border-color:var(--primary);}
.theme-auto-badge{display:inline-block;padding:1px 7px;background:#e8f0fe;color:#1a2e6e;
  border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.3px;white-space:nowrap;}

/* ── Mobile control bar ── */
@media(max-width:640px){
  .control-bar{padding:8px 10px;gap:7px;}
  .ssel-wrap{flex-basis:100%;min-width:0;order:0;}
  .ssel-wrap select{font-size:12px;}
  .control-bar > h3{display:none;}
  .color-presets{overflow-x:auto;flex-wrap:nowrap;flex-basis:100%;order:1;padding-bottom:2px;
    -webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .color-presets::-webkit-scrollbar{display:none;}
  .custom-cw,.inst-theme-bar{order:2;flex-shrink:0;}
  .dv{display:none;}
  .ctrl-actions{order:3;margin-left:0;width:100%;justify-content:flex-end;flex-wrap:wrap;gap:5px;}
  .ctrl-btn{padding:6px 10px;font-size:11px;}
  .btn-pr svg{display:none;}
}
.ssel-wrap label{font-size:12px;color:#555;white-space:nowrap;font-weight:600;}
.ssel-wrap select{flex:1;padding:5px 9px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;
  font-family:'Segoe UI',sans-serif;color:#111;background:white;cursor:pointer;}
.snav{display:flex;gap:3px;}
.nav-btn{padding:4px 10px;border:1px solid #d1d5db;border-radius:5px;background:white;
  font-size:13px;cursor:pointer;font-weight:700;color:#374151;font-family:'Segoe UI',sans-serif;}
.nav-btn:hover:not(:disabled){background:var(--primary);color:white;border-color:var(--primary);}
.nav-btn:disabled{opacity:.35;cursor:not-allowed;}
.s-counter{font-size:12px;color:#6b7280;white-space:nowrap;}
.dv{width:1px;height:26px;background:#e5e7eb;flex-shrink:0;}
.color-presets{display:flex;gap:5px;align-items:center;}
.preset-swatch{width:24px;height:24px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:.14s;box-shadow:0 1px 4px rgba(0,0,0,.22);}
.preset-swatch:hover,.preset-swatch.active{transform:scale(1.2);border-color:#333;}
.custom-cw{display:flex;align-items:center;gap:5px;}
.custom-cw label{font-size:11px;color:#555;}
.custom-cw input[type=color]{width:30px;height:26px;border:1px solid #ccc;border-radius:4px;cursor:pointer;padding:1px;}
.ctrl-actions{display:flex;gap:6px;margin-left:auto;}
.ctrl-btn{padding:6px 13px;border:none;border-radius:5px;font-size:12px;font-family:'Segoe UI',sans-serif;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:5px;}
.btn-pa{background:#f59e0b;color:white;} .btn-pr{background:var(--primary);color:white;} .btn-bk{background:#f3f4f6;color:#374151;}
.ctrl-btn:hover{filter:brightness(1.08);}

.term-picker{max-width:820px;margin:30px auto 0;background:white;border-radius:10px;
  box-shadow:0 4px 22px rgba(0,0,0,.13);padding:32px 28px;font-family:'Segoe UI',sans-serif;
  border-top:4px solid var(--primary);}
.term-picker h2{font-family:'Cinzel',serif;color:var(--primary);font-size:16px;margin-bottom:6px;}
.term-picker p{font-size:12px;color:#6b7280;margin-bottom:18px;}
.term-picker-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;}
.term-picker-row select{flex:1;min-width:200px;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:7px;
  font-size:13px;font-family:'Segoe UI',sans-serif;color:#111;background:white;cursor:pointer;}
.term-picker-row select:focus{outline:none;border-color:var(--primary);}
.term-go-btn{padding:9px 22px;background:var(--primary);color:white;border:none;border-radius:7px;
  font-size:13px;font-family:'Segoe UI',sans-serif;font-weight:700;cursor:pointer;white-space:nowrap;}
.term-go-btn:hover{filter:brightness(1.1);}
.term-go-btn:disabled{opacity:.4;cursor:not-allowed;}
.term-sel-bar{display:flex;align-items:center;gap:6px;}
.term-sel-bar label{font-size:11px;color:#555;font-weight:600;white-space:nowrap;}
.term-sel-bar select{padding:4px 8px;border:1px solid #d1d5db;border-radius:5px;font-size:12px;
  font-family:'Segoe UI',sans-serif;color:#111;background:white;cursor:pointer;}
.term-sel-bar button{padding:4px 10px;background:var(--primary);color:white;border:none;border-radius:5px;
  font-size:11px;font-weight:700;cursor:pointer;font-family:'Segoe UI',sans-serif;}

.class-banner{max-width:820px;margin:12px auto 0;background:white;border-left:4px solid var(--primary);
  border-radius:0 6px 6px 0;padding:7px 15px;font-family:'Segoe UI',sans-serif;font-size:12px;color:#374151;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.class-banner strong{color:var(--primary);font-size:14px;}
.cbadge{background:var(--primary);color:white;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;}

/* A4 card sizing for print */
.card-stamp{font-family:'EB Garamond',Georgia,serif;font-size:9px;color:#aaa;text-align:center;padding:4px 0 5px;letter-spacing:.3px;border-top:1px solid #eee;}

@media print{
  @page{size:A4 portrait;margin:8mm;}
  .control-bar,.class-banner,.no-print{display:none!important;}
  body{background:white!important;padding:0!important;}
  .card-wrap{max-width:100%!important;margin:0!important;}
  .report-card{box-shadow:none!important;margin:0!important;width:100%!important;}
  .deco-border{border:3px solid #000!important;}
  .print-page-break{page-break-before:always;break-before:page;}
  html,body{width:210mm;}
}

.card-wrap{max-width:794px;margin:14px auto 0;}
.report-card{background:white;box-shadow:0 4px 28px rgba(0,0,0,.18);padding:8px;}
.deco-border{border:3px solid var(--primary);padding:4px;position:relative;}
.deco-border::before{content:'';position:absolute;inset:3px;border:1px solid var(--accent-light);pointer-events:none;z-index:0;}
.deco-border::after{content:'';position:absolute;inset:0;
  background-image:radial-gradient(circle at 0% 0%,var(--accent) 0,transparent 13px),radial-gradient(circle at 100% 0%,var(--accent) 0,transparent 13px),radial-gradient(circle at 0% 100%,var(--accent) 0,transparent 13px),radial-gradient(circle at 100% 100%,var(--accent) 0,transparent 13px);
  pointer-events:none;z-index:1;}
.card-inner{border:1px solid rgba(0,0,0,.08);position:relative;z-index:2;background:white;overflow:hidden;}
.card-inner::before{content:'';position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(var(--primary-rgb,.08),0.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(var(--primary-rgb,.08),0.025) 1px,transparent 1px);
  background-size:20px 20px;pointer-events:none;z-index:0;}
.card-inner>*{position:relative;z-index:1;}
.deco-strip{height:8px;background:repeating-linear-gradient(90deg,var(--primary) 0px,var(--primary) 8px,var(--accent) 8px,var(--accent) 16px);}

/* ── SECONDARY HEADER ── */
.rc-header{padding:12px 14px 10px;display:grid;grid-template-columns:76px 1fr 82px;gap:10px;align-items:center;border-bottom:2px solid var(--primary);background:linear-gradient(135deg,rgba(0,0,0,.015) 0%,transparent 100%);}
.logo-circle{width:68px;height:68px;border-radius:50%;border:3px double var(--primary);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f7f7f7;}
.logo-circle img{width:100%;height:100%;object-fit:cover;}
.logo-fb{font-family:'Cinzel',serif;font-size:8px;font-weight:700;color:var(--primary);text-align:center;line-height:1.3;padding:4px;}
.hc{text-align:center;}
.school-name{font-family:'Cinzel',serif;font-size:clamp(12px,2.5vw,20px);font-weight:900;color:var(--primary);letter-spacing:.4px;line-height:1.15;}
.school-meta{font-size:9.5px;color:#555;margin-top:2px;font-style:italic;}
.gold-div{height:1.5px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent-light),var(--accent),transparent);margin:5px auto;width:70%;}
.card-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--primary);letter-spacing:.2px;}
.sess-txt{font-size:11px;color:var(--accent);font-weight:600;margin-top:2px;}
.cls-line{font-size:11px;color:#444;margin-top:2px;font-style:italic;}
.cls-line span{border-bottom:1px dotted #999;min-width:60px;display:inline-block;font-style:normal;font-weight:700;color:var(--primary-dark);}

.pp-box{display:flex;flex-direction:column;align-items:center;gap:3px;}
.pp-frame{width:72px;height:88px;border:2px solid var(--primary);background:#f7f7f7;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;}
.pp-frame img{width:100%;height:100%;object-fit:cover;}
.pp-ph{text-align:center;font-size:8.5px;color:#bbb;font-family:sans-serif;line-height:1.4;padding:4px;}
.pp-ph svg{display:block;margin:0 auto 3px;}
.pp-lbl{font-size:8.5px;color:#aaa;font-style:italic;}

/* ── INFO STRIP ── */
.info-strip{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid var(--primary);font-size:11.5px;}
.info-row{display:flex;align-items:baseline;padding:5px 12px;border-bottom:1px solid #ececec;gap:5px;}
.info-row:nth-child(odd){border-right:1px solid #e2e2e2;background:#fafbff;}
.info-row:nth-child(even){background:#fff;}
.info-row:nth-last-child(-n+2){border-bottom:none;}
.il{font-weight:700;color:#444;white-space:nowrap;min-width:110px;font-family:'EB Garamond',Georgia,serif;}
.iv{border-bottom:1px dotted #bbb;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;font-family:'EB Garamond',Georgia,serif;}

/* ── SECTION HEADERS ── */
.sec-hdr{background:var(--primary);color:white;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:1.8px;padding:4px 13px;text-transform:uppercase;font-weight:600;}

/* ── ACADEMIC TABLE ── */
.aw{overflow-x:auto;}
table.ac{width:100%;border-collapse:collapse;font-size:11px;}
table.ac th,table.ac td{border:1px solid #d8dff0;padding:4px 5px;text-align:center;vertical-align:middle;}
table.ac th{background:var(--primary);color:white;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.4px;font-weight:600;}
td.sn{text-align:left;font-weight:700;font-size:11px;color:var(--primary-dark);padding-left:10px;background:#f9fbff;white-space:nowrap;}
table.ac tr:nth-child(even) td:not(.sn){background:#f4f7fd;}
.gb{display:inline-block;padding:1px 7px;border-radius:3px;font-size:9.5px;font-weight:700;}
.gAp{background:#dcfce7;color:#15803d}.gA{background:#bbf7d0;color:#166534}.gBp{background:#dbeafe;color:#1d4ed8}
.gB{background:#bfdbfe;color:#1e40af}.gCp{background:#fef9c3;color:#854d0e}.gC{background:#fde68a;color:#92400e}
.gD{background:#fed7aa;color:#9a3412}.gF{background:#fee2e2;color:#991b1b}.gDf{background:#f3f4f6;color:#6b7280}

/* ── SUMMARY BAND ── */
.sum-band{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid var(--primary);border-bottom:1px solid #e4e8f4;}
.sum-cell{text-align:center;padding:8px 4px;border-right:1px solid #e4e8f4;background:linear-gradient(180deg,#f9fbff,#fff);}
.sum-cell:last-child{border-right:none;}
.sl{display:inline-block;font-family:'Cinzel',serif;font-size:7px;letter-spacing:1.2px;text-transform:uppercase;color:white;padding:2px 8px;border-radius:20px;margin-bottom:4px;}
.sl.c1{background:var(--primary)}.sl.c2{background:var(--accent)}.sl.c3{background:#16a34a}.sl.c4{background:#7c3aed}
.sv{display:block;font-family:'Playfair Display',serif;font-size:19px;font-weight:700;line-height:1.1;}

/* ── CO-SCHOLASTIC & DISCIPLINE ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #dde2f0;}
.co-col{border-right:2px solid var(--primary);}
.co-h,.di-h{text-align:center;padding:4px 8px;font-family:'Cinzel',serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:white;}
.co-h{background:var(--co-hdr);}.di-h{background:var(--disc-hdr);}
.ach{display:flex;justify-content:space-between;align-items:center;padding:3px 10px;font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;}
.co-col .ach{background:rgba(200,134,10,.09);color:#7a4f00;}
.di-col .ach{background:rgba(26,110,170,.09);color:#0a3d5e;}
.ar{display:flex;align-items:center;justify-content:space-between;padding:3.5px 10px;border-bottom:1px solid rgba(0,0,0,.06);font-size:11px;}
.co-col .ar{background:var(--co-bg);}
.di-col .ar{background:var(--disc-bg);}
.ar:nth-child(even){filter:brightness(.975);}
.grade-box{min-width:36px;height:18px;border:1px solid #bbb;background:white;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#333;}

/* ── REMARKS ── */
.rm-row{padding:5px 12px;font-size:11px;border-top:1px solid #eee;font-family:'EB Garamond',Georgia,serif;}
.rm-lbl{font-family:'Cinzel',serif;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:2px;}

/* ── PROMOTION & NEXT TERM ── */
.promo-band{padding:6px 14px;border-top:1px solid #dde2f0;background:#fffef5;font-family:'Playfair Display',serif;font-size:12.5px;font-weight:700;color:var(--primary-dark);}
.promo-band span{border-bottom:1.5px dotted var(--accent);min-width:60px;display:inline-block;font-style:italic;}
.nt-row{padding:4px 14px;font-size:11px;border-top:1px solid #eee;background:#fffbeb;font-family:'EB Garamond',Georgia,serif;}

/* ── GRADING SCALE ── */
.gs-wrap{padding:5px 12px;border-top:1px solid #dde2f0;background:#f8f9fc;}
.gs-title{font-family:'Cinzel',serif;font-size:7.5px;text-align:center;letter-spacing:1.5px;text-transform:uppercase;color:var(--primary);margin-bottom:3px;font-weight:600;}
table.gs{width:100%;border-collapse:collapse;font-size:10.5px;}
table.gs th{background:var(--primary);color:white;padding:3px 5px;text-align:center;font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.3px;}
table.gs td{border:1px solid #ccc;padding:3px 5px;text-align:center;background:white;font-weight:600;}
table.gs tr td:first-child{background:var(--grade-row);}

/* ── SIGNATURES ── */
.sig-ft{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 14px 6px;border-top:2px solid var(--primary);background:#fafbff;gap:4px;}
.sig-bl{text-align:center;}
.sig-ln{border-top:1px solid #888;margin:22px auto 4px;width:76%;min-height:40px;display:flex;align-items:flex-end;justify-content:center;}
.sig-ln img{max-height:38px;max-width:90%;object-fit:contain;}
.sig-la{font-family:'Cinzel',serif;font-size:8.5px;color:#333;letter-spacing:.3px;}
.sig-sl{font-size:7.5px;color:#aaa;margin-top:1px;}


/* ══════════════════════════════════════════════
   NURSERY SECTION DESIGN — Playful & Colourful
   ══════════════════════════════════════════════ */
.ns-card{font-family:'Nunito',sans-serif;}
.ns-card .report-card{padding:0;border-radius:18px;overflow:hidden;}
.ns-card .deco-border{border:5px dashed #ff6b6b !important;border-radius:18px;padding:8px;
  background:linear-gradient(135deg,#fff9f0 0%,#f0faff 50%,#fff0f9 100%);}
.ns-card .deco-border::before{border:none;}
.ns-card .deco-border::after{background-image:none;}
.ns-card .card-inner{border-radius:12px;border:none;overflow:visible;}
.ns-card .card-inner::before{display:none;}
.ns-rainbow-strip{height:14px;background:linear-gradient(90deg,#ff6b6b,#ff9f43,#ffd32a,#0be881,#18dcff,#7d5fff,#ff6b6b);border-radius:8px 8px 0 0;}
.ns-header{padding:16px 16px 12px;display:flex;align-items:center;gap:14px;
  background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 50%,#a18cd1 100%);
  position:relative;overflow:hidden;}
.ns-header::before{content:'⭐';position:absolute;top:-6px;right:12px;font-size:40px;opacity:.18;}
.ns-logo{width:76px;height:76px;border-radius:50%;border:4px solid white;overflow:hidden;
  background:white;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 12px rgba(0,0,0,.18);flex-shrink:0;}
.ns-logo img{width:100%;height:100%;object-fit:cover;}
.ns-logo-fb{font-size:8px;font-weight:800;color:#e65c00;text-align:center;padding:4px;font-family:'Fredoka One',sans-serif;}
.ns-hc{flex:1;text-align:center;}
.ns-school{font-family:'Fredoka One',cursive;font-size:clamp(14px,3vw,24px);
  color:#3d0c8f;text-shadow:1px 1px 0 rgba(255,255,255,.7);line-height:1.2;}
.ns-meta{font-size:10px;color:#5a3a6b;margin:3px 0 5px;}
.ns-title{font-family:'Fredoka One',cursive;font-size:17px;color:#e65c00;letter-spacing:.5px;}
.ns-sess{font-size:11px;color:#7d4cbb;font-weight:600;margin-top:2px;}
.ns-class{font-size:12px;color:#444;font-weight:700;margin-top:2px;}
.ns-pp{width:70px;height:88px;border-radius:8px;border:3px solid white;
  overflow:hidden;background:#f3e8ff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 3px 8px rgba(0,0,0,.2);cursor:pointer;flex-shrink:0;}
.ns-pp img{width:100%;height:100%;object-fit:cover;}
.ns-pp-ph{text-align:center;font-size:9px;color:#aaa;font-family:sans-serif;line-height:1.4;padding:4px;}

.ns-info{display:grid;grid-template-columns:1fr 1fr;border-bottom:3px solid #ffd32a;font-size:12px;font-family:'Nunito',sans-serif;}
.ns-info-row{display:flex;padding:5px 13px;gap:5px;align-items:center;border-bottom:1px solid rgba(0,0,0,.05);}
.ns-info-row:nth-child(odd){background:#fff9f0;border-right:2px dashed #ffd32a;}
.ns-info-row:nth-child(even){background:#f0faff;}
.ns-il{font-weight:800;color:#5a3a6b;white-space:nowrap;min-width:90px;font-size:11px;}
.ns-iv{font-weight:600;color:#333;flex:1;}

.ns-sec-hdr{padding:6px 14px;font-family:'Fredoka One',cursive;font-size:13px;letter-spacing:.5px;color:white;
  background:linear-gradient(90deg,#7d5fff,#18dcff);}
.ns-skill-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.ns-skill-item{display:flex;align-items:center;justify-content:space-between;
  padding:6px 13px;border-bottom:1px solid rgba(0,0,0,.05);}
.ns-skill-item:nth-child(odd){background:#fff3e0;border-right:2px dashed #ff9f43;}
.ns-skill-item:nth-child(even){background:#e8f5e9;}
.ns-skill-name{font-weight:700;color:#444;font-size:11.5px;}
.ns-stars{display:flex;gap:2px;}
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
.ns-sum-cell:nth-child(1){background:#fff3e0;}
.ns-sum-cell:nth-child(2){background:#e8f5e9;}
.ns-sum-cell:nth-child(3){background:#e3f2fd;}
.ns-sum-cell:nth-child(4){background:#fce4ec;}
.ns-sum-lbl{font-family:'Fredoka One',cursive;font-size:9px;letter-spacing:.5px;display:block;color:#666;}
.ns-sum-val{font-family:'Fredoka One',cursive;font-size:22px;line-height:1;display:block;margin-top:2px;}
.ns-sum-icon{font-size:18px;display:block;margin-bottom:2px;}

.ns-remark{padding:7px 13px;font-size:12px;border-top:2px dashed rgba(0,0,0,.08);background:#fffbf0;}
.ns-remark-lbl{font-family:'Fredoka One',cursive;font-size:10px;color:#e65c00;display:block;margin-bottom:2px;}

.ns-promo{padding:9px 14px;background:linear-gradient(90deg,#e0f7fa,#f9fbe7);
  font-family:'Fredoka One',cursive;font-size:14px;color:#00796b;border-top:2px dashed #80cbc4;}

.ns-sig{display:grid;grid-template-columns:1fr 1fr;padding:10px 14px 8px;
  border-top:3px dashed #ffd32a;background:#fffbf0;gap:8px;}
.ns-sig-bl{text-align:center;}
.ns-sig-ln{border-top:2px dashed #bbb;margin:22px auto 4px;width:76%;min-height:36px;
  display:flex;align-items:flex-end;justify-content:center;}
.ns-sig-ln img{max-height:34px;max-width:88%;object-fit:contain;}
.ns-sig-la{font-family:'Fredoka One',cursive;font-size:10px;color:#5a3a6b;letter-spacing:.3px;}
.ns-sig-sl{font-size:8.5px;color:#aaa;margin-top:1px;}

/* ══════════════════════════════════════════════
   PRIMARY SECTION DESIGN — Warm Terracotta
   ══════════════════════════════════════════════ */
.pr-card{font-family:'Poppins',sans-serif;}
.pr-card .report-card{padding:7px;}
.pr-card .deco-border{border:3px solid #b85c00 !important;border-radius:3px;padding:3px;}
.pr-card .deco-border::before{border-color:#f0a060;inset:3px;}
.pr-card .deco-border::after{background-image:radial-gradient(circle at 0% 0%,#b85c00 0,transparent 13px),radial-gradient(circle at 100% 0%,#b85c00 0,transparent 13px),radial-gradient(circle at 0% 100%,#b85c00 0,transparent 13px),radial-gradient(circle at 100% 100%,#b85c00 0,transparent 13px);}
.pr-card .card-inner{border-color:#e8c8a8;}
.pr-card .deco-strip{height:7px;background:repeating-linear-gradient(90deg,#b85c00 0px,#b85c00 8px,#f0a060 8px,#f0a060 16px);}

.pr-header{padding:11px 14px 10px;display:grid;grid-template-columns:74px 1fr 80px;gap:10px;align-items:center;
  border-bottom:2px solid #b85c00;background:linear-gradient(135deg,#fff8f2 0%,#fff3ea 100%);}
.pr-logo{width:68px;height:68px;border-radius:50%;border:2px solid #b85c00;overflow:hidden;
  background:#fff8f2;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(184,92,0,.15);}
.pr-logo img{width:100%;height:100%;object-fit:cover;}
.pr-logo-fb{font-family:'Poppins',sans-serif;font-size:7.5px;font-weight:700;color:#b85c00;text-align:center;padding:4px;line-height:1.3;}
.pr-hc{text-align:center;}
.pr-school{font-family:'Playfair Display',serif;font-size:clamp(12px,2.3vw,20px);font-weight:700;color:#7a3500;letter-spacing:.3px;line-height:1.2;}
.pr-meta{font-size:9.5px;color:#666;margin-top:2px;font-style:italic;}
.pr-divider{height:1.5px;background:linear-gradient(90deg,transparent,#f0a060,#b85c00,#f0a060,transparent);margin:4px auto;width:72%;}
.pr-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#7a3500;letter-spacing:.2px;}
.pr-sess{font-size:11px;color:#b85c00;font-weight:600;margin-top:2px;}
.pr-class{font-size:11px;color:#555;margin-top:2px;}
.pr-class span{font-weight:700;color:#7a3500;}
.pr-pp{width:70px;height:86px;border:2px solid #b85c00;background:#fff8f2;
  display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;}
.pr-pp img{width:100%;height:100%;object-fit:cover;}
.pr-pp-ph{text-align:center;font-size:8.5px;color:#ccc;font-family:sans-serif;line-height:1.4;padding:4px;}

.pr-info{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #b85c00;font-size:11.5px;}
.pr-info-row{display:flex;align-items:baseline;padding:5px 12px;border-bottom:1px solid #f0e0d0;gap:5px;}
.pr-info-row:nth-child(odd){background:#fffaf6;border-right:1px solid #f0e0d0;}
.pr-info-row:nth-child(even){background:#fff;}
.pr-info-row:nth-last-child(-n+2){border-bottom:none;}
.pr-il{font-weight:700;color:#7a3500;white-space:nowrap;min-width:110px;font-family:'Poppins',sans-serif;font-size:10.5px;}
.pr-iv{border-bottom:1px dotted #d4a080;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;font-family:'EB Garamond',Georgia,serif;font-size:12px;}

.pr-sec-hdr{background:linear-gradient(90deg,#b85c00,#d4762a);color:white;
  font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:1.8px;padding:4px 12px;text-transform:uppercase;font-weight:600;}

.pr-table{width:100%;border-collapse:collapse;font-size:11px;}
.pr-table th,.pr-table td{border:1px solid #e8c8a8;padding:4px 5px;text-align:center;vertical-align:middle;}
.pr-table th{background:linear-gradient(90deg,#b85c00,#c87030);color:white;
  font-family:'Cinzel',serif;font-size:7.8px;letter-spacing:.4px;font-weight:600;}
.pr-table td.sn{text-align:left;font-weight:700;font-size:11px;color:#7a3500;padding-left:10px;background:#fff8f2;white-space:nowrap;}
.pr-table tr:nth-child(even) td:not(.sn){background:#fff4ec;}

.pr-sum{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid #b85c00;border-bottom:1px solid #e8c8a8;}
.pr-sum-cell{text-align:center;padding:7px 4px;border-right:1px solid #e8c8a8;background:linear-gradient(180deg,#fff8f2,#fff);}
.pr-sum-cell:last-child{border-right:none;}
.pr-sl{display:inline-block;font-family:'Cinzel',serif;font-size:7px;letter-spacing:1px;
  text-transform:uppercase;color:white;padding:2px 8px;border-radius:20px;margin-bottom:4px;}
.pr-sv{display:block;font-family:'Playfair Display',serif;font-size:18px;font-weight:700;line-height:1.1;}

.pr-two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e8c8a8;}
.pr-co-col{border-right:2px solid #b85c00;}
.pr-co-h{background:linear-gradient(90deg,#b85c00,#c87030);color:white;text-align:center;
  padding:4px 8px;font-family:'Cinzel',serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;}
.pr-di-h{background:linear-gradient(90deg,#2d6a9f,#3d8ac0);color:white;text-align:center;
  padding:4px 8px;font-family:'Cinzel',serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;}
.pr-ach{display:flex;justify-content:space-between;align-items:center;padding:3px 10px;
  font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;}
.pr-co-col .pr-ach{background:rgba(184,92,0,.08);color:#7a3500;}
.pr-di-col .pr-ach{background:rgba(45,106,159,.08);color:#1a3d5e;}
.pr-ar{display:flex;align-items:center;justify-content:space-between;padding:3.5px 10px;
  border-bottom:1px solid rgba(0,0,0,.06);font-size:11px;}
.pr-co-col .pr-ar{background:#fff8f2;}
.pr-di-col .pr-ar{background:#f0f7ff;}
.pr-ar:nth-child(even){filter:brightness(.975);}
.pr-grade-box{min-width:36px;height:18px;border:1px solid #e8c8a8;background:white;
  display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#7a3500;}

.pr-promo{padding:6px 14px;border-top:1px solid #e8c8a8;background:#fff8f2;
  font-family:'Playfair Display',serif;font-size:12.5px;font-weight:700;color:#7a3500;}
.pr-promo span{border-bottom:1.5px dotted #b85c00;min-width:60px;display:inline-block;font-style:italic;}

.pr-sig{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 14px 6px;
  border-top:2px solid #b85c00;background:#fff8f2;gap:4px;}

/* ══════════════════════════════════════════════
   VOCATIONAL / TECHNICAL CARD — Industrial Bold
   ══════════════════════════════════════════════ */
.vc-card{font-family:'Poppins',sans-serif;}
.vc-card .report-card{padding:0;box-shadow:0 4px 28px rgba(0,0,0,.18);}
.vc-outer{border:3px solid #8b4500;padding:4px;background:white;}
.vc-inner{border:1px solid #e0c8a8;background:white;overflow:hidden;}
.vc-top-bar{height:9px;background:repeating-linear-gradient(90deg,#8b4500 0,#8b4500 12px,#f0a832 12px,#f0a832 24px,#1a3a6e 24px,#1a3a6e 36px,#f0a832 36px,#f0a832 48px);}

.vc-header{display:grid;grid-template-columns:72px 1fr 76px;gap:10px;align-items:center;
  padding:11px 14px 10px;border-bottom:2px solid #8b4500;
  background:linear-gradient(135deg,#fdf8f0 0%,#faf2e4 100%);}
.vc-logo{width:66px;height:66px;border-radius:4px;border:2px solid #8b4500;overflow:hidden;
  background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(139,69,0,.2);}
.vc-logo img{width:100%;height:100%;object-fit:cover;}
.vc-hc{text-align:center;}
.vc-school{font-family:'Cinzel',serif;font-size:clamp(11px,2.2vw,18px);font-weight:900;color:#5a2a00;letter-spacing:.3px;line-height:1.2;}
.vc-meta{font-size:9.5px;color:#777;margin-top:2px;font-style:italic;}
.vc-rule{height:2px;background:linear-gradient(90deg,transparent,#f0a832,#8b4500,#f0a832,transparent);margin:5px auto;width:70%;}
.vc-badge{display:inline-block;padding:3px 14px;background:#8b4500;color:white;
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:2px;font-weight:600;text-transform:uppercase;border-radius:2px;}
.vc-sess{font-size:10px;color:#7a4500;margin-top:4px;font-weight:600;}
.vc-pp-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;}
.vc-pp{width:66px;height:80px;border:2px solid #8b4500;background:#fdf8f0;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;border-radius:2px;}
.vc-pp img{width:100%;height:100%;object-fit:cover;}
.vc-pp-ph{text-align:center;font-size:8px;color:#bbb;font-family:sans-serif;line-height:1.4;padding:4px;}

.vc-info{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #8b4500;font-size:11.5px;}
.vc-info-row{display:flex;align-items:baseline;padding:4.5px 12px;border-bottom:1px solid #f0e0c8;gap:5px;}
.vc-info-row:nth-child(odd){background:#fdf8f2;border-right:1px solid #f0dfc0;}
.vc-info-row:nth-child(even){background:#fff;}
.vc-info-row:nth-last-child(-n+2){border-bottom:none;}
.vc-il{font-weight:700;color:#5a2a00;white-space:nowrap;min-width:114px;font-size:10.5px;}
.vc-iv{border-bottom:1px dotted #c8a080;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;font-family:'EB Garamond',Georgia,serif;font-size:12px;}

.vc-sec-hdr{background:linear-gradient(90deg,#8b4500,#b05a00);color:white;padding:4px 12px;
  font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:1.8px;text-transform:uppercase;
  display:flex;align-items:center;gap:6px;}
.vc-sec-hdr span{opacity:.8;}

.vc-table{width:100%;border-collapse:collapse;font-size:11px;}
.vc-table th,.vc-table td{border:1px solid #e8d0b0;padding:4px 5px;text-align:center;vertical-align:middle;}
.vc-table th{background:linear-gradient(90deg,#8b4500,#a05000);color:white;
  font-family:'Cinzel',serif;font-size:7.8px;letter-spacing:.4px;font-weight:600;}
.vc-sn{text-align:left!important;font-weight:700;font-size:11px;color:#5a2a00;padding-left:10px!important;background:#fdf8f2!important;white-space:nowrap;}
.vc-table tr:nth-child(even) td:not(.vc-sn){background:#fdf5ec;}
.vc-grade{display:inline-block;padding:1px 8px;background:#fff3e0;border:1px solid #e8a060;
  border-radius:3px;font-size:10px;font-weight:700;color:#5a2a00;}

.vc-sum{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid #8b4500;border-bottom:1px solid #e8d0b0;}
.vc-sum-cell{text-align:center;padding:8px 4px;border-right:1px solid #e8d0b0;}
.vc-sum-cell:last-child{border-right:none;}
.vc-sum-lbl{font-family:'Cinzel',serif;font-size:7px;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:4px;}
.vc-sum-val{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;line-height:1.1;}

.vc-two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e8d0b0;}
.vc-co-col{border-right:2px solid #8b4500;}
.vc-col-hdr{background:linear-gradient(90deg,#8b4500,#a05800);color:white;text-align:center;
  padding:4px 8px;font-family:'Cinzel',serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;}
.vc-di-col .vc-col-hdr{background:linear-gradient(90deg,#1a3a6e,#2a5090);}
.vc-col-sub{display:flex;justify-content:space-between;padding:3px 10px;
  font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;}
.vc-co-col .vc-col-sub{background:rgba(139,69,0,.07);color:#5a2a00;}
.vc-di-col .vc-col-sub{background:rgba(26,58,110,.07);color:#1a2e5a;}
.vc-ar{display:flex;align-items:center;justify-content:space-between;padding:3.5px 10px;
  border-bottom:1px solid rgba(0,0,0,.05);font-size:11px;}
.vc-co-col .vc-ar{background:#fdf8f2;}
.vc-di-col .vc-ar{background:#f4f7ff;}
.vc-ar:nth-child(even){filter:brightness(.975);}
.vc-grade-box{min-width:36px;height:18px;border:1px solid #e0c8a8;background:white;
  display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#5a2a00;}

.vc-remark{padding:5px 12px;font-size:11px;border-top:1px solid #f0e0c8;background:#fdf8f0;font-family:'EB Garamond',Georgia,serif;}
.vc-remark-lbl{font-family:'Cinzel',serif;font-size:7.5px;text-transform:uppercase;letter-spacing:.8px;color:#8b4500;display:block;margin-bottom:2px;font-weight:700;}
.vc-promo{padding:6px 14px;border-top:1px solid #f0e0c8;background:#fdf8f0;
  font-family:'Playfair Display',serif;font-size:12.5px;font-weight:700;color:#5a2a00;}
.vc-promo span{border-bottom:1.5px dotted #c87800;min-width:70px;display:inline-block;font-style:italic;}
.vc-next{padding:4px 14px;font-size:11px;border-top:1px solid #f0e0c8;background:#fdf8f0;font-family:'EB Garamond',Georgia,serif;}
.vc-sig{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 14px 6px;
  border-top:2px solid #8b4500;background:#fdf8f0;gap:4px;}

/* ══════════════════════════════════════════════
   TERTIARY CARD — Formal Academic Transcript
   ══════════════════════════════════════════════ */
.tc-card{font-family:'EB Garamond',Georgia,serif;}
.tc-card .report-card{padding:0;box-shadow:0 4px 28px rgba(0,0,0,.18);}
.tc-outer{border:3px solid #1a2e6e;padding:5px;background:white;}
.tc-inner{border:1.5px solid #c0cae8;background:white;overflow:hidden;}

.tc-crest-band{display:flex;align-items:stretch;border-bottom:2px solid #1a2e6e;}
.tc-crest-left,.tc-crest-right{flex:1;background:linear-gradient(135deg,#1a2e6e 0%,#2a44a0 100%);}
.tc-crest-left{background:linear-gradient(135deg,#1a2e6e,#2a3e8e);}
.tc-crest-right{background:linear-gradient(135deg,#2a3e8e,#1a2e6e);}
.tc-crest-center{flex-shrink:0;padding:10px 16px;background:white;border-left:2px solid #c8a832;border-right:2px solid #c8a832;}
.tc-logo{width:64px;height:64px;border-radius:50%;border:3px double #1a2e6e;overflow:hidden;
  background:#f8f9fe;display:flex;align-items:center;justify-content:center;}
.tc-logo img{width:100%;height:100%;object-fit:cover;}

.tc-school-block{text-align:center;padding:10px 14px 8px;border-bottom:1px solid #dde4f4;
  background:linear-gradient(180deg,#f8f9fe 0%,#fff 100%);}
.tc-school{font-family:'Cinzel',serif;font-size:clamp(12px,2.4vw,20px);font-weight:900;color:#1a2e6e;letter-spacing:.4px;line-height:1.2;}
.tc-meta{font-size:9.5px;color:#666;margin-top:2px;font-style:italic;}
.tc-rule{height:1.5px;background:linear-gradient(90deg,transparent,#c8a832,#1a2e6e,#c8a832,transparent);margin:6px auto;width:60%;}
.tc-doc-title{font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;color:#1a2e6e;text-transform:uppercase;font-weight:700;}
.tc-sess{font-size:10.5px;color:#555;margin-top:3px;}

.tc-student-block{display:grid;grid-template-columns:82px 1fr;gap:12px;padding:10px 14px;border-bottom:2px solid #1a2e6e;align-items:start;}
.tc-pp-wrap{display:flex;flex-direction:column;align-items:center;gap:3px;}
.tc-pp{width:72px;height:88px;border:2px solid #1a2e6e;background:#f8f9fe;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;}
.tc-pp img{width:100%;height:100%;object-fit:cover;}
.tc-pp-ph{text-align:center;font-size:8px;color:#bbb;font-family:sans-serif;line-height:1.4;padding:4px;}
.tc-details{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.tc-detail-row{display:flex;align-items:baseline;padding:4px 8px;border-bottom:1px solid #edf0f8;gap:4px;}
.tc-detail-row:nth-child(odd){background:#f8f9fe;border-right:1px solid #e8ecf8;}
.tc-detail-row:nth-child(even){background:#fff;}
.tc-dl{font-weight:700;color:#333;white-space:nowrap;min-width:105px;font-size:10.5px;font-family:'Poppins',sans-serif;}
.tc-dv{border-bottom:1px dotted #a0aacf;flex:1;min-height:14px;color:#111;padding-left:2px;font-style:italic;}

.tc-sec-hdr{background:#1a2e6e;color:white;padding:5px 14px;
  font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-bottom:2px solid #c8a832;}

.tc-table{width:100%;border-collapse:collapse;font-size:11px;}
.tc-table th,.tc-table td{border:1px solid #d0d8f0;padding:4px 5px;text-align:center;vertical-align:middle;}
.tc-table th{background:#1a2e6e;color:white;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.4px;font-weight:600;}
.tc-sn{text-align:left!important;font-weight:700;font-size:11px;color:#1a2e6e;padding-left:12px!important;background:#f8f9fe!important;white-space:nowrap;}
.tc-table tr:nth-child(even) td:not(.tc-sn){background:#f2f5fd;}
.tc-grade{display:inline-block;padding:1px 8px;background:#eef2fe;border:1px solid #b0bcee;
  border-radius:3px;font-size:10px;font-weight:700;color:#1a2e6e;}

.tc-gpa-band{display:grid;grid-template-columns:1fr 1fr 1.3fr 1fr;border-top:2px solid #1a2e6e;border-bottom:1px solid #d0d8f0;}
.tc-gpa-cell{text-align:center;padding:8px 4px;border-right:1px solid #d0d8f0;}
.tc-gpa-cell:last-child{border-right:none;}
.tc-gpa-highlight{background:linear-gradient(180deg,#eef2fe,#fff);}
.tc-gpa-lbl{font-family:'Cinzel',serif;font-size:7px;letter-spacing:1.2px;text-transform:uppercase;color:#888;margin-bottom:3px;}
.tc-gpa-val{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;line-height:1.1;color:#1a2e6e;}

.tc-two-col{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #d0d8f0;}
.tc-co-col{border-right:2px solid #1a2e6e;}
.tc-col-hdr{background:#1a2e6e;color:white;text-align:center;padding:4px 8px;
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;}
.tc-di-col .tc-col-hdr{background:#2a4488;}
.tc-col-sub{display:flex;justify-content:space-between;padding:3px 10px;
  font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;}
.tc-co-col .tc-col-sub{background:rgba(26,46,110,.07);color:#111e4a;}
.tc-di-col .tc-col-sub{background:rgba(42,68,136,.07);color:#1a2e6e;}
.tc-ar{display:flex;align-items:center;justify-content:space-between;padding:3.5px 10px;
  border-bottom:1px solid rgba(0,0,0,.05);font-size:11px;}
.tc-co-col .tc-ar{background:#f8f9fe;}
.tc-di-col .tc-ar{background:#f5f7fe;}
.tc-ar:nth-child(even){filter:brightness(.975);}
.tc-grade-box{min-width:36px;height:18px;border:1px solid #b0bcee;background:white;
  display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1a2e6e;}

.tc-remark{padding:5px 12px;font-size:11.5px;border-top:1px solid #dde4f4;background:#f8f9fe;}
.tc-remark-lbl{font-family:'Cinzel',serif;font-size:7.5px;text-transform:uppercase;letter-spacing:.8px;color:#1a2e6e;display:block;margin-bottom:2px;font-weight:700;}
.tc-promo{padding:6px 14px;border-top:1px solid #dde4f4;background:#f8f9fe;
  font-family:'Playfair Display',serif;font-size:12.5px;font-weight:700;color:#1a2e6e;}
.tc-promo span{border-bottom:1.5px dotted #c8a832;min-width:70px;display:inline-block;font-style:italic;}
.tc-next{padding:4px 14px;font-size:11px;border-top:1px solid #dde4f4;background:#f8f9fe;}
.tc-sig{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 14px 6px;
  border-top:2px solid #1a2e6e;background:#f8f9fe;gap:4px;}
.tc-foot-rule{height:6px;background:linear-gradient(90deg,#1a2e6e,#c8a832,#1a2e6e);}

/* ══════════════════════════════════════════════
   CERTIFICATE / TESTIMONIAL STYLES
   ══════════════════════════════════════════════ */
.cert-wrap{max-width:820px;margin:14px auto;}
.cert-page{background:white;box-shadow:0 4px 22px rgba(0,0,0,.18);position:relative;
  padding:0;overflow:hidden;}
.cert-outer-border{margin:12px;border:3px solid #c8860a;padding:8px;position:relative;}
.cert-outer-border::before{content:'';position:absolute;inset:4px;border:1px solid #f0c040;pointer-events:none;}
.cert-outer-border::after{content:'';position:absolute;inset:0;
  background-image:radial-gradient(circle at 0% 0%,#c8860a 0,transparent 14px),radial-gradient(circle at 100% 0%,#c8860a 0,transparent 14px),radial-gradient(circle at 0% 100%,#c8860a 0,transparent 14px),radial-gradient(circle at 100% 100%,#c8860a 0,transparent 14px);
  pointer-events:none;}
.cert-inner{border:1px solid #1a2e6e;padding:0;background:
  radial-gradient(ellipse at 50% 0%,rgba(200,134,10,.07) 0%,transparent 60%),
  radial-gradient(ellipse at 50% 100%,rgba(26,46,110,.07) 0%,transparent 60%),
  white;
  position:relative;z-index:2;}
.cert-top-strip{height:12px;background:repeating-linear-gradient(90deg,#1a2e6e 0,#1a2e6e 8px,#c8860a 8px,#c8860a 16px);}
.cert-header{padding:18px 20px 14px;display:flex;align-items:center;gap:14px;border-bottom:2px solid #e8d5b0;}
.cert-logo{width:82px;height:82px;border-radius:50%;border:3px double #c8860a;overflow:hidden;
  background:#fff8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cert-logo img{width:100%;height:100%;object-fit:cover;}
.cert-logo-fb{font-family:'Cinzel',serif;font-size:8px;font-weight:700;color:#c8860a;text-align:center;padding:5px;line-height:1.3;}
.cert-hc{flex:1;text-align:center;}
.cert-school-name{font-family:'Cinzel',serif;font-size:clamp(14px,2.8vw,22px);font-weight:900;
  color:#1a2e6e;letter-spacing:.5px;}
.cert-meta{font-size:10px;color:#666;margin-top:3px;font-style:italic;}
.cert-gold-div{height:2px;background:linear-gradient(90deg,transparent,#c8860a,#f0c040,#c8860a,transparent);margin:6px auto;width:70%;}
.cert-type-label{font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:#c8860a;text-transform:uppercase;font-weight:600;}

.cert-body{padding:20px 28px 14px;text-align:center;}
.cert-medallion{display:inline-flex;align-items:center;justify-content:center;
  width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,#f0c040,#c8860a);
  margin-bottom:12px;box-shadow:0 4px 16px rgba(200,134,10,.4);
  font-size:32px;position:relative;}
.cert-medallion::before{content:'';position:absolute;inset:-5px;border-radius:50%;
  border:2px solid #f0c040;animation:certPulse 3s ease-in-out infinite;}
@keyframes certPulse{0%,100%{transform:scale(1);opacity:.7;}50%{transform:scale(1.1);opacity:1;}}
.cert-certify-text{font-family:'EB Garamond',Georgia,serif;font-size:14px;color:#555;margin-bottom:8px;}
.cert-name{font-family:'Playfair Display',serif;font-size:clamp(20px,4vw,30px);font-weight:900;
  color:#1a2e6e;letter-spacing:.5px;line-height:1.2;margin:6px 0;}
.cert-name-underline{height:2px;background:linear-gradient(90deg,transparent,#c8860a,transparent);margin:0 auto 12px;width:60%;}
.cert-detail-line{font-family:'EB Garamond',Georgia,serif;font-size:13px;color:#444;margin:5px 0;line-height:1.6;}
.cert-detail-line strong{color:#1a2e6e;}
.cert-achievement{display:inline-block;margin:10px 0;padding:8px 22px;
  background:linear-gradient(135deg,#fffbe6,#fff5cc);border:1px solid #f0c040;border-radius:4px;
  font-family:'Playfair Display',serif;font-size:15px;color:#7a4f00;font-weight:700;}
.cert-stats-row{display:flex;justify-content:center;gap:20px;margin:14px 0;flex-wrap:wrap;}
.cert-stat-box{text-align:center;padding:8px 16px;background:#f5f8ff;border:1px solid #c9d6f0;border-radius:6px;min-width:90px;}
.cert-stat-val{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1a2e6e;display:block;}
.cert-stat-lbl{font-size:10px;color:#777;letter-spacing:.5px;text-transform:uppercase;}

.cert-word{font-family:'EB Garamond',Georgia,serif;font-style:italic;font-size:13px;
  color:#555;border-left:3px solid #c8860a;padding:8px 16px;text-align:left;
  background:#fffbe6;margin:12px 0;line-height:1.7;}

.cert-sig-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:16px 28px 12px;
  border-top:2px solid #e8d5b0;background:#fafafa;}
.cert-sig-blk{text-align:center;}
.cert-sig-line{border-top:1px solid #888;margin:30px auto 5px;width:80%;}
.cert-sig-img-wrap{min-height:42px;display:flex;align-items:flex-end;justify-content:center;}
.cert-sig-img-wrap img{max-height:40px;max-width:90%;object-fit:contain;}
.cert-sig-la{font-family:'Cinzel',serif;font-size:9.5px;color:#333;letter-spacing:.5px;}
.cert-sig-sl{font-size:8.5px;color:#999;margin-top:2px;font-style:italic;}
.cert-stamp-area{width:76px;height:76px;border:2px dashed #c8860a;border-radius:50%;
  display:flex;align-items:center;justify-content:center;margin:0 auto 4px;
  font-size:9px;color:#c8860a;font-family:'Cinzel',serif;text-align:center;padding:8px;letter-spacing:.5px;}

.cert-bottom{text-align:center;padding:8px;font-size:9px;color:#aaa;
  font-style:italic;border-top:1px solid #eee;background:white;}

/* Testimonial / leaving cert extras */
.test-header-badge{display:inline-block;padding:4px 18px;border:1px solid #c8860a;
  font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:#c8860a;
  text-transform:uppercase;margin-bottom:10px;}
.test-body{padding:14px 28px;font-family:'EB Garamond',Georgia,serif;font-size:13.5px;
  line-height:1.9;color:#333;text-align:justify;}
.test-body strong{color:#1a2e6e;}
.test-para{margin-bottom:10px;}
.test-conduct{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin:10px 0;
  padding:10px;background:#f8f9ff;border:1px solid #dce4f5;border-radius:4px;}
.test-conduct-item{text-align:center;min-width:90px;}
.test-conduct-label{font-size:10px;color:#777;letter-spacing:.5px;text-transform:uppercase;display:block;}
.test-conduct-val{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#1a2e6e;display:block;}
.test-cert-no{font-size:11px;color:#888;font-family:sans-serif;margin-top:6px;}

/* Certificate toggle button */
.btn-cert{background:linear-gradient(135deg,#c8860a,#f0c040);color:#3d2000;font-weight:700;}
.btn-cert:hover{filter:brightness(1.07);}

@media print{
  .cert-page{box-shadow:none!important;}
  .cert-outer-border{border-color:#000!important;}
  @keyframes certPulse{0%,100%{opacity:1;}}
}

/* ── Print rules ── */
@media print {
  .no-print { display:none!important; }
  .rc-page-header { display:none!important; }
  .control-bar { display:none!important; }
  .class-banner { display:none!important; }
  .card-action-bar { display:none!important; }
  #ai-assistant-btn, #assistant-btn, .ai-assistant,
  .assistant-fab, [id*='assistant'], [class*='assistant-btn'],
  [class*='ai-fab'] { display:none!important; }
  .rc-shell { background:white!important; padding:0!important; margin:0!important; min-height:unset!important; }
  .rc-card { display:none!important; }
  body { background:white!important; padding:0!important; }
  .report-card { box-shadow:none!important; }
  .card-wrap { margin:0!important; }
  .deco-border { border:3px solid #000!important; }
  .print-page-break { page-break-before:always; }
}
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════════════════
   SHARED STATE
═══════════════════════════════════════════════════════════ */
let _school=null, _scale=null, _exams=null, _term=null, _classRow=null;
let _bulkResults=null, _bulkAtt=null, _bulkAffective=null;
let _classSubjects=null;
let _allTerms=[];
let _currentStudent=null;

/* ═══════════════════════════════════════════════════════════
   ENGINE — helpers, builders, buildCard
═══════════════════════════════════════════════════════════ */
function gradeFromScale(score,scale){
  if(score===null||score===undefined||!scale?.length)return{grade:'—',remark:''};
  const g=scale.find(s=>score>=s.min_score&&score<=s.max_score);
  return g?{grade:g.grade,remark:g.remark||''}:{grade:'—',remark:''};
}
function gradeBadge(g){
  if(!g||g==='—')return '<span class="gb gDf">—</span>';
  const m={'A+':'Ap','A':'A','B+':'Bp','B':'B','C+':'Cp','C':'C','D':'D','F':'F','F9':'F','E8':'F','D7':'D'};
  const c=m[g]||(g.startsWith('A')?'Ap':g.startsWith('B')?'Bp':g.startsWith('C')?'Cp':'Df');
  return `<span class="gb g${c}">${g}</span>`;
}
function fmtDate(d){if(!d)return '—';try{return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});}catch{return d;}}
function sigHTML(label,url){
  return `<div class="sig-bl"><div class="sig-ln">${url?`<img src="${url}" alt="${label}" crossorigin="anonymous">`:''}</div>
    <div class="sig-la">${label}</div><div class="sig-sl">Signature &amp; Stamp</div></div>`;
}
function rmHTML(label,text,bg,color){
  if(!text)return '';
  return `<div class="rm-row" style="background:${bg}"><span class="rm-lbl" style="color:${color}">${label}</span>${text}</div>`;
}
function actRows(fields,data){
  return fields.map(([k,l])=>`<div class="ar"><span>${l}</span><span class="grade-box">${data?.[k]||''}</span></div>`).join('');
}


/* ═══ OPEN CERTIFICATE / TESTIMONIAL PAGES ═══ */
function openCertPage(){
  if(!_currentStudent){alert('Please load a student report card first.');return;}
  const {student}=_currentStudent;
  window.open(`/report-card/certificate.html?student_id=${encodeURIComponent(student.id)}&term_id=${encodeURIComponent((typeof _tid !== "undefined" ? _tid : ""))}`,'_blank');
}
function openTestPage(){
  if(!_currentStudent){alert('Please load a student report card first.');return;}
  const {student}=_currentStudent;
  window.open(`/report-card/testimonial.html?student_id=${encodeURIComponent(student.id)}&term_id=${encodeURIComponent((typeof _tid !== "undefined" ? _tid : ""))}`,'_blank');
}

/* ═══ INSTITUTION THEME ENGINE ═══
 * Theme is resolved in this priority order:
 *  1. Manual override via the Layout dropdown (stored in _cardThemeOverride)
 *  2. school.school_type from the database
 *  3. Class name / level / section keyword pattern matching (fallback)
 *
 * Themes: nursery | primary | secondary | vocational | tertiary
 * Each maps to a distinct card builder and visual style.
 */
let _cardThemeOverride = null;   // null = auto; string = manual pick

/* Map school_type DB values → internal theme keys */
const SCHOOL_TYPE_MAP = {
  // Nursery / Early childhood
  'nursery':        'nursery',
  'nursery_school': 'nursery',
  'creche':         'nursery',
  'crèche':         'nursery',
  'kindergarten':   'nursery',
  'pre_school':     'nursery',
  'preschool':      'nursery',
  'early_childhood':'nursery',
  // Primary
  'primary':        'primary',
  'primary_school': 'primary',
  'elementary':     'primary',
  'basic':          'primary',
  // Secondary / High school
  'secondary':      'secondary',
  'high_school':    'secondary',
  'senior_secondary':'secondary',
  'junior_secondary':'primary',
  'jss':            'primary',
  'sss':            'secondary',
  // Vocational / Technical
  'vocational':     'vocational',
  'technical':      'vocational',
  'polytechnic':    'vocational',
  'trade':          'vocational',
  'vocational_training':'vocational',
  'training_center':'vocational',
  'training_centre':'vocational',
  // Tertiary / Higher institution
  'tertiary':       'tertiary',
  'university':     'tertiary',
  'college':        'tertiary',
  'institute':      'tertiary',
  'institution':    'tertiary',
  'higher_institution':'tertiary',
};

/* Human-readable theme labels */
const THEME_LABELS = {
  nursery:    '🎨 Nursery / Kindergarten',
  primary:    '📗 Primary / Elementary',
  secondary:  '🏛️ Secondary / High School',
  vocational: '🔧 Vocational / Technical',
  tertiary:   '🎓 Tertiary / Institution',
};

/**
 * Detect theme from school_type first, then fall back to class-name keywords.
 * Returns one of: nursery | primary | secondary | vocational | tertiary
 */
function detectTheme(schoolTypeRaw, classRow) {
  // 1. school_type from DB
  if (schoolTypeRaw) {
    const key = schoolTypeRaw.toString().toLowerCase().replace(/[\s-]/g, '_');
    if (SCHOOL_TYPE_MAP[key]) return SCHOOL_TYPE_MAP[key];
  }
  // 2. Class name / level / section keyword fallback
  const s = (classRow?.level || classRow?.section || classRow?.name || '').toLowerCase();
  if (/nursery|crèche|creche|toddler|kinder|reception|pre[\s-]?school|early\s*child|playgroup|kg|k\.g|kindergarten/.test(s))
    return 'nursery';
  if (/vocational|technical|trade|craft|artisan|nce|ond|hnd|diploma|certificate\s*prog/.test(s))
    return 'vocational';
  if (/university|tertiary|degree|bsc|hnd|college|institution|faculty|department|level\s*[1-9]00/.test(s))
    return 'tertiary';
  if (/primary|pry|basic|elementary|standard\s*[1-9]|class\s*[1-6]$|year\s*[1-6]$/.test(s))
    return 'primary';
  if (/jss|junior|lower\s*sec/.test(s))
    return 'primary';
  // Default for anything else (sss, ss1-3, senior, form, etc.)
  return 'secondary';
}

/**
 * Get the resolved theme, respecting manual overrides.
 */
function getCardTheme(classRow) {
  if (_cardThemeOverride && _cardThemeOverride !== 'auto') return _cardThemeOverride;
  return detectTheme(_school?.school_type || null, classRow);
}

/**
 * Called when admin changes the Layout dropdown manually.
 */
function onInstThemeChange(val) {
  _cardThemeOverride = val === 'auto' ? null : val;
  updateDetectedBadge(_classRow);
  if (typeof _students !== "undefined" && _students.length && typeof _loadCard === "function") _loadCard(_students[_ci]);
}

/**
 * Update the "Auto-detected: X" badge in the control bar.
 */
function updateDetectedBadge(classRow) {
  const badge = document.getElementById('detectedBadge');
  const sel   = document.getElementById('instThemeSel');
  if (!badge) return;
  if (!_cardThemeOverride || _cardThemeOverride === 'auto') {
    const detected = detectTheme(_school?.school_type || null, classRow);
    badge.textContent = 'Auto: ' + (THEME_LABELS[detected] || detected);
    badge.style.display = 'inline-block';
    if (sel) sel.value = 'auto';
  } else {
    badge.textContent = THEME_LABELS[_cardThemeOverride] || _cardThemeOverride;
    badge.style.display = 'inline-block';
    badge.style.background = '#fef3c7';
    badge.style.color = '#92400e';
  }
}

/* ═══ SHARED DATA PREP ═══ */
function prepCardData(student,results,attData,affective){
  const cn=_classRow?.name||'—';
  const sec=(_classRow?.section||_classRow?.level||'').toUpperCase();
  const classLabel=sec?`${cn} — Section ${sec}`:cn;
  const examList=_exams?.length?_exams:[...new Map((results||[]).map(r=>[r.exam_id,r.exams])).values()].filter(Boolean);
  let subjectBase;
  if(_classSubjects?.length){
    // Deduplicate by subject_id — class_subjects may have duplicate entries
    const seen=new Map();
    _classSubjects.forEach(cs=>{
      if(!seen.has(cs.subject_id))
        seen.set(cs.subject_id,{id:cs.subject_id,name:cs.subjects?.name||cs.subject_name||'—'});
    });
    subjectBase=[...seen.values()];
  } else {
    const seen=new Map();
    (results||[]).forEach(r=>{if(!seen.has(r.subject_id))seen.set(r.subject_id,{id:r.subject_id,name:r.subjects?.name||'—'});});
    subjectBase=[...seen.values()];
  }
  // Also deduplicate examList to prevent duplicate score columns
  const examMap=new Map();
  (examList||[]).forEach(e=>{if(e&&!examMap.has(e.id))examMap.set(e.id,e);});
  const examListDeduped=[...examMap.values()];
  const subRows=subjectBase.sort((a,b)=>a.name.localeCompare(b.name)).map(sub=>{
    const subResults=(results||[]).filter(r=>r.subject_id===sub.id);
    const tw=subResults.reduce((s,r)=>s+(r.exams?.weight||1),0);
    const ws=subResults.reduce((s,r)=>s+(r.score/(r.exams?.max_score||100))*100*(r.exams?.weight||1),0);
    const total=tw>0?Math.round(ws/tw*10)/10:null;
    const g=gradeFromScale(total,_scale||[]);
    return{name:sub.name,rows:subResults,total,grade:g.grade,remark:g.remark};
  });
  const ws2=subRows.filter(s=>s.total!==null);
  const avg=ws2.length?Math.round(ws2.reduce((s,r)=>s+r.total,0)/ws2.length*10)/10:null;
  const raw=results?.reduce((s,r)=>s+(r.score||0),0)??null;
  const og=gradeFromScale(avg,_scale||[]);
  const days=new Set((attData||[]).map(a=>a.date)).size;
  const pres=(attData||[]).filter(a=>a.status==='P'||a.status==='L').length;
  const att=days>0?Math.round(pres/days*100):null;
  const parts=[_school?.affiliation_no?`Affiliation No.: ${_school.affiliation_no}`:null,_school?.phone?`Ph: ${_school.phone}`:null,_school?.email?`Email: ${_school.email}`:null].filter(Boolean);
  const meta=parts.length?parts.join(' &nbsp;|&nbsp; '):[_school?.address,_school?.lga,_school?.state].filter(Boolean).join(', ')||'&nbsp;';
  const sessLabel=(_term?.academic_years?.label||_term?.name)?`Academic Session — ${_term?.academic_years?.label||_term?.name}`:'Academic Session';
  const logoH=_school?.logo_url?`<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=logo-fb>SCHOOL<br>CREST</div>'">`:`<div class="logo-fb">SCHOOL<br>CREST</div>`;
  const pp=student.photo_url||student.passport_url||student.avatar_url||'';
  const sid=student.id.replace(/-/g,'_');
  return{cn,classLabel,examList:examListDeduped,subRows,avg,raw,og,att,meta,sessLabel,logoH,pp,sid,days,pres};
}

// sqSafe alias for backward compat
const sq = (...a) => sqSafe(...a);
async function sqSafe(label, queryPromise, timeoutMs=8000){
  const timer=new Promise((_,rej)=>setTimeout(()=>rej(new Error('Timed out')),timeoutMs));
  try{
    const result=await Promise.race([queryPromise,timer]);
    if(result?.error){ console.warn(`sqSafe "${label}":`,result.error.message); return null; }
    return result?.data!==undefined ? result.data : result;
  }catch(e){
    console.warn(`sqSafe "${label}" failed:`,e.message||e);
    return null;
  }
}

/* ═══ NURSERY CARD BUILDER ═══ */
function buildNurseryCard(student,results,attData,affective){
  const d=prepCardData(student,results,attData,affective);
  const {classLabel,subRows,avg,raw,og,att,meta,sessLabel,pp,sid}=d;
  function gradeToStars(grade){
    const map={'A+':5,'A':5,'B+':4,'B':4,'C+':3,'C':3,'D':2,'F':1,'—':0};
    const n=map[grade]??3;
    return Array.from({length:5},(_,i)=>`<span class="${i<n?'ns-star-fill':'ns-star-empty'}">★</span>`).join('');
  }
  const logoH=_school?.logo_url?`<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=ns-logo-fb>CREST</div>'">`:`<div class="ns-logo-fb">🏫<br>CREST</div>`;
  const eHdrs=d.examList.map(e=>`<th>${e.name}<br><span style="font-weight:600;font-size:8px;opacity:.8">/${e.max_score}</span></th>`).join('');
  const sRows=subRows.map(sub=>{
    const cells=d.examList.map(e=>{const r=sub.rows.find(r=>r.exam_id===e.id);return`<td>${r!==undefined?r.score:'—'}</td>`;}).join('');
    return`<tr><td>${sub.name}</td>${cells}<td><strong style="color:#7d5fff">${sub.total??'—'}</strong></td><td><span class="ns-grade-pill">${sub.grade}</span></td></tr>`;
  }).join('')||`<tr><td colspan="99" style="text-align:center;padding:14px;color:#aaa;font-size:12px">No scores recorded yet 📚</td></tr>`;
  const coF=[['work_education','Work Education 🎨'],['art_education','Arts & Crafts 🖌️'],['physical_education','Physical Education 🏃'],['social_skills','Social Skills 🤝'],['sports','Sports & Play ⚽']];
  const diF=[['punctuality','Punctuality ⏰'],['sincerity','Sincerity 💛'],['conduct','Behaviour & Values 🌟'],['respect','Respectfulness 🙏'],['attitude_teachers','Attitude to Teachers 👩‍🏫'],['attitude_society','Community Spirit 🌍']];
  const skillsHtml=(fields,data)=>fields.map(([k,l])=>{
    const grade=data?.[k]||'—';
    return`<div class="ns-skill-item"><span class="ns-skill-name">${l}</span><span>${gradeToStars(grade)} <span class="ns-grade-pill" style="margin-left:4px">${grade}</span></span></div>`;
  }).join('');
  const scaleRef=(_scale||[]).length?(_scale||[]).map(g=>`<span style="margin:0 5px"><strong>${g.grade}</strong>: ${g.min_score}–${g.max_score}</span>`).join(' | '):'<span>90–100: A+ | 80–89: A | 70–79: B+ | 60–69: B | 50–59: C | 40–49: D | Below 40: F</span>';
  const faceIcon=avg===null?'🙂':avg>=80?'🌟':avg>=60?'😊':avg>=45?'🙂':'💪';
  return`
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
  <div class="ns-info-row"><span class="ns-il">📚 Class</span><span class="ns-iv">${classLabel}</span></div>
  <div class="ns-info-row"><span class="ns-il">🎂 Date of Birth</span><span class="ns-iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
  <div class="ns-info-row"><span class="ns-il">👨 Guardian</span><span class="ns-iv">${student.guardian_name||student.father_name||'—'}</span></div>
  <div class="ns-info-row"><span class="ns-il">📅 Session</span><span class="ns-iv">${(_term?.academic_years?.label||_term?.name)||'—'}</span></div>
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
<div class="ns-skill-grid">${skillsHtml(coF,affective)}</div>
<div class="ns-sec-hdr">🌈 Character & Discipline</div>
<div class="ns-skill-grid">${skillsHtml(diF,affective)}</div>
${affective?.class_teacher_remark?`<div class="ns-remark"><span class="ns-remark-lbl">👩‍🏫 Class Teacher's Remark</span>${affective.class_teacher_remark}</div>`:''}
${affective?.principal_remark?`<div class="ns-remark" style="background:#f0faf4"><span class="ns-remark-lbl" style="color:#1a7a4e">🎓 Head Teacher's Remark</span>${affective.principal_remark}</div>`:''}
<div class="ns-promo">🎉 Promoted to: <strong>${affective?.promoted_to||'_______________________'}</strong></div>
${affective?.next_term_begins?`<div style="padding:4px 14px;font-size:11px;background:#e8f8f2;font-family:'Nunito',sans-serif"><strong>📅 Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>`:''}
<div style="padding:5px 13px;font-size:10px;color:#888;border-top:2px dashed #ffd32a;background:#fffbf0;font-family:sans-serif;text-align:center"><strong style="color:#5a3a6b">Grading Scale:</strong> ${scaleRef}</div>
<div class="ns-sig">
  <div class="ns-sig-bl"><div class="ns-sig-ln">${_school?.class_teacher_signature_url?`<img src="${_school.class_teacher_signature_url}" style="max-height:34px">`:''}</div><div class="ns-sig-la">Class Teacher</div><div class="ns-sig-sl">Signature</div></div>
  <div class="ns-sig-bl"><div class="ns-sig-ln">${_school?.principal_signature_url?`<img src="${_school.principal_signature_url}" style="max-height:34px">`:''}</div><div class="ns-sig-la">Head Teacher / Principal</div><div class="ns-sig-sl">Signature</div></div>
</div>
<div class="ns-rainbow-strip"></div>
<div class="card-stamp" style="font-family:'Nunito',sans-serif">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}

/* ═══ PRIMARY CARD BUILDER ═══ */
function buildPrimaryCard(student,results,attData,affective){
  const d=prepCardData(student,results,attData,affective);
  const {classLabel,subRows,avg,raw,og,att,meta,sessLabel,pp,sid}=d;
  const logoH=_school?.logo_url?`<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=pr-logo-fb>CREST</div>'">`:`<div class="pr-logo-fb">SCHOOL<br>CREST</div>`;
  const eHdrs=d.examList.map(e=>`<th>${e.name}<br><span style="font-weight:500;font-size:7.5px;opacity:.85">/${e.max_score}</span></th>`).join('');
  const sRows=subRows.map(sub=>{
    const cells=d.examList.map(e=>{const r=sub.rows.find(r=>r.exam_id===e.id);return`<td>${r!==undefined?r.score:'—'}</td>`;}).join('');
    return`<tr><td class="sn" style="color:#1a4a32">${sub.name}</td>${cells}<td><strong style="color:#1a7a4e">${sub.total??'—'}</strong></td><td>${gradeBadge(sub.grade)}</td><td style="font-size:10px;color:#555;text-align:left">${sub.remark||'—'}</td></tr>`;
  }).join('')||`<tr><td colspan="99" style="text-align:center;padding:16px;color:#999;font-size:12px">No results recorded for this term.</td></tr>`;
  const coF=[['work_education','Work Education'],['art_education','Art Education'],['physical_education','Health & Physical Ed.'],['social_skills','Social Skills'],['sports','Sports']];
  const diF=[['punctuality','Regularity & Punctuality'],['sincerity','Sincerity'],['conduct','Behaviour & Values'],['respect','Respectfulness'],['attitude_teachers','Attitude to Teachers'],['attitude_society','Attitude to Society']];
  const prActRows=(fields,data)=>fields.map(([k,l])=>`<div class="pr-ar"><span>${l}</span><span class="pr-grade-box">${data?.[k]||''}</span></div>`).join('');
  const scH=(_scale||[]).length
    ?`<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</tr></thead><tbody><tr><td>Marks</td>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr><tr><td>Remark</td>${(_scale||[]).map(g=>`<td style="font-size:8px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    :`<thead><tr><th>91–100</th><th>81–90</th><th>71–80</th><th>61–70</th><th>51–60</th><th>41–50</th><th>32–40</th></tr></thead><tbody><tr><td>A+</td><td>A</td><td>B+</td><td>B</td><td>C+</td><td>C</td><td>D</td></tr></tbody>`;
  return`
<div class="card-wrap pr-card">
<div class="report-card"><div class="deco-border"><div class="card-inner">
<div class="deco-strip"></div>
<div class="pr-header">
  <div class="pr-logo">${logoH}</div>
  <div class="pr-hc">
    <div class="pr-school">${_school?.name||'School Name'}</div>
    <div class="pr-meta">${meta}</div>
    <div class="pr-divider"></div>
    <div class="pr-title">Academic Report Card</div>
    <div class="pr-sess">${sessLabel}</div>
    <div class="pr-class">Term: <span>${(_term?.name)||'—'}</span></div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
    <div class="pr-pp" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp?'':'display:none'}" alt="Student Photo">
      <div class="pr-pp-ph" id="ppPh_${sid}" ${pp?'style="display:none"':''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span style="font-size:8px">Affix<br>Photo</span></div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div style="font-size:8px;color:#b8a090;font-family:sans-serif">Passport</div>
  </div>
</div>
<div class="pr-info">
  <div class="pr-info-row"><span class="pr-il">Name of Student</span><span class="pr-iv">${student.full_name||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Admission No.</span><span class="pr-iv">${student.admission_no||student.roll_no||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Class / Arm</span><span class="pr-iv">${classLabel}</span></div>
  <div class="pr-info-row"><span class="pr-il">Date of Birth</span><span class="pr-iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
  <div class="pr-info-row"><span class="pr-il">Guardian</span><span class="pr-iv">${student.guardian_name||student.father_name||'—'}</span></div>
  <div class="pr-info-row"><span class="pr-il">Academic Session</span><span class="pr-iv">${(_term?.academic_years?.label||_term?.name)||'—'}</span></div>
</div>
<div class="pr-sec-hdr">Scholastic Area — Academic Performance</div>
<div style="overflow-x:auto"><table class="pr-table">
  <thead><tr><th rowspan="2" style="text-align:left;padding-left:10px;min-width:110px">Subjects</th>${eHdrs}<th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:60px">Remark</th></tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="pr-sum">
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#b85c00">Overall Marks</span><span class="pr-sv" style="color:#b85c00">${raw??'—'}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#c87030">Percentage</span><span class="pr-sv" style="color:#c87030">${avg!==null?avg+'%':'—'}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#2d6a9f">Grade</span><span class="pr-sv" style="color:#2d6a9f">${og.grade}</span></div>
  <div class="pr-sum-cell"><span class="pr-sl" style="background:#7c3aed">Attendance</span><span class="pr-sv" style="color:#7c3aed">${att!==null?att+'%':'—'}</span></div>
</div>
<div class="pr-two-col">
  <div class="pr-co-col"><div class="pr-co-h">Co-Scholastic Activities</div><div class="pr-ach"><span>Activity</span><span>Grade</span></div>${prActRows(coF,affective)}</div>
  <div class="pr-di-col"><div class="pr-di-h">Discipline &amp; Values</div><div class="pr-ach"><span>Activity</span><span>Grade</span></div>${prActRows(diF,affective)}</div>
</div>
${affective?.class_teacher_remark?`<div class="rm-row" style="background:#fff8f2"><span class="rm-lbl" style="color:#b85c00">Class Teacher's Remark</span>${affective.class_teacher_remark}</div>`:''}
${affective?.vp_academic_remark?`<div class="rm-row" style="background:#f0f7ff"><span class="rm-lbl" style="color:#2d6a9f">VP Academic's Remark</span>${affective.vp_academic_remark}</div>`:''}
${affective?.exam_officer_remark?`<div class="rm-row" style="background:#faf5ff"><span class="rm-lbl" style="color:#6b21a8">Exam Officer's Remark</span>${affective.exam_officer_remark}</div>`:''}
${affective?.principal_remark?`<div class="rm-row" style="background:#f5f5f0"><span class="rm-lbl" style="color:#3d3d00">Principal's Remark</span>${affective.principal_remark}</div>`:''}
<div class="pr-promo">Promoted to Class — <span>${affective?.promoted_to||'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins?`<div style="padding:4px 14px;font-size:11px;border-top:1px solid #f0e0d0;background:#fffaf6;font-family:'EB Garamond',Georgia,serif"><strong>Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>`:''}
<div class="gs-wrap" style="border-top-color:#f0e0d0;background:#fff8f2">
  <div class="gs-title" style="color:#b85c00">Grading Scale for Scholastic Areas</div>
  <table class="gs">${scH}</table>
</div>
<div class="pr-sig">
  ${sigHTML('Class Teacher',_school?.class_teacher_signature_url)}
  ${sigHTML('VP Academic',_school?.vp_signature_url)}
  ${sigHTML('Exam Officer',_school?.exam_officer_signature_url)}
  ${sigHTML('Principal',_school?.principal_signature_url)}
</div>
<div class="deco-strip"></div>
<div class="card-stamp">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}


/* ═══ VOCATIONAL CARD BUILDER ═══ */
function buildVocationalCard(student, results, attData, affective) {
  const d = prepCardData(student, results, attData, affective);
  const {classLabel, subRows, avg, raw, og, att, meta, sessLabel, logoH, pp, sid} = d;
  const eHdrs = d.examList.map(e =>
    `<th>${e.name}<br><span style="font-weight:400;font-size:7.5px">/${e.max_score}</span></th>`
  ).join('');
  const sRows = subRows.map(sub => {
    const cells = d.examList.map(e => {
      const r = sub.rows.find(r => r.exam_id === e.id);
      return `<td>${r !== undefined ? r.score : '—'}</td>`;
    }).join('');
    return `<tr><td class="vc-sn">${sub.name}</td>${cells}
      <td><strong style="color:#c25000">${sub.total ?? '—'}</strong></td>
      <td><span class="vc-grade">${sub.grade}</span></td>
      <td style="font-size:10px;color:#555;text-align:left">${sub.remark || '—'}</td></tr>`;
  }).join('') || `<tr><td colspan="99" style="text-align:center;padding:16px;color:#999;font-size:12px">No results recorded for this term.</td></tr>`;
  const coF = [['work_education','Practical Work'],['art_education','Technical Drawing'],
    ['physical_education','Workshop Safety'],['social_skills','Team Collaboration'],['sports','Industry Practice']];
  const diF = [['punctuality','Punctuality & Attendance'],['sincerity','Work Ethics'],
    ['conduct','Conduct & Discipline'],['respect','Respect for Tools & Rules'],
    ['attitude_teachers','Relationship with Instructors'],['attitude_society','Industry Readiness']];
  const prActRows = (fields, data) => fields.map(([k,l]) =>
    `<div class="vc-ar"><span>${l}</span><span class="vc-grade-box">${data?.[k] || ''}</span></div>`
  ).join('');
  const scH = (_scale||[]).length
    ? `<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</tr></thead>
       <tbody><tr><td>Marks</td>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr>
       <tr><td>Remark</td>${(_scale||[]).map(g=>`<td style="font-size:8px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    : `<thead><tr><th>91–100</th><th>81–90</th><th>71–80</th><th>61–70</th><th>50–60</th><th>40–49</th></tr></thead>
       <tbody><tr><td>Distinction</td><td>Merit</td><td>Credit</td><td>Pass</td><td>Marginal</td><td>Fail</td></tr></tbody>`;
  return `
<div class="card-wrap vc-card">
<div class="report-card"><div class="vc-outer"><div class="vc-inner">
<div class="vc-top-bar"></div>
<div class="vc-header">
  <div class="vc-logo">${logoH}</div>
  <div class="vc-hc">
    <div class="vc-school">${_school?.name || 'Institution Name'}</div>
    <div class="vc-meta">${meta}</div>
    <div class="vc-rule"></div>
    <div class="vc-badge">STUDENT PERFORMANCE RECORD</div>
    <div class="vc-sess">${sessLabel} &nbsp;|&nbsp; Term: ${_term?.name || '—'}</div>
  </div>
  <div class="vc-pp-wrap">
    <div class="vc-pp" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp ? '' : 'display:none'}" alt="Photo">
      <div class="vc-pp-ph" id="ppPh_${sid}" ${pp ? 'style="display:none"' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span style="font-size:8px">Photo</span></div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div style="font-size:8px;color:#aaa;margin-top:3px;text-align:center">Passport</div>
  </div>
</div>
<div class="vc-info">
  <div class="vc-info-row"><span class="vc-il">Student Name</span><span class="vc-iv">${student.full_name || '—'}</span></div>
  <div class="vc-info-row"><span class="vc-il">Admission No.</span><span class="vc-iv">${student.admission_no || student.roll_no || '—'}</span></div>
  <div class="vc-info-row"><span class="vc-il">Programme / Class</span><span class="vc-iv">${classLabel}</span></div>
  <div class="vc-info-row"><span class="vc-il">Date of Birth</span><span class="vc-iv">${fmtDate(student.dob || student.date_of_birth)}</span></div>
  <div class="vc-info-row"><span class="vc-il">Guardian / Sponsor</span><span class="vc-iv">${student.guardian_name || student.father_name || '—'}</span></div>
  <div class="vc-info-row"><span class="vc-il">Academic Session</span><span class="vc-iv">${(_term?.academic_years?.label || _term?.name) || '—'}</span></div>
</div>
<div class="vc-sec-hdr"><span>▶</span> Academic &amp; Technical Performance</div>
<div style="overflow-x:auto"><table class="vc-table">
  <thead><tr>
    <th rowspan="2" style="text-align:left;padding-left:10px;min-width:120px">Subject / Unit</th>
    ${eHdrs}
    <th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:60px">Remark</th>
  </tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="vc-sum">
  <div class="vc-sum-cell"><div class="vc-sum-lbl">TOTAL MARKS</div><div class="vc-sum-val" style="color:#c25000">${raw ?? '—'}</div></div>
  <div class="vc-sum-cell"><div class="vc-sum-lbl">AVERAGE</div><div class="vc-sum-val" style="color:#b87800">${avg !== null ? avg + '%' : '—'}</div></div>
  <div class="vc-sum-cell"><div class="vc-sum-lbl">GRADE</div><div class="vc-sum-val" style="color:#1a5c9e">${og.grade}</div></div>
  <div class="vc-sum-cell"><div class="vc-sum-lbl">ATTENDANCE</div><div class="vc-sum-val" style="color:#166534">${att !== null ? att + '%' : '—'}</div></div>
</div>
<div class="vc-two-col">
  <div class="vc-co-col">
    <div class="vc-col-hdr">Practical &amp; Skill Assessment</div>
    <div class="vc-col-sub"><span>Area</span><span>Rating</span></div>
    ${prActRows(coF, affective)}
  </div>
  <div class="vc-di-col">
    <div class="vc-col-hdr">Work Ethics &amp; Conduct</div>
    <div class="vc-col-sub"><span>Area</span><span>Rating</span></div>
    ${prActRows(diF, affective)}
  </div>
</div>
${affective?.class_teacher_remark ? `<div class="vc-remark"><span class="vc-remark-lbl">Instructor's Remark</span>${affective.class_teacher_remark}</div>` : ''}
${affective?.vp_academic_remark ? `<div class="vc-remark" style="background:#f0f7ff"><span class="vc-remark-lbl" style="color:#1a5c9e">HOD / VP Remark</span>${affective.vp_academic_remark}</div>` : ''}
${affective?.principal_remark ? `<div class="vc-remark" style="background:#f5f5f0"><span class="vc-remark-lbl" style="color:#3d3a00">Principal / Director Remark</span>${affective.principal_remark}</div>` : ''}
<div class="vc-promo">Promoted / Progressed to: <span>${affective?.promoted_to || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins ? `<div class="vc-next"><strong>Next Term / Semester Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>` : ''}
<div class="gs-wrap" style="background:#f8f6f0;border-top-color:#e8d8c0">
  <div class="gs-title" style="color:#8b4500">Grading Scale</div>
  <table class="gs">${scH}</table>
</div>
<div class="vc-sig">
  ${sigHTML('Class Instructor', _school?.class_teacher_signature_url)}
  ${sigHTML('H.O.D / VP Academic', _school?.vp_signature_url)}
  ${sigHTML('Exam Officer', _school?.exam_officer_signature_url)}
  ${sigHTML('Principal / Director', _school?.principal_signature_url)}
</div>
<div class="vc-top-bar"></div>
<div class="card-stamp">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}


/* ═══ TERTIARY CARD BUILDER ═══ */
function buildTertiaryCard(student, results, attData, affective) {
  const d = prepCardData(student, results, attData, affective);
  const {classLabel, subRows, avg, raw, og, att, meta, sessLabel, logoH, pp, sid} = d;
  const eHdrs = d.examList.map(e =>
    `<th>${e.name}<br><span style="font-weight:400;font-size:7.5px">/${e.max_score}</span></th>`
  ).join('');
  const sRows = subRows.map(sub => {
    const cells = d.examList.map(e => {
      const r = sub.rows.find(r => r.exam_id === e.id);
      return `<td>${r !== undefined ? r.score : '—'}</td>`;
    }).join('');
    return `<tr><td class="tc-sn">${sub.name}</td>${cells}
      <td><strong style="color:#2c3e6e">${sub.total ?? '—'}</strong></td>
      <td><span class="tc-grade">${sub.grade}</span></td>
      <td style="font-size:10px;color:#555;text-align:left">${sub.remark || '—'}</td></tr>`;
  }).join('') || `<tr><td colspan="99" style="text-align:center;padding:16px;color:#999;font-size:12px">No results recorded for this semester.</td></tr>`;
  const coF = [['work_education','Research & Project Work'],['art_education','Seminar Participation'],
    ['physical_education','Laboratory/Practical Skills'],['social_skills','Group Assignments'],['sports','Field Work / Internship']];
  const diF = [['punctuality','Attendance & Punctuality'],['sincerity','Academic Integrity'],
    ['conduct','Campus Conduct'],['respect','Respect for Regulations'],
    ['attitude_teachers','Relationship with Faculty'],['attitude_society','Community Engagement']];
  const prActRows = (fields, data) => fields.map(([k,l]) =>
    `<div class="tc-ar"><span>${l}</span><span class="tc-grade-box">${data?.[k] || ''}</span></div>`
  ).join('');
  const scH = (_scale||[]).length
    ? `<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</tr></thead>
       <tbody><tr><td>Marks</td>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr>
       <tr><td>Remark</td>${(_scale||[]).map(g=>`<td style="font-size:8px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    : `<thead><tr><th>70–100</th><th>60–69</th><th>50–59</th><th>45–49</th><th>40–44</th><th>0–39</th></tr></thead>
       <tbody><tr><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td></tr></tbody>`;
  return `
<div class="card-wrap tc-card">
<div class="report-card"><div class="tc-outer"><div class="tc-inner">
<div class="tc-crest-band">
  <div class="tc-crest-left"></div>
  <div class="tc-crest-center">
    <div class="tc-logo">${logoH}</div>
  </div>
  <div class="tc-crest-right"></div>
</div>
<div class="tc-school-block">
  <div class="tc-school">${_school?.name || 'Institution Name'}</div>
  <div class="tc-meta">${meta}</div>
  <div class="tc-rule"></div>
  <div class="tc-doc-title">OFFICIAL ACADEMIC TRANSCRIPT</div>
  <div class="tc-sess">${sessLabel}</div>
</div>
<div class="tc-student-block">
  <div class="tc-pp-wrap">
    <div class="tc-pp" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp ? '' : 'display:none'}" alt="Photo">
      <div class="tc-pp-ph" id="ppPh_${sid}" ${pp ? 'style="display:none"' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span style="font-size:8px">Photo</span></div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div style="font-size:8px;color:#aaa;text-align:center;margin-top:3px">Passport</div>
  </div>
  <div class="tc-details">
    <div class="tc-detail-row"><span class="tc-dl">Student Name</span><span class="tc-dv">${student.full_name || '—'}</span></div>
    <div class="tc-detail-row"><span class="tc-dl">Matric / Adm. No.</span><span class="tc-dv">${student.admission_no || student.roll_no || '—'}</span></div>
    <div class="tc-detail-row"><span class="tc-dl">Department / Class</span><span class="tc-dv">${classLabel}</span></div>
    <div class="tc-detail-row"><span class="tc-dl">Date of Birth</span><span class="tc-dv">${fmtDate(student.dob || student.date_of_birth)}</span></div>
    <div class="tc-detail-row"><span class="tc-dl">Sponsor / Guardian</span><span class="tc-dv">${student.guardian_name || student.father_name || '—'}</span></div>
    <div class="tc-detail-row"><span class="tc-dl">Academic Session</span><span class="tc-dv">${(_term?.academic_years?.label || _term?.name) || '—'}</span></div>
  </div>
</div>
<div class="tc-sec-hdr">ACADEMIC PERFORMANCE — COURSE RESULTS</div>
<div style="overflow-x:auto"><table class="tc-table">
  <thead><tr>
    <th rowspan="2" style="text-align:left;padding-left:12px;min-width:130px">Course / Subject</th>
    ${eHdrs}
    <th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:65px">Remark</th>
  </tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="tc-gpa-band">
  <div class="tc-gpa-cell"><div class="tc-gpa-lbl">TOTAL SCORE</div><div class="tc-gpa-val">${raw ?? '—'}</div></div>
  <div class="tc-gpa-cell"><div class="tc-gpa-lbl">AVERAGE (%)</div><div class="tc-gpa-val">${avg !== null ? avg + '%' : '—'}</div></div>
  <div class="tc-gpa-cell tc-gpa-highlight"><div class="tc-gpa-lbl">OVERALL GRADE</div><div class="tc-gpa-val" style="font-size:26px">${og.grade}</div></div>
  <div class="tc-gpa-cell"><div class="tc-gpa-lbl">ATTENDANCE</div><div class="tc-gpa-val">${att !== null ? att + '%' : '—'}</div></div>
</div>
<div class="tc-two-col">
  <div class="tc-co-col">
    <div class="tc-col-hdr">Academic Activities</div>
    <div class="tc-col-sub"><span>Activity</span><span>Rating</span></div>
    ${prActRows(coF, affective)}
  </div>
  <div class="tc-di-col">
    <div class="tc-col-hdr">Conduct &amp; Character</div>
    <div class="tc-col-sub"><span>Activity</span><span>Rating</span></div>
    ${prActRows(diF, affective)}
  </div>
</div>
${affective?.class_teacher_remark ? `<div class="tc-remark"><span class="tc-remark-lbl">Class Adviser's Remark</span>${affective.class_teacher_remark}</div>` : ''}
${affective?.vp_academic_remark ? `<div class="tc-remark"><span class="tc-remark-lbl">Dean / HOD Remark</span>${affective.vp_academic_remark}</div>` : ''}
${affective?.exam_officer_remark ? `<div class="tc-remark"><span class="tc-remark-lbl">Examination Officer</span>${affective.exam_officer_remark}</div>` : ''}
${affective?.principal_remark ? `<div class="tc-remark"><span class="tc-remark-lbl">Registrar / Principal Remark</span>${affective.principal_remark}</div>` : ''}
<div class="tc-promo">Progressed / Promoted to: <span>${affective?.promoted_to || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins ? `<div class="tc-next"><strong>Next Semester / Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>` : ''}
<div class="gs-wrap" style="background:#f5f7fc;border-top-color:#cfd8f0">
  <div class="gs-title" style="color:#1a2e6e">Grading Scale</div>
  <table class="gs">${scH}</table>
</div>
<div class="tc-sig">
  ${sigHTML('Class Adviser', _school?.class_teacher_signature_url)}
  ${sigHTML('Dean / HOD', _school?.vp_signature_url)}
  ${sigHTML('Exam Officer', _school?.exam_officer_signature_url)}
  ${sigHTML('Registrar / Principal', _school?.principal_signature_url)}
</div>
<div class="tc-foot-rule"></div>
<div class="card-stamp">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}


/* ═══ BUILD ONE CARD — routes to section-specific builder ═══ */
async function buildCard(student, termId, extraClass=''){
  let studentResults = [];
  
  if(_bulkResults !== null){
    studentResults = _bulkResults.filter(r => r.student_id === student.id);
  } else {
    const {data: checkResults, count} = await db.from('results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .eq('term_id', termId);
    
    if(!count || count === 0){
      return null;
    }
    
    studentResults = await sqSafe(`Results for ${student.full_name||student.id}`,
      db.from('results')
        .select('score,student_id,subject_id,exam_id,subjects(id,name,code),exams(id,name,max_score,weight)')
        .eq('student_id', student.id).eq('term_id', termId));
  }

  if(!studentResults || studentResults.length === 0){
    return null;
  }

  let attData, affective;

  if(_bulkAtt !== null && _bulkAffective !== null){
    attData   = _bulkAtt.filter(a => a.student_id === student.id);
    affective = _bulkAffective.find(a => a.student_id === student.id) || null;
  } else {
    [attData, affective] = await Promise.all([
      sq(`Attendance for ${student.full_name||student.id}`,
         db.from('attendance')
           .select('status,date,student_id').eq('student_id',student.id).eq('term_id',termId)),
      sq(`Affective domain for ${student.full_name||student.id}`,
         db.from('affective_domain')
           .select('*').eq('student_id',student.id).eq('term_id',termId).maybeSingle()),
    ]);
  }

  const cn=_classRow?.name||'—';
  const sec=(_classRow?.section||_classRow?.level||'').toUpperCase();
  const classLabel=sec?`${cn} — Section ${sec}`:cn;

  const examList=_exams?.length
    ?_exams
    :[...new Map((studentResults||[]).map(r=>[r.exam_id,r.exams])).values()].filter(Boolean);

  let subjectBase;
  if(_classSubjects?.length){
    subjectBase=_classSubjects.map(cs=>({id:cs.subject_id,name:cs.subjects?.name||cs.subject_name||'—'}));
  } else {
    const seen=new Map();
    (studentResults||[]).forEach(r=>{if(!seen.has(r.subject_id))seen.set(r.subject_id,{id:r.subject_id,name:r.subjects?.name||'—'});});
    subjectBase=[...seen.values()];
  }
  
  const subRows=subjectBase.sort((a,b)=>a.name.localeCompare(b.name)).map(sub=>{
    const subResults=(studentResults||[]).filter(r=>r.subject_id===sub.id);
    const tw=subResults.reduce((s,r)=>s+(r.exams?.weight||1),0);
    const ws=subResults.reduce((s,r)=>s+(r.score/(r.exams?.max_score||100))*100*(r.exams?.weight||1),0);
    const total=tw>0?Math.round(ws/tw*10)/10:null;
    const g=gradeFromScale(total,_scale||[]);
    return{name:sub.name,rows:subResults,total,grade:g.grade,remark:g.remark};
  });

  const ws2=subRows.filter(s=>s.total!==null);
  const avg=ws2.length?Math.round(ws2.reduce((s,r)=>s+r.total,0)/ws2.length*10)/10:null;
  const raw=studentResults?.reduce((s,r)=>s+(r.score||0),0)??null;
  const og=gradeFromScale(avg,_scale||[]);
  const days=new Set((attData||[]).map(a=>a.date)).size;
  const pres=(attData||[]).filter(a=>a.status==='P'||a.status==='L').length;
  const att=days>0?Math.round(pres/days*100):null;

  const parts=[
    _school?.affiliation_no?`Affiliation No.: ${_school.affiliation_no}`:null,
    _school?.phone?`Ph: ${_school.phone}`:null,
    _school?.email?`Email: ${_school.email}`:null,
  ].filter(Boolean);
  const meta=parts.length?parts.join(' &nbsp;|&nbsp; '):
    [_school?.address,_school?.lga,_school?.state].filter(Boolean).join(', ')||'&nbsp;';
  const sessLabel=(_term?.academic_years?.label||_term?.name)
    ?`Academic Session — ${_term?.academic_years?.label||_term?.name}`:'Academic Session';

  const logoH=_school?.logo_url
    ?`<img src="${_school.logo_url}" alt="Logo" onerror="this.outerHTML='<div class=logo-fb>SCHOOL<br>CREST</div>'">`
    :`<div class="logo-fb">SCHOOL<br>CREST</div>`;

  const pp=student.photo_url||student.passport_url||student.avatar_url||'';

  const eHdrs=examList.map(e=>
    `<th>${e.name}<br><span style="font-weight:400;font-size:7.5px">/${e.max_score}</span></th>`
  ).join('');
  
  const sRows=subRows.map(sub=>{
    const cells=examList.map(e=>{
      const r=sub.rows.find(r=>r.exam_id===e.id);
      return`<td>${r!==undefined?r.score:'—'}</td>`;
    }).join('');
    return`<tr><td class="sn">${sub.name}</td>${cells}
      <td><strong style="color:var(--primary)">${sub.total??'—'}</strong></td>
      <td>${gradeBadge(sub.grade)}</td>
      <td style="font-size:10px;color:#555;text-align:left">${sub.remark||'—'}</td></tr>`;
  }).join('')||`<tr><td colspan="99" style="text-align:center;padding:18px;color:#999;font-family:sans-serif;font-size:12px">No results recorded for this term.</td></tr>`;

  const coF=[['work_education','Work Education'],['art_education','Art Education'],
    ['physical_education','Health &amp; Physical Education'],['social_skills','Social Skills'],['sports','Sports']];
  const diF=[['punctuality','Regularity &amp; Punctuality'],['sincerity','Sincerity'],
    ['conduct','Behaviour &amp; Values'],['respect','Respectfulness for Rules &amp; Reg.'],
    ['attitude_teachers','Attitude Towards Teachers'],['attitude_society','Attitude Towards Society']];

  const scH=(_scale||[]).length
    ?`<thead><tr><th>Grade</th>${(_scale||[]).map(g=>`<th>${g.grade}</th>`).join('')}</thead>
      <tbody><tr><th>Marks</th>${(_scale||[]).map(g=>`<td>${g.min_score}–${g.max_score}</td>`).join('')}</tr>
      <tr><th>Remark</th>${(_scale||[]).map(g=>`<td style="font-size:8.5px">${g.remark||'—'}</td>`).join('')}</tr></tbody>`
    :`<thead><tr><th>91–100</th><th>81–90</th><th>71–80</th><th>61–70</th><th>51–60</th><th>41–50</th><th>32–40</th></thead>
     <tbody><tr><td>A+</td><td>A</td><td>B+</td><td>B</td><td>C+</td><td>C</td><td>D</td></tr></tbody>`;

  const sid=student.id.replace(/-/g,'_');

  // Deduplicate exams — prevents duplicate score columns
  const examDeduped = [];
  const examSeen = new Set();
  (_exams || []).forEach(e => { if (e && !examSeen.has(e.id)) { examSeen.add(e.id); examDeduped.push(e); } });
  if (examDeduped.length) _exams = examDeduped;

  // Deduplicate class subjects — prevents duplicate subject rows
  if (_classSubjects?.length) {
    const csSeen = new Map();
    _classSubjects.forEach(cs => {
      if (!csSeen.has(cs.subject_id)) csSeen.set(cs.subject_id, cs);
    });
    _classSubjects = [...csSeen.values()];
  }

  // Also deduplicate studentResults per (subject_id, exam_id) pair
  const resultKey = r => `${r.subject_id}||${r.exam_id}`;
  const resultSeen = new Set();
  studentResults = studentResults.filter(r => {
    const k = resultKey(r);
    if (resultSeen.has(k)) return false;
    resultSeen.add(k);
    return true;
  });

  // Store current student for certificate/testimonial generation
  _currentStudent={student,results:studentResults,attData,affective};

  // Route to section-specific card builder — driven by institution theme engine
  const sType = getCardTheme(_classRow);
  if(sType==='nursery')    return buildNurseryCard(student,studentResults,attData,affective);
  if(sType==='primary')    return buildPrimaryCard(student,studentResults,attData,affective);
  if(sType==='vocational') return buildVocationalCard(student,studentResults,attData,affective);
  if(sType==='tertiary')   return buildTertiaryCard(student,studentResults,attData,affective);
  // 'secondary' is the default

  return`
<div class="card-wrap ${extraClass}">
<div class="report-card"><div class="deco-border"><div class="card-inner">
<div class="deco-strip"></div>
<div class="rc-header">
  <div class="logo-circle">${logoH}</div>
  <div class="hc">
    <div class="school-name">${_school?.name||'School Name'}</div>
    <div class="school-meta">${meta}</div>
    <div class="gold-div"></div>
    <div class="card-title">Student Academic Report</div>
    <div class="sess-txt">${sessLabel}</div>
    <div class="sess-txt" style="font-size:10px;color:#777;font-weight:400;font-style:italic;margin-top:1px">Term: ${_term?.name||'—'}</div>
  </div>
  <div class="pp-box">
    <div class="pp-frame" onclick="document.getElementById('ppInput_${sid}').click()">
      <img id="ppImg_${sid}" src="${pp}" style="${pp?'':'display:none'}" alt="Student Photo">
      <div class="pp-ph" id="ppPh_${sid}" ${pp?'style="display:none"':''}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <span style="font-size:8px">Affix<br>Photo</span>
      </div>
    </div>
    <input type="file" id="ppInput_${sid}" accept="image/*" onchange="loadPP(event,'${sid}')" style="display:none">
    <div class="pp-lbl">Passport Size</div>
  </div>
</div>
<div class="info-strip">
  <div class="info-row"><span class="il">Name of Student</span><span class="iv">${student.full_name||'—'}</span></div>
  <div class="info-row"><span class="il">Admission No.</span><span class="iv">${student.admission_no||student.roll_no||'—'}</span></div>
  <div class="info-row"><span class="il">Class / Arm</span><span class="iv">${classLabel}</span></div>
  <div class="info-row"><span class="il">Date of Birth</span><span class="iv">${fmtDate(student.dob||student.date_of_birth)}</span></div>
  <div class="info-row"><span class="il">Guardian</span><span class="iv">${student.guardian_name||student.father_name||'—'}</span></div>
  <div class="info-row"><span class="il">Academic Session</span><span class="iv">${(_term?.academic_years?.label||_term?.name)||'—'}</span></div>
</div>
<div class="sec-hdr">Scholastic Area — Academic Performance</div>
<div class="aw"><table class="ac">
  <thead><tr><th rowspan="2" style="text-align:left;padding-left:10px;min-width:110px">Subjects</th>${eHdrs}<th rowspan="2">Total</th><th rowspan="2">Grade</th><th rowspan="2" style="min-width:60px">Remark</th></tr><tr></tr></thead>
  <tbody>${sRows}</tbody>
</table></div>
<div class="sum-band">
  <div class="sum-cell"><span class="sl c1">Overall Marks</span><span class="sv" style="color:var(--primary)">${raw??'—'}</span></div>
  <div class="sum-cell"><span class="sl c2">Percentage</span><span class="sv" style="color:var(--accent)">${avg!==null?avg+'%':'—'}</span></div>
  <div class="sum-cell"><span class="sl c3">Grade</span><span class="sv" style="color:#16a34a">${og.grade}</span></div>
  <div class="sum-cell"><span class="sl c4">Attendance</span><span class="sv" style="color:#7c3aed">${att!==null?att+'%':'—'}</span></div>
</div>
<div class="two-col">
  <div class="co-col"><div class="co-h">Co-Scholastic Activities</div><div class="ach"><span>Activity</span><span>Grade</span></div>${actRows(coF,affective)}</div>
  <div class="di-col"><div class="di-h">Discipline &amp; Character</div><div class="ach"><span>Activity</span><span>Grade</span></div>${actRows(diF,affective)}</div>
</div>
${rmHTML("Class Teacher's Remark",affective?.class_teacher_remark,'#f8faff','var(--primary)')}
${rmHTML("VP Academic's Remark", affective?.vp_academic_remark, '#eff6ff','#1e40af')}
${rmHTML("Exam Officer's Remark", affective?.exam_officer_remark, '#faf5ff','#6b21a8')}
${rmHTML("Principal's Remark", affective?.principal_remark, '#f0fdf4','#166534')}
<div class="promo-band">Promoted to Class &mdash; <span>${affective?.promoted_to||'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span></div>
${affective?.next_term_begins?`<div class="nt-row"><strong>Next Term Begins:</strong> ${fmtDate(affective.next_term_begins)}</div>`:''}
<div class="gs-wrap"><div class="gs-title">Grading Scale for Scholastic Areas</div><table class="gs">${scH}</table></div>
<div class="sig-ft">
  ${sigHTML('Class Teacher', _school?.class_teacher_signature_url)}
  ${sigHTML('VP Academic', _school?.vp_signature_url)}
  ${sigHTML('Exam Officer', _school?.exam_officer_signature_url)}
  ${sigHTML('Principal', _school?.principal_signature_url)}
</div>
<div class="deco-strip"></div>
<div class="card-stamp">Generated by EduTrack NG &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div></div></div></div>`;
}

function showNoReportCard(student){
  document.getElementById('mainContent').innerHTML = `
    <div class="no-report-card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
      <h3>📄 No Results Found</h3>
      <p><strong>${student.full_name || 'This student'}</strong> has no scores recorded for the selected term.</p>
      <p>Please ensure that subject scores have been entered for this student in the <strong>Results</strong> section before generating a report card.</p>
      <button onclick="(typeof _loadCard === 'function') && _loadCard(${JSON.stringify(student).replace(/</g,'\u003c')})">↺ Retry</button>
      <button onclick="history.back()">← Go Back</button>
    </div>
  `;
}

function loadPP(e,sid){
  const file=e.target.files[0];if(!file)return;
  const rd=new FileReader();
  rd.onload=ev=>{
    const img=document.getElementById('ppImg_'+sid);
    const ph =document.getElementById('ppPh_'+sid);
    if(img){img.src=ev.target.result;img.style.display='block';}
    if(ph) ph.style.display='none';
  };
  rd.readAsDataURL(file);
}
