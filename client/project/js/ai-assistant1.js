// ============================================================
//  EduTrack NG — Built-in AI Assistant (Role-Aware)
//  Add before </body>: <script src="/js/assistant.js"></script>
// ============================================================

(function () {
  'use strict';

  // ── Role Detection ──────────────────────────────────────────
  function detectRole() {
    const path = window.location.pathname;
    if (path.includes('/admin/') || path.includes('saas-console')) return 'admin';
    if (path.includes('/portals/staff/') || path.includes('/portals/academic-office/')) return 'teacher';
    if (path.includes('/portals/bursary/')) return 'bursar';
    if (path.includes('/portals/admin-office/')) return 'vp_admin';
    if (path.includes('/portals/student/')) return 'student';
    if (path.includes('/portals/parent/')) return 'parent';
    return 'guest'; // login, landing pages
  }

  function getRoleName(role) {
    return { admin:'Admin', teacher:'Staff / Teacher', bursar:'Bursary Officer',
      vp_admin:'VP Admin', student:'Student', parent:'Parent', guest:'Guest' }[role] || 'User';
  }

  function getRoleEmoji(role) {
    return { admin:'🏫', teacher:'📚', bursar:'💰', vp_admin:'📋',
      student:'🎒', parent:'👨‍👩‍👧', guest:'👋' }[role] || '👋';
  }

  // ── Role-Based Knowledge Base ───────────────────────────────
  const KB = {

    admin: {
      greeting: "Hey there! 👋 I'm your EduTrack assistant. As an Admin, you have full control over everything in the school portal. What would you like help with today?",
      tips: {
        'index':            '💡 Your dashboard shows live school metrics. Scroll down for attendance trends and gender distribution charts!',
        'students':         '💡 You can bulk-import students using the CSV upload option. Also try clicking a student\'s name to see their full profile.',
        'staff':            '💡 After adding staff, remember to assign their subjects and classes so they can access the right data in their portals.',
        'classes':          '💡 Assign a Form Teacher to each class — that teacher will be responsible for attendance and can see the class roster.',
        'attendance':       '💡 You can view attendance records for any class or teacher. Use the date filter to spot patterns over time.',
        'results':          '💡 Results are auto-calculated from scores entered by teachers. Make sure all subjects have scores before publishing term results.',
        'fees':             '💡 Create fee structures first, then assign them to students or classes. You can record partial payments too!',
        'announcements':    '💡 You can target announcements to specific roles (staff only, students only) or broadcast to everyone at once.',
        'timetable-builder':'💡 Build the timetable term by term. Once published, staff and students can view their personal timetable in their portals.',
        'staff':            '💡 Use the Reset PW button to help staff who can\'t log in. You can also generate a temporary password instantly.',
      },
      faq: [
        { q: ['add student','enrol student','new student','register student'],
          a: "Sure! To add a student, go to <b>People & Students → All Students</b> and click <b>+ Add Student</b>. You'll fill in their name, admission number, date of birth, class and guardian details. Easy!" },
        { q: ['add staff','new staff','create staff','add teacher'],
          a: "To add a new staff member, go to <b>People & Students → Staff Directory → + Add Staff</b>. Set their role (Teacher, VP, Bursar etc.), email and a temporary password. They'll log in with that email and change their password later." },
        { q: ['reset password','reset staff password','staff cant login'],
          a: "No worries! Go to <b>People & Students → Staff Directory</b>, find the staff member, and click <b>Reset PW</b>. You can either send them a reset email or generate a temporary password to share directly." },
        { q: ['add class','create class','new class'],
          a: "Head to <b>Academics → Classes → + Add Class</b>. Give the class a name and level, then assign a Form Teacher. That teacher will handle attendance for that class." },
        { q: ['assign subject','class subject','subject assignment','assign teacher'],
          a: "Go to <b>Academics → Class Subjects</b> to assign subjects to classes and link them to specific teachers. Teachers will only see subjects assigned to them in their portal." },
        { q: ['timetable','schedule','period','build timetable'],
          a: "The <b>Timetable Builder</b> is under <b>Academics → Timetable Builder</b>. You build it per term, assign periods to subjects and teachers, then publish so everyone can see it." },
        { q: ['fees','payment','invoice','billing','pay','fee structure'],
          a: "Fee management is under <b>Finance → Fee Management</b>. First create a fee structure (e.g. tuition, uniform), then assign it to students or classes. You can track payments and outstanding balances there." },
        { q: ['scratch card','result checker','pin','generate card'],
          a: "Scratch cards are under <b>Finance → Scratch Cards</b>. Generate cards, assign them to students, and they'll use the PIN to check their results online." },
        { q: ['announcement','send message','notify','broadcast'],
          a: "Go to <b>Communications → Announcements</b> to send messages. You can target by role (staff, students, parents) or a specific class. Recipients see it in their notification bell! 🔔" },
        { q: ['impersonate','access staff portal','view as staff','staff activities'],
          a: "In the sidebar under <b>Staff Activities</b>, click any role portal (e.g. Teacher Portal), pick a staff member from the list, and you'll see exactly what they see in their dashboard. Super handy!" },
        { q: ['attendance','view attendance','monitor attendance'],
          a: "Go to <b>Academics → Attendance</b> to see all attendance records. You can filter by class, teacher or date. The dashboard also shows today's attendance summary." },
        { q: ['results','publish results','view results'],
          a: "Results are under <b>Academics → Results</b>. Once teachers enter all scores, you can review and publish them. Students will then be able to view them in their portal." },
        { q: ['deactivate','disable account','suspend user'],
          a: "Find the user under <b>People & Students → All Users</b> and click <b>Deactivate</b>. Deactivated accounts can't log in until you reactivate them." },
        { q: ['term','session','academic year','current term'],
          a: "Manage terms under <b>Operations → Terms & Sessions</b>. Set a term as 'current' to activate it — this affects attendance, results and fee records across the portal." },
        { q: ['id card','print id','staff id'],
          a: "Staff ID cards can be printed from <b>Staff Office → Staff ID Cards</b>. You can preview and download them for printing." },
        { q: ['lesson note','lesson plan','ai lesson'],
          a: "The AI Lesson Note generator is under <b>E-Learning → Lesson Note AI</b>. Enter the subject, topic and class level to generate a detailed lesson plan instantly! ✨" },
      ],
      tours: {
        'index-admin': [
          { title: 'Welcome, Admin! 🏫', body: 'This is your school command centre. Everything you need to manage your school is right here.' },
          { title: 'Key Metrics', body: 'The cards at the top show live data — total students, today\'s attendance, fees collected and staff count. These update in real time!' },
          { title: 'Analytics Charts', body: 'Scroll down to see enrolment trends, gender distribution and more. Great for reports and school planning.' },
          { title: 'Sidebar Navigation', body: 'Use the sidebar to jump between sections. Each section is grouped by function — People, Academics, Finance, Communications and more.' },
          { title: 'Staff Activities', body: 'The <b>Staff Activities</b> group is unique to you as Admin. Click any role to access that staff member\'s portal and work on their behalf. Handy! 👍' },
        ],
        'students': [
          { title: 'Student Management 👨‍🎓', body: 'This is where all enrolled students live. You can search, filter by class, view profiles and manage student accounts.' },
          { title: 'Adding a Student', body: 'Click <b>+ Add Student</b> to enrol someone new. You\'ll need their name, admission number, date of birth, class and guardian info.' },
          { title: 'Student Actions', body: 'Click a student\'s name to open their full profile — results, attendance history, fees and contact details are all there.' },
        ],
        'staff': [
          { title: 'Staff Directory 👩‍🏫', body: 'All your school\'s staff members are listed here with their roles and contact details.' },
          { title: 'Adding Staff', body: 'Click <b>+ Add Staff</b>. Assign them a role (Teacher, VP, Bursar etc.), set a temporary password, and they\'re ready to log in.' },
          { title: 'Assigning Subjects', body: 'After adding staff, head to <b>Academics → Class Subjects</b> to assign them subjects and classes. This links them to the right data.' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',          url: '/admin/index.html' },
        { label: '👨‍🎓 All Students',       url: '/admin/students.html' },
        { label: '👩‍🏫 Staff Directory',    url: '/admin/staff.html' },
        { label: '🏫 Classes',            url: '/admin/classes.html' },
        { label: '📋 Class Subjects',     url: '/admin/class-subjects.html' },
        { label: '✅ Attendance',          url: '/admin/attendance.html' },
        { label: '📊 Results',            url: '/admin/results.html' },
        { label: '💰 Fee Management',     url: '/admin/fees.html' },
        { label: '📣 Announcements',      url: '/admin/announcements.html' },
        { label: '🗓️ Timetable Builder',  url: '/admin/timetable-builder.html' },
        { label: '🪪 Staff ID Cards',     url: '/portals/staff/id-card.html' },
        { label: '✨ Lesson Note AI',     url: '/admin/lesson-notes.html' },
      ],
    },

    teacher: {
      greeting: "Hi there! 👋 I'm your EduTrack assistant. I'm here to help you navigate your teacher portal and make your day a little easier. What do you need help with?",
      tips: {
        'index':        '💡 Your dashboard shows the classes and subjects assigned to you this term. Attendance buttons are right on each class card!',
        'attendance':   '💡 Select the class and date, then tap each student to mark them Present, Absent or Late. Saves automatically!',
        'score-entry':  '💡 Enter CA and Exam scores separately — the system calculates totals automatically based on your school\'s grading scale.',
        'students':     '💡 You can only see students in your assigned classes. Click a student to view their attendance and performance history.',
        'timetable':    '💡 Your personal timetable shows only your assigned periods. Contact admin if something looks wrong.',
        'notifications':'💡 Check here regularly for messages from admin, results updates and important school announcements.',
      },
      faq: [
        { q: ['take attendance','mark attendance','attendance'],
          a: "Head to your <b>Dashboard</b> and click the <b>Attendance</b> button on any class card. Select the date, mark each student, and hit Save. Done! ✅" },
        { q: ['enter score','add score','score entry','grades','result'],
          a: "From your Dashboard, click <b>Score Entry</b> on a class card. Enter the CA score and Exam score for each student — totals are calculated automatically. 📊" },
        { q: ['view students','my students','class list'],
          a: "Click <b>Students</b> on any class card on your Dashboard, or use the sidebar. You'll see all students in your assigned classes." },
        { q: ['timetable','my schedule','my periods'],
          a: "Your personal timetable is in the sidebar under <b>Timetable</b>. It shows only your assigned periods for the current term." },
        { q: ['lesson note','lesson plan','generate lesson'],
          a: "Go to <b>E-Learning → Lesson Note AI</b>. Enter your subject, topic and class — the AI will generate a full lesson plan for you! ✨" },
        { q: ['notification','announcement','message'],
          a: "Check the <b>Notifications</b> bell in your sidebar. You'll see messages from admin and important school updates there." },
        { q: ['id card','my id','identity card'],
          a: "Your staff ID card is under <b>Staff Info → ID Card</b> in the sidebar. You can preview and download it for printing." },
        { q: ['daily activity','activity log','report'],
          a: "Log your daily activities under <b>Daily Activity Logs</b> in the sidebar. This helps admin track what's happening in each class." },
        { q: ['biometric','check in','attendance machine'],
          a: "Biometric check-in is under <b>Biometric Attendance</b> in the sidebar. Use it to clock in at the start of your work day." },
        { q: ['cant see class','no class assigned','missing class'],
          a: "If your classes aren't showing, it means admin hasn't assigned you yet. Ask your admin to go to <b>Classes → Edit</b> and set you as Form Teacher, or assign subjects via <b>Class Subjects</b>." },
      ],
      tours: {
        'index': [
          { title: 'Your Teacher Dashboard 📚', body: 'Welcome! This shows all your assigned classes and subjects for the current term. Everything you need is just a click away.' },
          { title: 'Class Cards', body: 'Each card represents one of your classes. You\'ll see the subjects you teach there, and quick buttons for Attendance, Scores and Students.' },
          { title: 'Attendance Status', body: 'Cards with a green border means attendance is already taken today. Yellow means it\'s still pending — don\'t forget! ⏳' },
          { title: 'Quick Actions', body: 'The buttons at the bottom let you jump directly to Attendance, Score Entry, Students and your Timetable.' },
        ],
        'attendance': [
          { title: 'Taking Attendance ✅', body: 'Select the class and date at the top, then mark each student as Present (P), Absent (A) or Late (L).' },
          { title: 'Saving', body: 'Records save automatically as you mark. You can also edit previous records by selecting a past date.' },
        ],
        'score-entry': [
          { title: 'Score Entry 📊', body: 'Select the class and subject, then enter CA and Exam scores for each student.' },
          { title: 'Auto Calculation', body: 'Total scores, grades and remarks are calculated automatically based on your school\'s grading scale. No maths needed! 😄' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',        url: '/portals/staff/index.html' },
        { label: '✅ Attendance',        url: '/portals/staff/attendance.html' },
        { label: '📊 Score Entry',      url: '/portals/staff/score-entry.html' },
        { label: '👨‍🎓 My Students',     url: '/portals/staff/students.html' },
        { label: '🗓️ My Timetable',     url: '/portals/staff/timetable.html' },
        { label: '🔔 Notifications',    url: '/portals/staff/notifications.html' },
        { label: '✨ Lesson Note AI',   url: '/portals/staff/lesson-notes.html' },
        { label: '🪪 My ID Card',       url: '/portals/staff/id-card.html' },
        { label: '📝 Activity Logs',    url: '/portals/staff/daily-activities.html' },
      ],
    },

    bursar: {
      greeting: "Hi! 👋 I'm your EduTrack assistant. I'll help you navigate the Bursary portal and manage all fee-related activities. What do you need?",
      tips: {
        'index':    '💡 Your dashboard shows fee collection summaries for the current term. Use the sidebar to manage payments and generate receipts.',
        'fees':     '💡 You can record full or partial payments. Outstanding balances are tracked automatically.',
      },
      faq: [
        { q: ['record payment','add payment','collect fee','fee payment'],
          a: "Go to <b>Fee Management</b> in the sidebar. Search for the student, select the fee type, enter the amount paid and save. A receipt is generated automatically! 🧾" },
        { q: ['outstanding','balance','who owes','unpaid'],
          a: "The <b>Fee Management</b> page shows outstanding balances for each student. You can filter by class or fee type to see who still owes." },
        { q: ['invoice','receipt','proof of payment'],
          a: "After recording a payment, you can print or download the receipt directly from the payment record. Look for the printer icon! 🖨️" },
        { q: ['fee structure','create fee','new fee'],
          a: "Fee structures are created by the Admin. If you need a new fee type added, ask your admin to go to <b>Finance → Fee Management → Fee Structures</b>." },
        { q: ['scratch card','result pin','card'],
          a: "Scratch cards for result checking are managed under <b>Scratch Cards</b> in the sidebar. You can generate and assign them to students." },
        { q: ['report','fee report','collection summary'],
          a: "Fee collection reports are available on your dashboard and in the <b>Fee Management</b> section. You can filter by term, class or date range." },
      ],
      tours: {
        'index': [
          { title: 'Bursary Dashboard 💰', body: 'This shows your fee collection summary for the current term — total collected, outstanding balances and recent transactions.' },
          { title: 'Quick Navigation', body: 'Use the sidebar to jump to Fee Management, Scratch Cards and reports.' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',      url: '/portals/bursary/index.html' },
        { label: '💰 Fee Management', url: '/portals/bursary/fees.html' },
        { label: '🎫 Scratch Cards',  url: '/portals/bursary/scratch-cards.html' },
        { label: '🔔 Notifications',  url: '/portals/bursary/notifications.html' },
      ],
    },

    vp_admin: {
      greeting: "Hello! 👋 I'm your EduTrack assistant. As VP Admin, I'll help you manage staff records, operations and day-to-day administrative tasks. What can I help with?",
      tips: {
        'index':      '💡 Your dashboard gives you an overview of staff activities and school operations for the current term.',
        'staff':      '💡 You can view and manage staff records. Coordinate with the Admin if you need to add or deactivate accounts.',
        'attendance': '💡 Monitor staff attendance from the Staff Attendance section in your sidebar.',
      },
      faq: [
        { q: ['staff attendance','monitor attendance','who is present'],
          a: "Go to <b>Staff Attendance</b> in the sidebar to see which staff members are present, absent or late today." },
        { q: ['daily activity','activity log','staff report'],
          a: "Check <b>Daily Activity Logs</b> in the sidebar to see what staff have logged for the day. Great for monitoring productivity!" },
        { q: ['notification','announcement','message'],
          a: "Check the <b>Notifications</b> section in the sidebar for messages from the school admin." },
      ],
      tours: {
        'index': [
          { title: 'VP Admin Dashboard 📋', body: 'Welcome! You can monitor staff activities, manage operations and coordinate with the school admin from here.' },
          { title: 'Sidebar Navigation', body: 'Use the sidebar to access Staff Attendance, Activity Logs, Timetables and more.' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',       url: '/portals/admin-office/index.html' },
        { label: '👩‍🏫 Staff Directory', url: '/portals/admin-office/staff.html' },
        { label: '✅ Staff Attendance', url: '/portals/staff/attendance.html' },
        { label: '📝 Activity Logs',   url: '/portals/staff/daily-activities.html' },
        { label: '🔔 Notifications',   url: '/portals/admin-office/notifications.html' },
      ],
    },

    student: {
      greeting: "Hey! 👋 Welcome to your EduTrack student portal. I'm here to help you find your results, check your timetable and navigate your portal with ease. What do you need? 🎒",
      tips: {
        'index':        '💡 Your dashboard shows your current term\'s attendance and recent results. Check your notifications for important updates!',
        'results':      '💡 Your results show CA scores, Exam scores and total for each subject. Grades are calculated automatically.',
        'attendance':   '💡 Your attendance record shows every school day. A high attendance rate is important — aim for 90% and above! 🌟',
        'notifications':'💡 Check here for result updates, fee reminders and announcements from your school.',
        'profile':      '💡 Keep your profile up to date. If your details look wrong, ask your class teacher or admin to correct them.',
        'fees':         '💡 This shows your fee status for the current term. Contact the bursary if you have questions about your balance.',
      },
      faq: [
        { q: ['view result','check result','my result','my grades','score'],
          a: "Your results are in the <b>Results</b> section of the sidebar. You\'ll see your scores per subject, your total and your grade for the current term. 📊" },
        { q: ['check attendance','my attendance','absent','present'],
          a: "Go to <b>Attendance</b> in the sidebar to see your full attendance record. It shows which days you were present, absent or late." },
        { q: ['timetable','my schedule','class timetable'],
          a: "Your class timetable is in the sidebar under <b>Timetable</b>. It shows all your subjects and periods for the week." },
        { q: ['notification','announcement','message','school update'],
          a: "Check the <b>Notifications</b> bell in the sidebar. Your school admin sends important updates and announcements there. 🔔" },
        { q: ['fees','my fees','payment','balance','what i owe'],
          a: "Your fee status is under <b>Fees</b> in the sidebar. It shows what\'s been paid and any outstanding balance. Talk to the bursary if you have questions." },
        { q: ['forgot pin','login problem','cant login','admission number'],
          a: "If you\'re having trouble logging in, you need your <b>Admission Number</b> and <b>Date of Birth</b>. Contact your class teacher or admin if you\'ve forgotten your admission number." },
        { q: ['profile','my details','my info','update info'],
          a: "Your profile is in the sidebar under <b>Profile</b>. You can view your personal details. If anything is wrong, ask your admin to update it." },
        { q: ['scratch card','result checker','view result online','pin'],
          a: "If your school uses a result checker, you\'ll need a scratch card with a PIN. Ask your class teacher or the bursary for your card." },
      ],
      tours: {
        'index': [
          { title: 'Your Student Dashboard 🎒', body: 'Hey! This is your personal school dashboard. You can see your attendance summary, recent results and notifications right here.' },
          { title: 'The Sidebar', body: 'Use the menu on the left to jump to Results, Attendance, Fees, Timetable and more.' },
          { title: 'Notifications', body: 'Keep an eye on your Notifications — your school sends result updates, fee reminders and announcements there. 🔔' },
        ],
        'results': [
          { title: 'Your Results 📊', body: 'Here you\'ll find your scores for every subject. CA scores + Exam scores = Total. Your grade and remark are calculated automatically.' },
          { title: 'Switching Terms', body: 'Use the term selector at the top to view results from previous terms too.' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',      url: '/portals/student/index.html' },
        { label: '📊 My Results',     url: '/portals/student/results.html' },
        { label: '✅ My Attendance',  url: '/portals/student/attendance.html' },
        { label: '💰 My Fees',        url: '/portals/student/fees.html' },
        { label: '🗓️ Timetable',      url: '/portals/student/timetable.html' },
        { label: '🔔 Notifications',  url: '/portals/student/notifications.html' },
        { label: '👤 My Profile',     url: '/portals/student/profile.html' },
      ],
    },

    parent: {
      greeting: "Hello! 👋 I'm the EduTrack assistant. I'll help you monitor your child's school performance and stay connected with the school. What would you like to know?",
      tips: {
        'index':        '💡 Your dashboard shows a summary of your child\'s attendance and latest results.',
        'results':      '💡 You can view your child\'s results per subject and compare performance across terms.',
        'notifications':'💡 Important school updates and fee reminders are sent here. Check regularly! 🔔',
      },
      faq: [
        { q: ['view result','child result','my child result','grades'],
          a: "Go to <b>Results</b> in the sidebar to see your child\'s scores, grades and remarks for the current term. 📊" },
        { q: ['attendance','child attendance','absent','present'],
          a: "Check <b>Attendance</b> in the sidebar to see your child\'s attendance record — which days they were present, absent or late." },
        { q: ['fees','payment','school fees','balance'],
          a: "Your child\'s fee status is under <b>Fees</b>. It shows amounts paid and any outstanding balance. Contact the bursary for payment details." },
        { q: ['notification','announcement','school message'],
          a: "Important messages from the school are in <b>Notifications</b> in the sidebar. 🔔" },
        { q: ['contact school','reach admin','talk to teacher'],
          a: "For direct communication with staff, please visit the school or use the contact details provided during registration." },
      ],
      tours: {
        'index': [
          { title: 'Parent Dashboard 👨‍👩‍👧', body: 'Welcome! From here you can monitor your child\'s academic performance, attendance and school fees all in one place.' },
          { title: 'Sidebar Navigation', body: 'Use the sidebar to switch between Results, Attendance, Fees and Notifications.' },
        ],
      },
      navLinks: [
        { label: '🏠 Dashboard',     url: '/portals/parent/index.html' },
        { label: '📊 Results',       url: '/portals/parent/results.html' },
        { label: '✅ Attendance',    url: '/portals/parent/attendance.html' },
        { label: '💰 Fees',          url: '/portals/parent/fees.html' },
        { label: '🔔 Notifications', url: '/portals/parent/notifications.html' },
      ],
    },

    guest: {
      greeting: "Hi there! 👋 I'm the EduTrack assistant. I can help you log in, reset your password, or register your school. What do you need?",
      tips: {
        'login':    '💡 Students use their Admission Number + Date of Birth. Staff and Admin use their email and password.',
        'index':    '💡 New school? Click Register to get your school set up on EduTrack NG. It only takes a few minutes!',
      },
      faq: [
        { q: ['login','how to login','cant login','sign in'],
          a: "On the login page, choose your account type:\n• <b>Staff/Admin</b> → use your email and password\n• <b>Student</b> → use your Admission Number and Date of Birth\n\nForgot your details? Click <b>Forgot Password</b> or contact your school admin." },
        { q: ['forgot password','reset password','change password'],
          a: "Click <b>Forgot Password</b> on the login page and enter your email. A reset link will be sent to you. Check your spam folder if you don\'t see it within a few minutes! 📧" },
        { q: ['register school','new school','sign up','create account'],
          a: "Click <b>Register</b> on the login page to set up your school on EduTrack NG. Fill in your school details and you\'ll be ready to go! 🏫" },
        { q: ['student login','student portal','how student login','admission number'],
          a: "Students log in by clicking the <b>Student</b> tab on the login page. Select your school, enter your <b>Admission Number</b> and <b>Date of Birth</b>, then click Verify Identity." },
        { q: ['parent login','parent portal','guardian'],
          a: "Parents use the parent portal link provided by the school. Log in with your registered phone number or email." },
        { q: ['what is edutrack','about','features'],
          a: "EduTrack NG is a complete school management platform — covering students, staff, attendance, results, fees, timetables and more. All in one place! 🎓" },
      ],
      tours: {},
      navLinks: [
        { label: '🔐 Login Page',       url: '/login.html' },
        { label: '📝 Register School',  url: '/register.html' },
      ],
    },
  };

  // ── State ───────────────────────────────────────────────────
  let role = detectRole();
  let roleData = KB[role] || KB.guest;
  let isOpen = false;
  let tourStep = 0;
  let tourItems = [];
  let searchTimeout = null;

  function getPageKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html','') || 'index';
    const isAdmin = path.includes('/admin/');
    return isAdmin ? file + '-admin' : file;
  }

  function getPageTip() {
    const file = window.location.pathname.split('/').pop().replace('.html','') || 'index';
    return (roleData.tips || {})[file] || null;
  }

  // ── Smart search ────────────────────────────────────────────
  function findAnswer(query) {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    for (const item of (roleData.faq || [])) {
      if (item.q.some(kw => q.includes(kw) || kw.includes(q))) return item.a;
    }
    const words = q.split(/\s+/).filter(w => w.length > 3);
    for (const item of (roleData.faq || [])) {
      if (words.some(w => item.q.some(kw => kw.includes(w)))) return item.a;
    }
    return null;
  }

  function searchNav(query) {
    const q = query.toLowerCase();
    return (roleData.navLinks || []).filter(n =>
      n.label.toLowerCase().includes(q) || n.url.includes(q)
    ).slice(0, 6);
  }

  // ── CSS ─────────────────────────────────────────────────────
  const css = `
    #et-asst-btn {
      position:fixed; bottom:24px; right:24px; z-index:10000;
      width:54px; height:54px; border-radius:50%;
      background:linear-gradient(135deg,#0a6e3f,#0d8f52);
      color:#fff; border:none; cursor:pointer;
      box-shadow:0 4px 24px rgba(10,110,63,0.5);
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s, box-shadow .2s; font-size:22px;
    }
    #et-asst-btn:hover { transform:scale(1.1); box-shadow:0 6px 32px rgba(10,110,63,0.6); }
    #et-asst-btn .badge {
      position:absolute; top:-2px; right:-2px;
      width:18px; height:18px; border-radius:50%;
      background:#f59e0b; color:#1a1a2e;
      font-size:10px; font-weight:800; border:2px solid #fff;
      display:flex; align-items:center; justify-content:center;
    }
    #et-asst-panel {
      position:fixed; bottom:90px; right:24px; z-index:10000;
      width:370px; max-height:580px; background:#fff;
      border-radius:22px; box-shadow:0 16px 56px rgba(0,0,0,0.16);
      display:flex; flex-direction:column; font-family:inherit; overflow:hidden;
      transform:scale(0.9) translateY(20px); opacity:0; pointer-events:none;
      transition:transform .28s cubic-bezier(.34,1.56,.64,1), opacity .22s;
    }
    #et-asst-panel.open { transform:scale(1) translateY(0); opacity:1; pointer-events:all; }
    .ea-header {
      background:linear-gradient(135deg,#0a6e3f,#0d8f52);
      color:#fff; padding:16px 18px 13px;
      display:flex; align-items:center; gap:11px; flex-shrink:0;
    }
    .ea-avatar {
      width:38px; height:38px; border-radius:50%;
      background:rgba(255,255,255,0.18);
      display:flex; align-items:center; justify-content:center;
      font-size:19px; flex-shrink:0;
    }
    .ea-header-text { flex:1; }
    .ea-header-text strong { display:block; font-size:14px; font-weight:700; }
    .ea-header-text span { font-size:11px; opacity:.72; }
    .ea-close { background:none; border:none; color:#fff; cursor:pointer; font-size:22px; opacity:.7; padding:0; }
    .ea-close:hover { opacity:1; }
    .ea-role-pill {
      background:rgba(255,255,255,0.18); border-radius:100px;
      padding:2px 10px; font-size:11px; font-weight:700;
      letter-spacing:.04em; margin-top:4px; display:inline-block;
    }
    .ea-search { padding:10px 14px; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
    .ea-search input {
      width:100%; padding:9px 13px; border:1.5px solid #e5e7eb;
      border-radius:11px; font-size:13px; outline:none; box-sizing:border-box;
      transition:border .2s; background:#fafafa;
    }
    .ea-search input:focus { border-color:#0a6e3f; background:#fff; }
    .ea-body { flex:1; overflow-y:auto; padding:14px 14px 18px; }
    .ea-greeting {
      background:linear-gradient(135deg,#f0fdf4,#dcfce7);
      border:1px solid #bbf7d0; border-radius:14px;
      padding:13px 14px; font-size:13px; color:#166534;
      line-height:1.6; margin-bottom:13px;
    }
    .ea-chip-row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:13px; }
    .ea-chip {
      padding:5px 13px; border-radius:100px;
      background:#f3f4f6; color:#374151;
      font-size:12px; font-weight:600; cursor:pointer;
      border:none; transition:background .15s, color .15s;
    }
    .ea-chip:hover { background:#0a6e3f; color:#fff; }
    .ea-tip {
      background:#fffbeb; border:1px solid #fde68a;
      border-radius:11px; padding:10px 13px;
      font-size:12.5px; color:#92400e; margin-bottom:13px; line-height:1.55;
    }
    .ea-section { font-size:11px; font-weight:700; text-transform:uppercase;
      letter-spacing:.07em; color:#9ca3af; margin:10px 0 6px; }
    .ea-item {
      display:flex; align-items:center; gap:10px;
      padding:9px 10px; border-radius:11px; cursor:pointer;
      font-size:13px; color:#111827; transition:background .15s;
      text-decoration:none; border:none; background:none; width:100%; text-align:left;
    }
    .ea-item:hover { background:#f3f4f6; }
    .ea-item-icon {
      width:30px; height:30px; border-radius:9px;
      background:#f3f4f6; display:flex; align-items:center;
      justify-content:center; font-size:15px; flex-shrink:0;
    }
    .ea-answer {
      background:#f9fafb; border-radius:13px; border:1px solid #f0f0f0;
      padding:13px 14px; font-size:13px; color:#111827;
      line-height:1.65; margin-bottom:10px;
    }
    .ea-back {
      display:inline-flex; align-items:center; gap:4px;
      font-size:12px; color:#6b7280; cursor:pointer;
      background:none; border:none; padding:0 0 10px; font-weight:600;
    }
    .ea-back:hover { color:#0a6e3f; }
    .ea-tour-card {
      background:linear-gradient(135deg,#f0fdf4,#dcfce7);
      border:1px solid #bbf7d0; border-radius:15px;
      padding:16px; margin-bottom:12px;
    }
    .ea-tour-card h4 { margin:0 0 7px; font-size:14px; color:#166534; font-weight:700; }
    .ea-tour-card p { margin:0; font-size:13px; color:#166534; line-height:1.6; }
    .ea-tour-nav { display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
    .ea-tour-nav button {
      padding:6px 15px; border-radius:9px; border:none;
      font-size:12px; font-weight:700; cursor:pointer;
      background:#0a6e3f; color:#fff;
    }
    .ea-tour-nav button:disabled { background:#e5e7eb; color:#9ca3af; cursor:default; }
    .ea-dots { display:flex; gap:5px; }
    .ea-dot { width:6px; height:6px; border-radius:50%; background:#d1d5db; transition:background .2s; }
    .ea-dot.active { background:#0a6e3f; width:18px; border-radius:3px; }
    .ea-kbd {
      background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px;
      padding:2px 8px; font-size:11px; font-weight:700; font-family:monospace; color:#374151;
    }
    .ea-shortcut-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:7px 0; border-bottom:1px solid #f5f5f5; font-size:13px; color:#374151;
    }
    .ea-shortcut-row:last-child { border:none; }
    .ea-empty { text-align:center; padding:28px 12px; color:#9ca3af; font-size:13px; }
    @media(max-width:420px){
      #et-asst-panel{ width:calc(100vw - 20px); right:10px; bottom:76px; }
      #et-asst-btn{ right:10px; bottom:10px; }
    }
  `;

  // ── Build DOM ───────────────────────────────────────────────
  function build() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'et-asst-btn';
    btn.title = 'AI Assistant (press ? to open)';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div class="badge">?</div>`;
    btn.onclick = toggle;

    const panel = document.createElement('div');
    panel.id = 'et-asst-panel';
    panel.innerHTML = `
      <div class="ea-header">
        <div class="ea-avatar">${getRoleEmoji(role)}</div>
        <div class="ea-header-text">
          <strong>AI Assistant</strong>
          <div class="ea-role-pill">${getRoleName(role)}</div>
        </div>
        <button class="ea-close" onclick="window.__etAsst.close()">×</button>
      </div>
      <div class="ea-search">
        <input type="text" id="ea-input" placeholder="Ask me anything…" autocomplete="off">
      </div>
      <div class="ea-body" id="ea-body"></div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    document.getElementById('ea-input').addEventListener('input', function () {
      clearTimeout(searchTimeout);
      const val = this.value.trim();
      if (!val) { renderHome(); return; }
      searchTimeout = setTimeout(() => renderSearch(val), 300);
    });
    document.getElementById('ea-input').addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    renderHome();
  }

  // ── Views ───────────────────────────────────────────────────
  function renderHome() {
    const tip = getPageTip();
    const pageKey = getPageKey();
    const hasTour = !!(roleData.tours || {})[pageKey];
    const faqPreview = (roleData.faq || []).slice(0, 4);

    document.getElementById('ea-body').innerHTML = `
      <div class="ea-greeting">${roleData.greeting}</div>
      ${tip ? `<div class="ea-tip">${tip}</div>` : ''}
      <div class="ea-chip-row">
        ${hasTour ? `<button class="ea-chip" onclick="window.__etAsst.startTour()">📍 Page Tour</button>` : ''}
        <button class="ea-chip" onclick="window.__etAsst.showFAQ()">❓ Help Topics</button>
        <button class="ea-chip" onclick="window.__etAsst.showNav()">🔗 Quick Links</button>
        <button class="ea-chip" onclick="window.__etAsst.showShortcuts()">⌨️ Shortcuts</button>
      </div>
      ${faqPreview.length ? `
        <div class="ea-section">Common Questions</div>
        ${faqPreview.map(item => `
          <button class="ea-item" onclick="window.__etAsst.showAnswer('${encodeURIComponent(item.q[0])}')">
            <div class="ea-item-icon">💬</div>
            <span>${cap(item.q[0])}</span>
          </button>`).join('')}
      ` : ''}
    `;
  }

  function renderSearch(query) {
    const answer = findAnswer(query);
    const navRes = searchNav(query);
    let html = `<button class="ea-back" onclick="window.__etAsst.home()">← Back</button>`;

    if (answer) {
      html += `<div class="ea-section">Answer</div><div class="ea-answer">${answer}</div>`;
    }
    if (navRes.length) {
      html += `<div class="ea-section">Go to Page</div>`;
      navRes.forEach(n => {
        html += `<a class="ea-item" href="${n.url}"><div class="ea-item-icon">📄</div><span>${n.label}</span></a>`;
      });
    }
    if (!answer && !navRes.length) {
      html += `<div class="ea-empty">
        <div style="font-size:34px;margin-bottom:8px;">🤔</div>
        Hmm, I couldn't find anything for <b>"${query}"</b>.<br>
        Try different words or browse the Help Topics!
        <div style="margin-top:14px;"><button class="ea-chip" onclick="window.__etAsst.showFAQ()">Browse Help Topics</button></div>
      </div>`;
    }

    document.getElementById('ea-body').innerHTML = html;
  }

  function showAnswer(enc) {
    const key = decodeURIComponent(enc);
    const item = (roleData.faq || []).find(f => f.q[0] === key);
    if (!item) return;
    document.getElementById('ea-body').innerHTML = `
      <button class="ea-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="ea-section">${cap(key)}</div>
      <div class="ea-answer">${item.a}</div>
      <div style="margin-top:10px;"><button class="ea-chip" onclick="window.__etAsst.showFAQ()">← All Topics</button></div>
    `;
  }

  function showFAQ() {
    document.getElementById('ea-body').innerHTML = `
      <button class="ea-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="ea-section">Help Topics for ${getRoleName(role)}</div>
      ${(roleData.faq || []).map(item => `
        <button class="ea-item" onclick="window.__etAsst.showAnswer('${encodeURIComponent(item.q[0])}')">
          <div class="ea-item-icon">💬</div>
          <span>${cap(item.q[0])}</span>
        </button>`).join('')}
    `;
  }

  function showNav() {
    document.getElementById('ea-body').innerHTML = `
      <button class="ea-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="ea-section">Quick Links for ${getRoleName(role)}</div>
      ${(roleData.navLinks || []).map(n => `
        <a class="ea-item" href="${n.url}"><div class="ea-item-icon">📄</div><span>${n.label}</span></a>`
      ).join('')}
    `;
  }

  function showShortcuts() {
    const shortcuts = [
      { keys:'? or H', desc:'Open / close this assistant' },
      { keys:'Esc',    desc:'Close assistant' },
      { keys:'Alt+D',  desc:'Go to Dashboard' },
      { keys:'Alt+A',  desc:'Go to Attendance' },
      { keys:'Alt+R',  desc:'Go to Results / Score Entry' },
      { keys:'Alt+N',  desc:'Go to Notifications' },
      ...(role === 'admin' ? [{ keys:'Alt+S', desc:'Go to Students' }] : []),
    ];
    document.getElementById('ea-body').innerHTML = `
      <button class="ea-back" onclick="window.__etAsst.home()">← Back</button>
      <div class="ea-section">Keyboard Shortcuts</div>
      ${shortcuts.map(s => `
        <div class="ea-shortcut-row"><span>${s.desc}</span><span class="ea-kbd">${s.keys}</span></div>`
      ).join('')}
    `;
  }

  function startTour() {
    const pageKey = getPageKey();
    tourItems = ((roleData.tours || {})[pageKey]) || [];
    if (!tourItems.length) return;
    tourStep = 0;
    renderTour();
  }

  function renderTour() {
    const step = tourItems[tourStep];
    const dots = tourItems.map((_, i) =>
      `<div class="ea-dot${i === tourStep ? ' active' : ''}"></div>`
    ).join('');
    document.getElementById('ea-body').innerHTML = `
      <button class="ea-back" onclick="window.__etAsst.home()">← Exit Tour</button>
      <div class="ea-section">Step ${tourStep + 1} of ${tourItems.length}</div>
      <div class="ea-tour-card">
        <h4>${step.title}</h4>
        <p>${step.body}</p>
      </div>
      <div class="ea-tour-nav">
        <button ${tourStep === 0 ? 'disabled' : ''} onclick="window.__etAsst.tourPrev()">← Prev</button>
        <div class="ea-dots">${dots}</div>
        ${tourStep < tourItems.length - 1
          ? `<button onclick="window.__etAsst.tourNext()">Next →</button>`
          : `<button onclick="window.__etAsst.home()" style="background:#15803d;">✓ Done!</button>`}
      </div>
    `;
  }

  // ── Toggle ──────────────────────────────────────────────────
  function toggle() { isOpen ? close() : open(); }
  function open() {
    isOpen = true;
    document.getElementById('et-asst-panel').classList.add('open');
    setTimeout(() => document.getElementById('ea-input')?.focus(), 260);
  }
  function close() {
    isOpen = false;
    document.getElementById('et-asst-panel').classList.remove('open');
  }

  // ── Keyboard ────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    if (e.key === 'Escape') { close(); return; }
    if (!typing && (e.key === '?' || e.key === 'h' || e.key === 'H')) { toggle(); return; }
    if (e.altKey) {
      const base = role === 'admin' ? '/admin/' :
                   role === 'student' ? '/portals/student/' :
                   role === 'parent' ? '/portals/parent/' :
                   role === 'bursar' ? '/portals/bursary/' : '/portals/staff/';
      if (e.key === 'd') { e.preventDefault(); location.href = base + 'index.html'; }
      if (e.key === 'a') { e.preventDefault(); location.href = base + 'attendance.html'; }
      if (e.key === 'r') { e.preventDefault(); location.href = base + (role === 'admin' ? 'results.html' : role === 'teacher' ? 'score-entry.html' : 'results.html'); }
      if (e.key === 'n') { e.preventDefault(); location.href = base + 'notifications.html'; }
      if (e.key === 's' && role === 'admin') { e.preventDefault(); location.href = '/admin/students.html'; }
    }
  });

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ── Public API ──────────────────────────────────────────────
  window.__etAsst = {
    open, close, toggle, home: () => { document.getElementById('ea-input').value = ''; renderHome(); },
    showFAQ, showNav, showShortcuts, startTour,
    tourNext: () => { if (tourStep < tourItems.length - 1) { tourStep++; renderTour(); } },
    tourPrev: () => { if (tourStep > 0) { tourStep--; renderTour(); } },
    showAnswer,
  };

  // ── Init ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})();
