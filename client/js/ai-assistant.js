// ============================================================
//  EduTrack NG — Built-in AI Assistant
//  Drop ONE line anywhere before </body>:
//  <script src="/js/assistant.js"></script>
//  Works on all pages — admin, staff, student, parent, login, landing
// ============================================================

(function () {
  'use strict';

  // ── Knowledge Base ──────────────────────────────────────────
  const KB = {
    // FAQ & general answers
    faq: [
      { q: ['reset password', 'forgot password', 'change password', 'cant login', "can't login"],
        a: 'To reset your password, click <b>"Forgot Password"</b> on the login page and enter your email. A reset link will be sent to you. If you are an admin resetting a staff password, go to <b>Admin → People & Students → Staff Directory → Reset PW</b>.' },
      { q: ['register school', 'add school', 'new school', 'sign up'],
        a: 'To register a new school, click <b>"Register"</b> on the login page and fill in your school details. After registration you will receive a confirmation email.' },
      { q: ['add student', 'enrol student', 'new student', 'register student'],
        a: 'Go to <b>Admin → People & Students → All Students → + Add Student</b>. Fill in the student\'s name, admission number, date of birth, class and guardian details.' },
      { q: ['add staff', 'new staff', 'create staff', 'add teacher'],
        a: 'Go to <b>Admin → People & Students → Staff Directory → + Add Staff</b>. Fill in their name, role, email and a temporary password. They will use the email and password to log in.' },
      { q: ['take attendance', 'mark attendance', 'attendance'],
        a: 'For <b>Staff</b>: Go to your Dashboard → click <b>Attendance</b> on any class card, or use the sidebar Attendance link.\n\nFor <b>Admin</b>: Go to <b>Academics → Attendance</b> to view all records.' },
      { q: ['enter score', 'add score', 'result', 'score entry', 'grades'],
        a: 'Teachers go to <b>Dashboard → Score Entry</b> on any class card. Admins can view all results under <b>Academics → Results</b>.' },
      { q: ['add class', 'create class', 'new class'],
        a: 'Go to <b>Admin → Academics → Classes → + Add Class</b>. Set the class name, level and assign a form teacher.' },
      { q: ['assign subject', 'class subject', 'subject assignment'],
        a: 'Go to <b>Admin → Academics → Class Subjects</b> to assign subjects to classes and link them to teachers.' },
      { q: ['timetable', 'schedule', 'period'],
        a: 'Admins can build the timetable under <b>Academics → Timetable Builder</b>. Staff and students can view their own timetable from their portal sidebar.' },
      { q: ['fees', 'payment', 'invoice', 'billing', 'pay'],
        a: 'Fee management is under <b>Admin → Finance → Fee Management</b>. You can create fee structures, record payments and generate invoices from there.' },
      { q: ['scratch card', 'result checker', 'pin'],
        a: 'Scratch cards for result checking are managed under <b>Admin → Finance → Scratch Cards</b>. Generate and assign cards to students there.' },
      { q: ['notification', 'announcement', 'message', 'send message'],
        a: 'Go to <b>Admin → Communications → Announcements</b> to send notifications to staff, students or parents. You can target by class, role or individual.' },
      { q: ['student portal', 'student login', 'student access'],
        a: 'Students log in using their <b>Admission Number</b> and <b>Date of Birth</b> at the login page. Select <b>"Student"</b> tab, pick your school, enter details and click Verify Identity.' },
      { q: ['parent portal', 'parent login', 'guardian'],
        a: 'Parents access the portal using the link provided by the school. They log in with their registered phone number or email to view their child\'s performance.' },
      { q: ['id card', 'identity card'],
        a: 'Staff ID cards can be printed from <b>Staff Portal → ID Card</b>. Admin can access all staff ID cards under <b>Staff Office → Staff ID Cards</b>.' },
      { q: ['lesson note', 'lesson plan', 'ai lesson'],
        a: 'Teachers can generate AI-powered lesson notes under <b>E-Learning → Lesson Note AI</b> in the admin or staff portal.' },
      { q: ['biometric', 'fingerprint', 'check in'],
        a: 'Biometric attendance check-in is available under <b>Staff Portal → Biometric Attendance</b>. Admins can monitor it under <b>Staff Office → Biometric Check-In</b>.' },
      { q: ['term', 'session', 'academic year'],
        a: 'Manage academic terms and sessions under <b>Admin → Operations → Terms & Sessions</b>. Set the current term to activate it across the portal.' },
      { q: ['deactivate user', 'disable account', 'suspend'],
        a: 'Go to <b>Admin → People & Students → All Users</b> and click <b>Deactivate</b> next to the user. Deactivated users cannot log in.' },
      { q: ['impersonate', 'view as staff', 'staff portal', 'staff activities'],
        a: 'Admins can access any staff portal under <b>Staff Activities</b> in the sidebar. Click the portal, select a staff member from the list, and you will be redirected to their dashboard.' },
      { q: ['contact support', 'help', 'support', 'problem', 'issue', 'bug'],
        a: 'For technical support, contact your platform administrator or reach out via the <b>Communications</b> section. You can also check this assistant for common questions.' },
    ],

    // Page-specific tips keyed by URL path segment
    pageTips: {
      'login':          '💡 <b>Tip:</b> Use the <b>Student</b> tab if you are a student logging in with Admission Number + Date of Birth.',
      'index':          '💡 <b>Tip:</b> Your dashboard shows live data for the current term. Check the <b>Key Metrics</b> section for a quick school overview.',
      'students':       '💡 <b>Tip:</b> Use the search bar to quickly find a student. Click their name to view full profile, results and attendance history.',
      'staff':          '💡 <b>Tip:</b> Click <b>Edit</b> to update staff details, assign subjects or change their role. Use <b>Reset PW</b> to help a staff member log in.',
      'classes':        '💡 <b>Tip:</b> Assign a <b>Form Teacher</b> to each class so the teacher can take attendance and view class students from their portal.',
      'attendance':     '💡 <b>Tip:</b> Attendance must be taken per class, per day. Use the filter to view records by date, class or teacher.',
      'results':        '💡 <b>Tip:</b> Results are calculated automatically from scores entered by teachers. Ensure all subjects have scores before publishing.',
      'fees':           '💡 <b>Tip:</b> Create a fee structure first, then assign it to students. You can record partial payments and track balances.',
      'timetable':      '💡 <b>Tip:</b> The Timetable Builder lets you drag-and-drop periods. Publish the timetable for staff and students to view.',
      'notifications':  '💡 <b>Tip:</b> You can filter notifications by type — Results, Fees, Attendance, Urgent and Announcements.',
      'score-entry':    '💡 <b>Tip:</b> Enter CA scores and exam scores separately. The system calculates the total automatically based on your school\'s grading scale.',
      'lesson-notes':   '💡 <b>Tip:</b> Provide the subject, topic and class level to generate a detailed lesson note. You can edit and download it as a Word document.',
      'profile':        '💡 <b>Tip:</b> Keep your profile up to date. You can change your password and notification preferences here.',
    },

    // Guided tours per page
    tours: {
      'index-admin': [
        { title: 'Welcome to your Dashboard', body: 'This is your school command centre. The <b>Key Metrics</b> section shows live student, attendance, fee and staff data.' },
        { title: 'Navigation Sidebar', body: 'Use the sidebar on the left to navigate between sections — People, Academics, Finance, Communications and more.' },
        { title: 'Staff Activities', body: 'The <b>Staff Activities</b> group lets you access any staff member\'s portal directly — useful when staff need assistance.' },
        { title: 'Announcements', body: 'Send school-wide or targeted announcements from <b>Communications → Announcements</b>.' },
      ],
      'students': [
        { title: 'Student List', body: 'All enrolled students are listed here. Use the search to find by name, admission number or class.' },
        { title: 'Add a Student', body: 'Click <b>+ Add Student</b> at the top right to enrol a new student. Fill in all required fields including admission number and date of birth.' },
        { title: 'Student Actions', body: 'Click a student\'s name to view their full profile. Use the action buttons to edit, deactivate or reset their access.' },
      ],
      'attendance': [
        { title: 'Taking Attendance', body: 'Select the <b>class</b> and <b>date</b>, then mark each student as Present, Absent or Late.' },
        { title: 'Attendance Records', body: 'Past records are saved automatically. Use the filters to view by class, date range or individual student.' },
      ],
    },

    // Quick navigation links
    navLinks: [
      { label: 'Dashboard',          url: '/admin/index.html',              roles: ['admin'] },
      { label: 'All Students',       url: '/admin/students.html',           roles: ['admin'] },
      { label: 'Staff Directory',    url: '/admin/staff.html',              roles: ['admin'] },
      { label: 'Classes',            url: '/admin/classes.html',            roles: ['admin'] },
      { label: 'Attendance',         url: '/admin/attendance.html',         roles: ['admin'] },
      { label: 'Results',            url: '/admin/results.html',            roles: ['admin'] },
      { label: 'Fee Management',     url: '/admin/fees.html',               roles: ['admin'] },
      { label: 'Announcements',      url: '/admin/announcements.html',      roles: ['admin'] },
      { label: 'Timetable Builder',  url: '/admin/timetable-builder.html',  roles: ['admin'] },
      { label: 'Teacher Dashboard',  url: '/portals/staff/index.html',      roles: ['teacher'] },
      { label: 'Score Entry',        url: '/portals/staff/score-entry.html',roles: ['teacher'] },
      { label: 'My Timetable',       url: '/portals/staff/timetable.html',  roles: ['teacher','admin'] },
      { label: 'Student Portal',     url: '/portals/student/index.html',    roles: ['student'] },
      { label: 'My Results',         url: '/portals/student/results.html',  roles: ['student'] },
      { label: 'Login Page',         url: '/login.html',                    roles: ['*'] },
    ],

    // Keyboard shortcuts
    shortcuts: [
      { keys: '? or H',   desc: 'Open/close this assistant' },
      { keys: 'Esc',      desc: 'Close assistant' },
      { keys: 'Alt + D',  desc: 'Go to Dashboard' },
      { keys: 'Alt + S',  desc: 'Go to Students (admin)' },
      { keys: 'Alt + A',  desc: 'Go to Attendance' },
      { keys: 'Alt + R',  desc: 'Go to Results' },
      { keys: 'Alt + N',  desc: 'Go to Notifications' },
    ],
  };

  // ── State ───────────────────────────────────────────────────
  let isOpen = false;
  let currentView = 'home'; // home | search | tour | shortcuts | faq
  let tourStep = 0;
  let tourItems = [];
  let searchTimeout = null;

  // ── Detect current page context ─────────────────────────────
  function getPageKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html','') || 'index';
    const isAdmin = path.includes('/admin/');
    return isAdmin ? file + '-admin' : file;
  }

  function getPageTip() {
    const file = window.location.pathname.split('/').pop().replace('.html','') || 'index';
    return KB.pageTips[file] || null;
  }

  // ── Fuzzy answer search ─────────────────────────────────────
  function findAnswer(query) {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    for (const item of KB.faq) {
      if (item.q.some(kw => q.includes(kw) || kw.includes(q))) {
        return item.a;
      }
    }
    // Fallback: word-by-word partial match
    const words = q.split(/\s+/).filter(w => w.length > 3);
    for (const item of KB.faq) {
      if (words.some(w => item.q.some(kw => kw.includes(w)))) {
        return item.a;
      }
    }
    return null;
  }

  function searchNav(query) {
    const q = query.toLowerCase();
    return KB.navLinks.filter(n =>
      n.label.toLowerCase().includes(q) || n.url.includes(q)
    ).slice(0, 5);
  }

  // ── Build UI ────────────────────────────────────────────────
  function buildAssistant() {
    const css = `
      #et-asst-btn {
        position:fixed; bottom:24px; right:24px; z-index:10000;
        width:52px; height:52px; border-radius:50%;
        background:linear-gradient(135deg,#0a6e3f,#0d8f52);
        color:#fff; border:none; cursor:pointer;
        box-shadow:0 4px 20px rgba(10,110,63,0.45);
        display:flex; align-items:center; justify-content:center;
        transition:transform .2s, box-shadow .2s;
        font-size:22px;
      }
      #et-asst-btn:hover { transform:scale(1.1); box-shadow:0 6px 28px rgba(10,110,63,0.55); }
      #et-asst-btn .et-asst-badge {
        position:absolute; top:-3px; right:-3px;
        width:18px; height:18px; border-radius:50%;
        background:#f59e0b; color:#1a1a2e;
        font-size:10px; font-weight:800;
        display:flex; align-items:center; justify-content:center;
        border:2px solid #fff;
      }
      #et-asst-panel {
        position:fixed; bottom:88px; right:24px; z-index:10000;
        width:360px; max-height:560px;
        background:#fff; border-radius:20px;
        box-shadow:0 12px 48px rgba(0,0,0,0.18);
        display:flex; flex-direction:column;
        font-family:inherit; overflow:hidden;
        transform:scale(0.92) translateY(16px);
        opacity:0; pointer-events:none;
        transition:transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
      }
      #et-asst-panel.open {
        transform:scale(1) translateY(0);
        opacity:1; pointer-events:all;
      }
      .et-asst-header {
        background:linear-gradient(135deg,#0a6e3f,#0d8f52);
        color:#fff; padding:16px 18px 14px;
        display:flex; align-items:center; gap:10px;
      }
      .et-asst-avatar {
        width:36px; height:36px; border-radius:50%;
        background:rgba(255,255,255,0.2);
        display:flex; align-items:center; justify-content:center;
        font-size:18px; flex-shrink:0;
      }
      .et-asst-header-text { flex:1; }
      .et-asst-header-text strong { display:block; font-size:14px; font-weight:700; }
      .et-asst-header-text span { font-size:11px; opacity:.75; }
      .et-asst-close {
        background:none; border:none; color:#fff; cursor:pointer;
        font-size:20px; opacity:.7; padding:0; line-height:1;
      }
      .et-asst-close:hover { opacity:1; }
      .et-asst-body { flex:1; overflow-y:auto; padding:14px; }
      .et-asst-search {
        padding:10px 14px; border-bottom:1px solid #f0f0f0;
      }
      .et-asst-search input {
        width:100%; padding:9px 12px; border:1.5px solid #e5e7eb;
        border-radius:10px; font-size:13px; outline:none;
        box-sizing:border-box; transition:border .2s;
      }
      .et-asst-search input:focus { border-color:#0a6e3f; }
      .et-asst-chip-row {
        display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;
      }
      .et-asst-chip {
        padding:5px 12px; border-radius:100px;
        background:#f3f4f6; color:#374151;
        font-size:12px; font-weight:600; cursor:pointer;
        border:none; transition:background .15s, color .15s;
      }
      .et-asst-chip:hover, .et-asst-chip.active {
        background:#0a6e3f; color:#fff;
      }
      .et-asst-tip {
        background:#f0fdf4; border:1px solid #bbf7d0;
        border-radius:10px; padding:10px 12px;
        font-size:12.5px; color:#166534; margin-bottom:12px;
        line-height:1.5;
      }
      .et-asst-section-title {
        font-size:11px; font-weight:700; text-transform:uppercase;
        letter-spacing:.06em; color:#9ca3af; margin:10px 0 6px;
      }
      .et-asst-item {
        display:flex; align-items:center; gap:10px;
        padding:9px 10px; border-radius:10px; cursor:pointer;
        font-size:13px; color:#111827; transition:background .15s;
        text-decoration:none;
      }
      .et-asst-item:hover { background:#f3f4f6; }
      .et-asst-item-icon {
        width:28px; height:28px; border-radius:8px;
        background:#f3f4f6; display:flex; align-items:center;
        justify-content:center; font-size:14px; flex-shrink:0;
      }
      .et-asst-answer {
        background:#f9fafb; border-radius:12px;
        padding:12px 14px; font-size:13px; color:#111827;
        line-height:1.6; margin-bottom:10px;
      }
      .et-asst-answer a { color:#0a6e3f; }
      .et-asst-back {
        display:inline-flex; align-items:center; gap:4px;
        font-size:12px; color:#6b7280; cursor:pointer;
        background:none; border:none; padding:0; margin-bottom:10px;
      }
      .et-asst-back:hover { color:#0a6e3f; }
      .et-asst-tour-card {
        background:linear-gradient(135deg,#f0fdf4,#dcfce7);
        border:1px solid #bbf7d0; border-radius:14px;
        padding:16px; margin-bottom:12px;
      }
      .et-asst-tour-card h4 { margin:0 0 6px; font-size:14px; color:#166534; }
      .et-asst-tour-card p { margin:0; font-size:13px; color:#166534; line-height:1.5; }
      .et-asst-tour-nav {
        display:flex; align-items:center; justify-content:space-between;
        margin-top:10px;
      }
      .et-asst-tour-nav button {
        padding:6px 14px; border-radius:8px; border:none;
        font-size:12px; font-weight:700; cursor:pointer;
        background:#0a6e3f; color:#fff;
      }
      .et-asst-tour-nav button:disabled {
        background:#e5e7eb; color:#9ca3af; cursor:default;
      }
      .et-asst-tour-dots { display:flex; gap:4px; }
      .et-asst-tour-dot {
        width:6px; height:6px; border-radius:50%; background:#d1d5db;
      }
      .et-asst-tour-dot.active { background:#0a6e3f; }
      .et-asst-shortcut-row {
        display:flex; align-items:center; justify-content:space-between;
        padding:7px 0; border-bottom:1px solid #f3f4f6; font-size:13px;
      }
      .et-asst-shortcut-row:last-child { border:none; }
      .et-asst-kbd {
        background:#f3f4f6; border:1px solid #e5e7eb;
        border-radius:6px; padding:2px 8px;
        font-size:11px; font-weight:700; font-family:monospace; color:#374151;
      }
      .et-asst-no-result { text-align:center; padding:28px 12px; color:#9ca3af; font-size:13px; }
      @media(max-width:420px) {
        #et-asst-panel { width:calc(100vw - 24px); right:12px; bottom:80px; }
        #et-asst-btn { right:12px; bottom:12px; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Floating button
    const btn = document.createElement('button');
    btn.id = 'et-asst-btn';
    btn.title = 'AI Assistant (press ? for help)';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div class="et-asst-badge">?</div>`;
    btn.onclick = toggleAssistant;

    // Panel
    const panel = document.createElement('div');
    panel.id = 'et-asst-panel';
    panel.innerHTML = `
      <div class="et-asst-header">
        <div class="et-asst-avatar">🎓</div>
        <div class="et-asst-header-text">
          <strong>AI Assistant</strong>
          <span>EduTrack NG · Always here to help</span>
        </div>
        <button class="et-asst-close" onclick="window.__etAsst.close()" title="Close">×</button>
      </div>
      <div class="et-asst-search">
        <input type="text" id="et-asst-input" placeholder="Ask me anything or search pages…" autocomplete="off">
      </div>
      <div class="et-asst-body" id="et-asst-body"></div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Search input handler
    document.getElementById('et-asst-input').addEventListener('input', function () {
      clearTimeout(searchTimeout);
      const val = this.value.trim();
      if (!val) { renderHome(); return; }
      searchTimeout = setTimeout(() => renderSearchResults(val), 280);
    });

    document.getElementById('et-asst-input').addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeAssistant();
    });

    renderHome();
  }

  // ── Views ───────────────────────────────────────────────────
  function renderHome() {
    currentView = 'home';
    const tip = getPageTip();
    const pageKey = getPageKey();
    const hasTour = !!KB.tours[pageKey];

    const body = document.getElementById('et-asst-body');
    body.innerHTML = `
      ${tip ? `<div class="et-asst-tip">${tip}</div>` : ''}
      <div class="et-asst-chip-row">
        ${hasTour ? `<button class="et-asst-chip" onclick="window.__etAsst.startTour()">📍 Page Tour</button>` : ''}
        <button class="et-asst-chip" onclick="window.__etAsst.showFAQ()">❓ FAQ</button>
        <button class="et-asst-chip" onclick="window.__etAsst.showShortcuts()">⌨️ Shortcuts</button>
        <button class="et-asst-chip" onclick="window.__etAsst.showNav()">🔗 Navigate</button>
      </div>
      <div class="et-asst-section-title">Common Questions</div>
      ${KB.faq.slice(0, 5).map(item => `
        <div class="et-asst-item" onclick="window.__etAsst.showAnswer('${encodeURIComponent(item.q[0])}')">
          <div class="et-asst-item-icon">💬</div>
          <span>${capitalise(item.q[0])}</span>
        </div>
      `).join('')}
    `;
  }

  function renderSearchResults(query) {
    currentView = 'search';
    const answer = findAnswer(query);
    const navResults = searchNav(query);
    const body = document.getElementById('et-asst-body');

    let html = `<button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>`;

    if (answer) {
      html += `<div class="et-asst-section-title">Answer</div>
               <div class="et-asst-answer">${answer}</div>`;
    }

    if (navResults.length) {
      html += `<div class="et-asst-section-title">Go to Page</div>`;
      navResults.forEach(n => {
        html += `<a class="et-asst-item" href="${n.url}">
          <div class="et-asst-item-icon">📄</div>
          <span>${n.label}</span>
        </a>`;
      });
    }

    if (!answer && !navResults.length) {
      html += `<div class="et-asst-no-result">
        <div style="font-size:32px;margin-bottom:8px;">🤔</div>
        No results for <b>"${query}"</b>.<br>Try different keywords or browse the FAQ.
        <div style="margin-top:12px;">
          <button class="et-asst-chip" onclick="window.__etAsst.showFAQ()">Browse FAQ</button>
        </div>
      </div>`;
    }

    body.innerHTML = html;
  }

  function showAnswer(encodedKey) {
    const key = decodeURIComponent(encodedKey);
    const item = KB.faq.find(f => f.q[0] === key);
    if (!item) return;
    const body = document.getElementById('et-asst-body');
    body.innerHTML = `
      <button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="et-asst-section-title">${capitalise(key)}</div>
      <div class="et-asst-answer">${item.a}</div>
    `;
  }

  function showFAQ() {
    currentView = 'faq';
    const body = document.getElementById('et-asst-body');
    body.innerHTML = `
      <button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="et-asst-section-title">Frequently Asked Questions</div>
      ${KB.faq.map(item => `
        <div class="et-asst-item" onclick="window.__etAsst.showAnswer('${encodeURIComponent(item.q[0])}')">
          <div class="et-asst-item-icon">💬</div>
          <span>${capitalise(item.q[0])}</span>
        </div>
      `).join('')}
    `;
  }

  function showShortcuts() {
    currentView = 'shortcuts';
    const body = document.getElementById('et-asst-body');
    body.innerHTML = `
      <button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="et-asst-section-title">Keyboard Shortcuts</div>
      ${KB.shortcuts.map(s => `
        <div class="et-asst-shortcut-row">
          <span>${s.desc}</span>
          <span class="et-asst-kbd">${s.keys}</span>
        </div>
      `).join('')}
    `;
  }

  function showNav() {
    currentView = 'nav';
    const body = document.getElementById('et-asst-body');
    body.innerHTML = `
      <button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="et-asst-section-title">Quick Navigate</div>
      ${KB.navLinks.map(n => `
        <a class="et-asst-item" href="${n.url}">
          <div class="et-asst-item-icon">📄</div>
          <span>${n.label}</span>
        </a>
      `).join('')}
    `;
  }

  function startTour() {
    const pageKey = getPageKey();
    tourItems = KB.tours[pageKey] || [];
    if (!tourItems.length) return;
    tourStep = 0;
    renderTourStep();
  }

  function renderTourStep() {
    currentView = 'tour';
    const step = tourItems[tourStep];
    const body = document.getElementById('et-asst-body');
    const dots = tourItems.map((_, i) =>
      `<div class="et-asst-tour-dot${i === tourStep ? ' active' : ''}"></div>`
    ).join('');

    body.innerHTML = `
      <button class="et-asst-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="et-asst-section-title">Page Tour · Step ${tourStep + 1} of ${tourItems.length}</div>
      <div class="et-asst-tour-card">
        <h4>${step.title}</h4>
        <p>${step.body}</p>
      </div>
      <div class="et-asst-tour-nav">
        <button ${tourStep === 0 ? 'disabled' : ''} onclick="window.__etAsst.tourPrev()">← Prev</button>
        <div class="et-asst-tour-dots">${dots}</div>
        ${tourStep < tourItems.length - 1
          ? `<button onclick="window.__etAsst.tourNext()">Next →</button>`
          : `<button onclick="window.__etAsst.home()" style="background:#166534;">✓ Done</button>`
        }
      </div>
    `;
  }

  // ── Toggle ──────────────────────────────────────────────────
  function toggleAssistant() {
    isOpen ? closeAssistant() : openAssistant();
  }

  function openAssistant() {
    isOpen = true;
    document.getElementById('et-asst-panel').classList.add('open');
    setTimeout(() => document.getElementById('et-asst-input')?.focus(), 250);
  }

  function closeAssistant() {
    isOpen = false;
    document.getElementById('et-asst-panel').classList.remove('open');
  }

  // ── Keyboard shortcuts ──────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    const tag = document.activeElement.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === 'Escape') { closeAssistant(); return; }
    if (!typing && (e.key === '?' || e.key === 'h' || e.key === 'H')) { toggleAssistant(); return; }

    if (e.altKey) {
      const path = window.location.pathname;
      const base = path.includes('/admin/') ? '/admin/' :
                   path.includes('/portals/staff/') ? '/portals/staff/' :
                   path.includes('/portals/student/') ? '/portals/student/' : '/';
      if (e.key === 'd') { e.preventDefault(); window.location.href = base + 'index.html'; }
      if (e.key === 's') { e.preventDefault(); window.location.href = '/admin/students.html'; }
      if (e.key === 'a') { e.preventDefault(); window.location.href = base + 'attendance.html'; }
      if (e.key === 'r') { e.preventDefault(); window.location.href = base + 'results.html'; }
      if (e.key === 'n') { e.preventDefault(); window.location.href = base + 'notifications.html'; }
    }
  });

  // ── Helpers ─────────────────────────────────────────────────
  function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Public API ──────────────────────────────────────────────
  window.__etAsst = {
    open: openAssistant,
    close: closeAssistant,
    toggle: toggleAssistant,
    home: () => { document.getElementById('et-asst-input').value = ''; renderHome(); },
    showFAQ,
    showShortcuts,
    showNav,
    startTour,
    tourNext: () => { if (tourStep < tourItems.length - 1) { tourStep++; renderTourStep(); } },
    tourPrev: () => { if (tourStep > 0) { tourStep--; renderTourStep(); } },
    showAnswer,
  };

  // ── Init ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildAssistant);
  } else {
    buildAssistant();
  }

})();
