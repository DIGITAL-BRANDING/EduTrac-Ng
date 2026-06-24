// ============================================================
//  EduTrack NG v2 — api/database.js
//  Supabase client + all shared query helpers
//  Single source of truth for every DB call in the app
// ============================================================

// ┌─────────────────────────────────────────────────────────────────────────┐
// │  REQUIRED SQL MIGRATION — run once in Supabase SQL Editor               │
// │                                                                         │
// │  The SaaS dashboard KPIs (Total Students, Platform Users, Revenue)      │
// │  query tables that are behind per-school RLS policies.  The superadmin  │
// │  is NOT a school user, so those queries return 0 without this function. │
// │                                                                         │
// │  This SECURITY DEFINER function runs as the DB owner (bypasses RLS)     │
// │  and returns a single-row aggregate for the SaaS dashboard.             │
// │                                                                         │
// │  Paste everything between the dashes into the Supabase SQL Editor       │
// │  and click Run.                                                         │
// ├─────────────────────────────────────────────────────────────────────────┤
// │
// │  -- Drop any old overload first to avoid 42725 ambiguity errors
// │  DO $$ DECLARE r RECORD;
// │  BEGIN
// │    FOR r IN
// │      SELECT oid::regprocedure::text AS sig
// │      FROM   pg_proc
// │      WHERE  proname = 'get_platform_stats'
// │    LOOP
// │      EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
// │    END LOOP;
// │  END $$;
// │
// │  CREATE OR REPLACE FUNCTION get_platform_stats()
// │  RETURNS TABLE (
// │    total_students     bigint,
// │    total_users        bigint,
// │    total_revenue      numeric,
// │    revenue_this_month numeric
// │  )
// │  LANGUAGE sql
// │  SECURITY DEFINER
// │  SET search_path = public
// │  AS $$
// │    SELECT
// │      (SELECT COUNT(*)            FROM students)                           AS total_students,
// │      (SELECT COUNT(*)            FROM users)                              AS total_users,
// │      (SELECT COALESCE(SUM(amount_paid), 0) FROM payments)                AS total_revenue,
// │      (SELECT COALESCE(SUM(amount_paid), 0) FROM payments
// │         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
// │      )                                                                    AS revenue_this_month;
// │  $$;
// │
// │  -- Grant execute to the anon and authenticated roles used by the client
// │  GRANT EXECUTE ON FUNCTION get_platform_stats() TO anon, authenticated;
// │
// └─────────────────────────────────────────────────────────────────────────┘

// ┌─────────────────────────────────────────────────────────────────────────┐
// │  REQUIRED SQL MIGRATION #2 — Transcript / CGPA support                  │
// │                                                                         │
// │  Powers the new Statement of Result & Transcript generator for         │
// │  tertiary, vocational, and computer-training institutions              │
// │  (see /report-card/transcript.html).                                   │
// │                                                                         │
// │  Adds two columns with SAFE DEFAULTS, so o_level/islamic/tutorial_center│
// │  schools — which never use credit units or grade points — are entirely │
// │  unaffected. Every existing subject gets credit_unit = 1 (so dividing   │
// │  by total credit units still works correctly even if a school never    │
// │  sets real values), and every grading_scales row gets grade_point = 0   │
// │  until a tertiary/vocational admin assigns real GPA values from the    │
// │  Settings → Grading tab (see the new "Grade Point" field added there).  │
// │                                                                         │
// │  Paste everything between the dashes into the Supabase SQL Editor       │
// │  and click Run. Safe to run multiple times (IF NOT EXISTS guards).      │
// ├─────────────────────────────────────────────────────────────────────────┤
// │
// │  ALTER TABLE subjects
// │    ADD COLUMN IF NOT EXISTS credit_unit numeric NOT NULL DEFAULT 1;
// │
// │  ALTER TABLE grading_scales
// │    ADD COLUMN IF NOT EXISTS grade_point numeric NOT NULL DEFAULT 0;
// │
// │  -- One-time backfill: give the 4 standard GPA-style presets (loaded via
// │  -- Settings → Grading → "Tertiary GPA" or the provisioning seeder)
// │  -- sensible default grade points if they were created before this
// │  -- migration ran. Safe no-op for schools that already set their own.
// │  UPDATE grading_scales SET grade_point = 5.0 WHERE grade = 'A' AND grade_point = 0;
// │  UPDATE grading_scales SET grade_point = 4.0 WHERE grade = 'B' AND grade_point = 0;
// │  UPDATE grading_scales SET grade_point = 3.0 WHERE grade = 'C' AND grade_point = 0;
// │  UPDATE grading_scales SET grade_point = 2.0 WHERE grade = 'D' AND grade_point = 0;
// │  UPDATE grading_scales SET grade_point = 1.0 WHERE grade = 'E' AND grade_point = 0;
// │  UPDATE grading_scales SET grade_point = 0.0 WHERE grade = 'F' AND grade_point = 0;
// │
// └─────────────────────────────────────────────────────────────────────────┘

const SUPABASE_URL      = (window.__EDUTRAC_CONFIG__ || {}).SUPABASE_URL;
const SUPABASE_ANON_KEY = (window.__EDUTRAC_CONFIG__ || {}).SUPABASE_ANON_KEY;

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Path Helper ────────────────────────────────────────────────
function getRootPath() {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  return depth <= 1 ? './' : '../'.repeat(depth - 1);
}

// ── Auth Helpers ───────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  // Online: fetch fresh from Supabase and refresh cache
  if (navigator.onLine) {
    try {
      const { data } = await db.from('users')
        .select('*, schools(*)')
        .eq('id', session.user.id)
        .single();
      if (data) {
        // Keep et_user_profile cache in sync so authGuard and getCurrentUser agree
        try { localStorage.setItem('et_user_profile', JSON.stringify(data)); } catch {}
        return data;
      }
    } catch {
      // Network failed despite navigator.onLine — fall through to cache
    }
  }

  // Offline (or network failed): return cached profile
  try {
    const raw = localStorage.getItem('et_user_profile');
    if (raw) {
      const cached = JSON.parse(raw);
      // Only use cache if it belongs to the current session
      if (cached && cached.id === session.user.id) return cached;
    }
  } catch {}

  return null;
}

async function requireAuth(allowedRoles = []) {
  const session = await getSession();
  if (!session) { window.location.href = '/login.html'; return null; }
  const user = await getCurrentUser(); // now offline-safe via cache
  if (!user) {
    if (navigator.onLine) {
      window.location.href = '/login.html';
    }
    // Offline with no cache: stay on page, authGuard's banner handles it
    return null;
  }
  if (user.is_active === false && navigator.onLine) {
    // Only enforce deactivation when online (same rule as authGuard)
    await db.auth.signOut();
    window.location.href = '/login.html'; return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = '/login.html'; return null;
  }
  return user;
}

// logout() is the single authoritative version in api/auth.js — not redeclared here

// ── Shared Queries ─────────────────────────────────────────────

// ── School Context Cache (ISSUE B-02 fix) ─────────────────────
// loadSchoolContext() fires 6 parallel DB queries on every page load.
// In low-bandwidth environments this means 6× round-trip latency per click.
// Fix: memoize in sessionStorage with a 5-minute TTL per school.
// Cache is busted automatically when:
//   • 5 minutes elapse (TTL timer)
//   • Admin calls bustSchoolContextCache(schoolId) after mutating
//     terms/classes/subjects/grading/dashSettings

const _CTX_TTL_MS = 5 * 60 * 1000; // 5 minutes

function _ctxCacheKey(schoolId) {
  return `school_ctx_v1_${schoolId}`;
}

function _ctxTimerKey(schoolId) {
  return `school_ctx_ttl_${schoolId}`;
}

function bustSchoolContextCache(schoolId) {
  if (!schoolId) return;
  try {
    sessionStorage.removeItem(_ctxCacheKey(schoolId));
    const tid = sessionStorage.getItem(_ctxTimerKey(schoolId));
    if (tid) { clearTimeout(Number(tid)); sessionStorage.removeItem(_ctxTimerKey(schoolId)); }
  } catch (_) { /* sessionStorage unavailable — ignore */ }
}

// School-wide bootstrap — call once per page, returns everything.
// Results are cached in sessionStorage for 5 minutes to eliminate
// repeated 6-query fan-outs on every navigation (ISSUE B-02).
// OFFLINE FIX: falls back to a localStorage persistent copy when sessionStorage
// is empty and the network is unavailable, so dashboards still populate offline.
const _CTX_LS_KEY_PREFIX = 'school_ctx_persist_'; // persisted across sessions

function _ctxLsKey(schoolId) { return `${_CTX_LS_KEY_PREFIX}${schoolId}`; }

async function loadSchoolContext(schoolId) {
  // 1. Try sessionStorage (fast, in-memory for this session)
  try {
    const raw = sessionStorage.getItem(_ctxCacheKey(schoolId));
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && cached._expires > Date.now()) return cached;
      sessionStorage.removeItem(_ctxCacheKey(schoolId));
    }
  } catch (_) {}

  // 2. Offline: return the persisted localStorage copy (may be slightly stale, but functional)
  if (!navigator.onLine) {
    try {
      const raw = localStorage.getItem(_ctxLsKey(schoolId));
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached) {
          console.log('[DB] Offline — serving school context from localStorage cache');
          return cached;
        }
      }
    } catch (_) {}
    // No cache at all and offline — return empty-but-safe structure
    console.warn('[DB] Offline and no school context cache found — returning empty context');
    return { term: null, classes: [], subjects: [], terms: [], grading: [], dashSettings: null, school: null, programs: [], levels: [], _offline: true };
  }

  // 3. Online + cache miss — fire all queries in parallel
  const [
    { data: term },
    { data: classes },
    { data: subjects },
    { data: terms },
    { data: grading },
    { data: dashSettings },
    { data: schoolRow },
    { data: programs },
    { data: levels },
  ] = await Promise.all([
    db.from('terms').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    db.from('classes').select('id,name,level,level_id,program_id,teacher_id,combination_id').eq('school_id', schoolId).order('name'),
    db.from('subjects').select('id,name,code').eq('school_id', schoolId).order('name'),
    db.from('terms').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    db.from('grading_scales').select('*').eq('school_id', schoolId).order('min_score', { ascending: false }),
    db.from('dashboard_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    db.from('schools').select('id,name,school_type,logo_url,address,phone,email,state,lga,motto').eq('id', schoolId).maybeSingle(),
    db.from('programs').select('*').eq('school_id', schoolId).order('name'),
    db.from('levels').select('*').eq('school_id', schoolId).order('sort_order,name'),
  ]);

  const ctx = {
    term,
    classes:     classes     || [],
    subjects:    subjects    || [],
    terms:       terms       || [],
    grading:     grading     || [],
    dashSettings,
    school:      schoolRow   || null,
    programs:    programs    || [],
    levels:      levels      || [],
    _expires:    Date.now() + _CTX_TTL_MS,
  };

  // 4. Write to sessionStorage (fast TTL) AND localStorage (offline fallback, no TTL)
  try {
    sessionStorage.setItem(_ctxCacheKey(schoolId), JSON.stringify(ctx));
    const tid = setTimeout(() => {
      sessionStorage.removeItem(_ctxCacheKey(schoolId));
      sessionStorage.removeItem(_ctxTimerKey(schoolId));
    }, _CTX_TTL_MS);
    sessionStorage.setItem(_ctxTimerKey(schoolId), String(tid));
  } catch (_) {}

  // Persist to localStorage for offline use (strip _expires so it never auto-invalidates offline)
  try {
    const { _expires: _, ...persistable } = ctx;
    localStorage.setItem(_ctxLsKey(schoolId), JSON.stringify(persistable));
  } catch (_) {}

  return ctx;
}

// All classes for a teacher (form teacher + subject assignments merged)
async function getTeacherClasses(teacherId, schoolId, termId = null) {
  const [{ data: formClasses }, { data: subjectAssignments }] = await Promise.all([
    db.from('classes').select('id,name,level').eq('teacher_id', teacherId).eq('school_id', schoolId),
    db.from('class_subjects')
      .select('class_id,subject_id,term_id,classes(id,name,level),subjects(id,name,code)')
      .eq('teacher_id', teacherId).eq('school_id', schoolId)
  ]);

  let assignments = subjectAssignments || [];
  if (termId) assignments = assignments.filter(a => a.term_id === termId);
  else assignments = assignments.filter((a, i, arr) => arr.findIndex(x => x.class_id === a.class_id && x.subject_id === a.subject_id) === i);

  const classMap = {};
  (formClasses || []).forEach(c => {
    classMap[c.id] = { ...c, subjects: [], subjectIds: new Set(), isFormTeacher: true };
  });
  assignments.forEach(a => {
    if (!a.classes) return;
    if (!classMap[a.class_id]) classMap[a.class_id] = { id: a.class_id, name: a.classes.name, level: a.classes.level || '', subjects: [], subjectIds: new Set(), isFormTeacher: false };
    if (a.subjects?.id && !classMap[a.class_id].subjectIds.has(a.subject_id)) {
      classMap[a.class_id].subjects.push({ id: a.subjects.id, name: a.subjects.name, code: a.subjects.code || '' });
      classMap[a.class_id].subjectIds.add(a.subject_id);
    }
  });
  return Object.values(classMap);
}

// Students enrolled in a specific class for a term.
// After ISSUE A-01 fix: unique constraint is now (student_id, class_id, term_id),
// allowing SS3 multi-class students. Always filter by class_id to get the correct roster.
async function getEnrolledStudents(classId, termId, schoolId) {
  const { data } = await db.from('enrollments')
    .select('student_id, students(id,full_name,admission_no,gender,combination_id,is_active)')
    .eq('class_id', classId)
    .eq('term_id', termId)
    .eq('school_id', schoolId);
  return (data || []).map(e => e.students).filter(Boolean);
}

// Full results for a student for a term (used in report card + cumulative)
async function getStudentResults(studentId, termId) {
  const { data } = await db.from('results')
    .select('score, subject_id, exam_id, subjects(id,name,code), exams(id,name,max_score,weight)')
    .eq('student_id', studentId)
    .eq('term_id', termId);
  return data || [];
}

// Fee balance for a student (expected - paid)
async function getStudentFeeBalance(studentId, schoolId, termId = null) {
  const feeQuery = db.from('fee_types').select('id,name,amount,class_id').eq('school_id', schoolId);
  const payQuery = db.from('payments').select('amount_paid,fee_type_id').eq('student_id', studentId).eq('school_id', schoolId);
  if (termId) payQuery.eq('term_id', termId);

  const [{ data: feeTypes }, { data: payments }] = await Promise.all([feeQuery, payQuery]);
  const expected = (feeTypes || []).reduce((s, f) => s + Number(f.amount), 0);
  const paid = (payments || []).reduce((s, p) => s + Number(p.amount_paid), 0);
  return { expected, paid, balance: Math.max(0, expected - paid), feeTypes: feeTypes || [], payments: payments || [] };
}

// Family/sibling discount check
// After ISSUE C-03 fix: family_id now has a proper FK to the families table.
// Always create the family row first via createFamily() before assigning family_id to students.
async function getFamilyStudents(familyId, schoolId) {
  if (!familyId) return [];
  const { data } = await db.from('students')
    .select('id,full_name,admission_no,is_active')
    .eq('family_id', familyId)
    .eq('school_id', schoolId)
    .eq('is_active', true);
  return data || [];
}

// Create a new family record. Returns the new family id or null on error.
// Always call this before linking students via family_id (ISSUE C-03 fix).
async function createFamily(schoolId, label = null) {
  const { data, error } = await db.from('families')
    .insert({ school_id: schoolId, label })
    .select('id')
    .single();
  if (error) { console.error('[EduTrack] createFamily error:', error.message); return null; }
  return data.id;
}

// ── Formatting Helpers ─────────────────────────────────────────
function formatMoney(n) {
  if (n === null || n === undefined) return '₦0';
  return '₦' + Number(n).toLocaleString('en-NG');
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatPercent(val, total) {
  if (!total) return '0%';
  return Math.round((val / total) * 100) + '%';
}
function gradeFromScale(score, scale) {
  if (!scale?.length) return { grade: '—', remark: '—' };
  return scale.find(s => score >= s.min_score && score <= s.max_score) || { grade: 'F9', remark: 'Fail' };
}

// ── UI Helpers ─────────────────────────────────────────────────
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function safeToastType(type) {
  return String(type || 'success').replace(/[^a-zA-Z0-9_-]/g, '') || 'success';
}

function toast(message, type = 'success') {
  const existing = document.getElementById('et-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'et-toast';
  t.className = `et-toast et-toast--${safeToastType(type)}`;
  const span = document.createElement('span');
  span.textContent = message;
  t.appendChild(span);
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('et-toast--show'), 10);
  setTimeout(() => { t.classList.remove('et-toast--show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function showLoader(container, msg = 'Loading…') {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (el) el.innerHTML = `<div class="et-loader"><div class="et-spinner"></div><p>${escapeHTML(msg)}</p></div>`;
}
function showError(container, msg) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (el) el.innerHTML = `<div class="et-empty"><div class="et-empty__icon">⚠️</div><p>${escapeHTML(msg)}</p></div>`;
}
function showEmpty(container, msg, icon = '(empty)') {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (el) el.innerHTML = `<div class="et-empty"><div class="et-empty__icon">${escapeHTML(icon)}</div><p>${escapeHTML(msg)}</p></div>`;
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) closeModal(e.target.id);
});

// ── School-type helpers (available globally once ctx is loaded) ──
window.normaliseSchoolType = function(type) {
  const aliases = {
    primary: 'o_level',
    secondary: 'o_level',
    both: 'o_level',
    islamiyya: 'islamic',
    islamic_institute: 'islamic',
    vocational_training: 'vocational',
    tertiary_institute: 'tertiary',
    computer_institute: 'computer_training',
  };
  const value = String(type || '').trim().toLowerCase();
  return aliases[value] || value || 'o_level';
};
window.getSchoolCtxType = function(ctx) {
  return window.normaliseSchoolType((ctx?.school?.school_type) || window._schoolType || 'o_level');
};
window.getInstitutionLabelsFor = function(ctxOrType) {
  const t = typeof ctxOrType === 'string' ? window.normaliseSchoolType(ctxOrType) : window.getSchoolCtxType(ctxOrType);
  const labels = {
    o_level: { institution: 'School', learner: 'Student', class: 'Class', subject: 'Subject', period: 'Term', session: 'Academic Session', program: 'Programme' },
    tertiary: { institution: 'Institution', learner: 'Student', class: 'Level', subject: 'Course', period: 'Semester', session: 'Academic Year', program: 'Department / Programme' },
    vocational: { institution: 'Training Centre', learner: 'Trainee', class: 'Batch / Level', subject: 'Module', period: 'Training Period', session: 'Session', program: 'Programme' },
    islamic: { institution: 'Islamic Institute', learner: 'Student', class: 'Level / Class', subject: 'Subject', period: 'Term', session: 'Academic Session', program: 'Programme' },
    computer_training: { institution: 'Computer Institute', learner: 'Trainee', class: 'Batch', subject: 'Module', period: 'Training Period', session: 'Session', program: 'Course' },
    tutorial_center: { institution: 'Tutorial Centre', learner: 'Student', class: 'Class / Batch', subject: 'Subject', period: 'Term', session: 'Academic Session', program: 'Programme' },
    other: { institution: 'Institution', learner: 'Learner', class: 'Level / Group', subject: 'Module', period: 'Period', session: 'Session', program: 'Programme' },
  };
  return labels[t] || labels.o_level;
};
window.getPeriodLabelFor = function(ctx) {
  return window.getInstitutionLabelsFor(ctx).period;
};
window.getSessionLabelFor = function(ctx) {
  return window.getInstitutionLabelsFor(ctx).session;
};

/**
 * window.getAvailableDocumentsFor(ctxOrType)
 * ───────────────────────────────────────────────────────────────────────
 * Single source of truth for which student documents are appropriate for
 * a given institution type. This is an EDUCATIONAL rule, not a technical
 * limitation: a "testimonial" (character/conduct reference) makes sense
 * for a school-age learner moving between schools, but is not something
 * adult tertiary/vocational/computer-training graduates are issued —
 * they receive a Statement of Result, Transcript, and Certificate instead.
 *
 * Every page that links to a document generator (dashboards, student
 * profile pages, a future "Generate Documents" menu) should call this
 * FIRST and only render buttons for documents that come back available:true.
 * This keeps the gating logic in ONE place instead of being re-implemented
 * (and risking drifting out of sync) on every page that links to a document.
 *
 * Returns an array of:
 *   { key, label, href, available, reason }
 * `href` is relative to the project root — callers should prefix it with
 * the right relative path for their own location (e.g. '../' from /admin/).
 */
window.getAvailableDocumentsFor = function(ctxOrType) {
  const t = typeof ctxOrType === 'string' ? window.normaliseSchoolType(ctxOrType) : window.getSchoolCtxType(ctxOrType);
  const isAcademicCredit = ['tertiary', 'vocational', 'computer_training'].includes(t);

  const docs = [
    {
      key: 'report_card',
      label: 'Report Card',
      href: 'portals/academic-office/report-cards.html',
      available: true, // every institution type grades learners somehow
      reason: '',
    },
    {
      key: 'statement',
      label: 'Statement of Result',
      href: 'report-card/transcript.html',
      available: isAcademicCredit,
      reason: isAcademicCredit ? '' : 'Only available for tertiary, vocational, and computer-training institutions running semester or cohort-based programmes.',
    },
    {
      key: 'transcript',
      label: 'Full Transcript',
      href: 'report-card/transcript.html?doc=transcript',
      available: isAcademicCredit,
      reason: isAcademicCredit ? '' : 'Only available for tertiary, vocational, and computer-training institutions running semester or cohort-based programmes.',
    },
    {
      key: 'certificate',
      label: 'Certificate',
      href: 'report-card/certificate.html',
      available: true, // every institution type issues a final certificate of some kind
      reason: '',
    },
    {
      key: 'testimonial',
      label: 'Testimonial',
      href: 'report-card/testimonial.html',
      // Character/conduct references are appropriate for school-age learners,
      // not adult tertiary/vocational/computer-training graduates. 'other' is
      // a deliberately flexible catch-all, so we allow it there too.
      available: !isAcademicCredit,
      reason: isAcademicCredit ? 'Testimonials are character references for school-age learners. This institution type issues a Statement of Result, Transcript, and Certificate instead.' : '',
    },
  ];

  return docs;
};

