/**
 * EduTrack NG — Provision School Edge Function
 * Route: POST /api/provision-school
 *
 * Netlify Environment Variables needed:
 *   SUPABASE_URL              — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key from Settings → API
 */

export default async function handler(request, context) {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400, corsHeaders); }

  const { application_id, admin_note } = body;
  if (!application_id) {
    return json({ error: 'application_id is required' }, 400, corsHeaders);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Server not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify.' }, 500, corsHeaders);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!callerToken) return json({ error: 'Unauthorized' }, 401, corsHeaders);

  // Helper: Supabase REST API
  const sb = async (path, method = 'GET', data = null) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
    };
    if (data) opts.body = JSON.stringify(data);
    const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
    return r.json();
  };

  // Helper: Supabase Auth Admin API
  const sbAuth = async (path, method = 'GET', data = null) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    };
    if (data) opts.body = JSON.stringify(data);
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, opts);
    return r.json();
  };

  try {
    const caller = await getCallerProfile(SUPABASE_URL, SERVICE_KEY, callerToken);
    if (!caller) return json({ error: 'Unauthorized' }, 401, corsHeaders);
    if (caller.role !== 'saas_owner') return json({ error: 'Forbidden: saas_owner only' }, 403, corsHeaders);

    // 1. Fetch the application
    const appData = await sb(`/school_applications?id=eq.${application_id}&select=*`);
    const app = Array.isArray(appData) ? appData[0] : null;
    if (!app) throw new Error('Application not found');
    if (app.status !== 'pending') throw new Error('Application is not pending');

    const adminEmail   = app.admin_email;
    const tempPassword = generateTempPassword();

    // 2. Create Supabase Auth user
    let userId;
    const authResult = await sbAuth('/users', 'POST', {
      email:         adminEmail,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${app.admin_first_name || ''} ${app.admin_last_name || ''}`.trim(),
        role: 'admin',
      },
    });

    if (!authResult.id) {
      // Email already exists — find and update
      if (authResult.msg?.includes('already been registered') || authResult.code === 422) {
        const usersData = await sbAuth('/users?page=1&per_page=1000');
        const existing  = usersData.users?.find(u => u.email === adminEmail);
        if (!existing) throw new Error('Auth error: ' + (authResult.msg || 'Unknown'));
        await sbAuth(`/users/${existing.id}`, 'PUT', { password: tempPassword, email_confirm: true });
        userId = existing.id;
      } else {
        throw new Error('Auth error: ' + (authResult.msg || authResult.error || 'Unknown'));
      }
    } else {
      userId = authResult.id;
    }

    // 3. Create the school/institution record
    const schoolType = normaliseSchoolType(app.school_type);
    const schoolData = await sb('/schools', 'POST', {
      name: app.school_name,
      school_type: schoolType,
      ownership: app.school_ownership,
      lga: app.school_lga,
      state: app.school_state,
      city: app.school_city,
      address: app.school_address,
      email: app.school_email,
      plan: 'free',
      is_active: true,
      created_at: new Date().toISOString(),
    });
    const school = Array.isArray(schoolData) ? schoolData[0] : schoolData;
    if (!school?.id) throw new Error('Failed to create school');

    // 3b. Seed type-appropriate defaults so the admin doesn't land in an empty
    //     shell — pre-load levels, grading scale, subjects, combinations and
    //     a starter term/session matched to the institution type they picked.
    //     Every insert is wrapped so a failure here never blocks provisioning
    //     (the admin can always add these manually from Academic Structure).
    await seedSchoolDefaults(sb, school.id, schoolType).catch(err => {
      console.error('[provision-school] Seeding defaults failed (non-fatal):', err.message);
    });

    // 4. Create the admin user record
    await sb('/users', 'POST', {
      id: userId,
      full_name: `${app.admin_first_name || ''} ${app.admin_last_name || ''}`.trim(),
      phone: app.admin_phone || null, role: 'admin',
      school_id: school.id, is_active: true, must_change_password: true,
    });

    // 5. Mark application as approved
    await sb(`/school_applications?id=eq.${application_id}`, 'PATCH', {
      status: 'approved', admin_note: admin_note || null,
      school_id: school.id, reviewed_at: new Date().toISOString(),
    });

    // 6. Audit log (non-fatal)
    await sb('/saas_audit_log', 'POST', {
      actor_id: caller.id, action: 'school_created', target_id: school.id, target_type: 'school',
      meta: JSON.stringify({ name: app.school_name, plan: 'free', school_type: schoolType, admin_email: adminEmail, application_id }),
    }).catch(() => {});

    return json({ success: true, login_email: adminEmail, temp_password: tempPassword, school_id: school.id }, 200, corsHeaders);

  } catch (err) {
    console.error('[provision-school] Error:', err);
    return json({ error: err.message }, 500, corsHeaders);
  }
}

async function getCallerProfile(supabaseUrl, serviceKey, callerToken) {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${callerToken}` },
  });
  if (!authRes.ok) return null;
  const authUser = await authRes.json();
  if (!authUser?.id) return null;

  const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(authUser.id)}&select=id,role,is_active`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  });
  const data = await res.json().catch(() => []);
  const user = Array.isArray(data) ? data[0] : null;
  if (!user || user.is_active === false) return null;
  return user;
}

function normaliseSchoolType(type) {
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
}

/**
 * Per-institution-type starter data. Keep this in sync with:
 *   - api/database.js          window.getInstitutionLabelsFor()
 *   - js/report-card-engine.js SCHOOL_TYPE_MAP
 *   - admin/programs.html      LEVEL_PRESETS
 * If you add a new school_type anywhere in that trio, add a matching entry here.
 */
const TYPE_PRESETS = {
  o_level: {
    levels: ['Nursery 1','Nursery 2','Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6',
              'JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'],
    grading: [
      {grade:'A1',min_score:75,max_score:100,remark:'Excellent'},{grade:'B2',min_score:70,max_score:74,remark:'Very Good'},
      {grade:'B3',min_score:65,max_score:69,remark:'Good'},{grade:'C4',min_score:60,max_score:64,remark:'Credit'},
      {grade:'C5',min_score:55,max_score:59,remark:'Credit'},{grade:'C6',min_score:50,max_score:54,remark:'Credit'},
      {grade:'D7',min_score:45,max_score:49,remark:'Pass'},{grade:'E8',min_score:40,max_score:44,remark:'Pass'},
      {grade:'F9',min_score:0,max_score:39,remark:'Fail'},
    ],
    subjects: ['English Language','Mathematics','Civic Education','Basic Science','Social Studies',
               'Agricultural Science','Computer Studies','Christian Religious Studies','Islamic Studies',
               'Physics','Chemistry','Biology','Further Mathematics','Literature in English','Government',
               'History','Geography','Economics','Commerce','Accounting','Physical & Health Education'],
    combinations: [
      { name:'Science', color:'#2563eb', description:'Physics, Chemistry, Biology, Further Maths' },
      { name:'Art', color:'#db2777', description:'Literature, Government, History, CRS/IRS' },
      { name:'Commercial', color:'#16a34a', description:'Commerce, Accounting, Economics' },
    ],
    termName: 'First Term', periodLabel: 'term',
  },
  tertiary: {
    levels: ['ND I','ND II','HND I','HND II','Year 1','Year 2','Year 3','Year 4'],
    grading: [
      {grade:'A',min_score:70,max_score:100,remark:'Excellent (5.0)'},{grade:'B',min_score:60,max_score:69,remark:'Very Good (4.0)'},
      {grade:'C',min_score:50,max_score:59,remark:'Good (3.0)'},{grade:'D',min_score:45,max_score:49,remark:'Pass (2.0)'},
      {grade:'E',min_score:40,max_score:44,remark:'Pass (1.0)'},{grade:'F',min_score:0,max_score:39,remark:'Fail (0.0)'},
    ],
    subjects: ['Use of English','Mathematics','Introduction to Computer Science','Principles of Management',
               'Research Methodology','Entrepreneurship Studies'],
    combinations: [],
    termName: 'First Semester', periodLabel: 'semester',
  },
  vocational: {
    levels: ['Basic Level 1','Basic Level 2','Intermediate Level','Advanced Level'],
    grading: [
      {grade:'C',min_score:50,max_score:100,remark:'Competent'},
      {grade:'NYC',min_score:0,max_score:49,remark:'Not Yet Competent'},
    ],
    subjects: ['Workshop Practice','Occupational Safety & Health','Tools & Equipment Handling',
               'Practical Skills Assessment','Entrepreneurship & Business Skills'],
    combinations: [],
    termName: 'First Training Period', periodLabel: 'training period',
  },
  islamic: {
    levels: ['Nursery 1','Nursery 2','Primary 1','Primary 2','Primary 3','JSS 1','JSS 2','JSS 3',
             'SS 1','SS 2','SS 3','Tahfiz Year 1','Tahfiz Year 2','Tahfiz Year 3'],
    grading: [
      {grade:'A1',min_score:75,max_score:100,remark:'Excellent'},{grade:'B2',min_score:70,max_score:74,remark:'Very Good'},
      {grade:'B3',min_score:65,max_score:69,remark:'Good'},{grade:'C4',min_score:60,max_score:64,remark:'Credit'},
      {grade:'C5',min_score:55,max_score:59,remark:'Credit'},{grade:'C6',min_score:50,max_score:54,remark:'Credit'},
      {grade:'D7',min_score:45,max_score:49,remark:'Pass'},{grade:'E8',min_score:40,max_score:44,remark:'Pass'},
      {grade:'F9',min_score:0,max_score:39,remark:'Fail'},
    ],
    subjects: ['Qur\'an Memorisation (Tahfiz)','Tafsir','Hadith','Fiqh','Arabic Language','Aqeedah',
               'English Language','Mathematics','Islamic History (Seerah)','Basic Science'],
    combinations: [],
    termName: 'First Term', periodLabel: 'term',
  },
  computer_training: {
    levels: ['Beginner Batch','Intermediate Batch','Advanced Batch','Certification Batch'],
    grading: [
      {grade:'A',min_score:80,max_score:100,remark:'Excellent'},{grade:'B',min_score:65,max_score:79,remark:'Good'},
      {grade:'C',min_score:50,max_score:64,remark:'Satisfactory'},{grade:'F',min_score:0,max_score:49,remark:'Fail / Retake'},
    ],
    subjects: ['Computer Appreciation','Microsoft Office Suite','Internet & Email','Web Design (HTML/CSS)',
               'Programming Fundamentals','Graphics Design','Data Analysis Basics','Digital Marketing'],
    combinations: [],
    termName: 'First Cohort', periodLabel: 'training period',
  },
  tutorial_center: {
    levels: ['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3','JAMB/UTME Class','Post-UTME Class'],
    grading: [
      {grade:'A1',min_score:75,max_score:100,remark:'Excellent'},{grade:'B2',min_score:70,max_score:74,remark:'Very Good'},
      {grade:'B3',min_score:65,max_score:69,remark:'Good'},{grade:'C4',min_score:60,max_score:64,remark:'Credit'},
      {grade:'C5',min_score:55,max_score:59,remark:'Credit'},{grade:'C6',min_score:50,max_score:54,remark:'Credit'},
      {grade:'D7',min_score:45,max_score:49,remark:'Pass'},{grade:'E8',min_score:40,max_score:44,remark:'Pass'},
      {grade:'F9',min_score:0,max_score:39,remark:'Fail'},
    ],
    subjects: ['English Language','Mathematics','Physics','Chemistry','Biology','Economics','Government'],
    combinations: [],
    termName: 'First Term', periodLabel: 'term',
  },
  other: {
    levels: ['Level 1','Level 2','Level 3'],
    grading: [
      {grade:'Pass',min_score:50,max_score:100,remark:'Pass'},
      {grade:'Fail',min_score:0,max_score:49,remark:'Fail'},
    ],
    subjects: [],
    combinations: [],
    termName: 'First Period', periodLabel: 'period',
  },
};

async function seedSchoolDefaults(sb, schoolId, schoolType) {
  const preset = TYPE_PRESETS[schoolType] || TYPE_PRESETS.o_level;
  const now = new Date();
  const sessionLabel = `${now.getFullYear()}/${now.getFullYear() + 1}`;

  // 1) Levels — sequential sort order so they list in the right teaching order
  if (preset.levels.length) {
    await sb('/levels', 'POST', preset.levels.map((name, i) => ({
      school_id: schoolId, name, sort_order: i + 1,
    })));
  }

  // 2) Grading scale — matched to the institution type (A1-F9, GPA letters,
  //    Competent/Not-Yet-Competent, etc.)
  if (preset.grading.length) {
    await sb('/grading_scales', 'POST', preset.grading.map(g => ({
      school_id: schoolId, ...g,
    })));
  }

  // 3) Subjects — starter list matched to the institution type
  if (preset.subjects.length) {
    await sb('/subjects', 'POST', preset.subjects.map(name => ({
      school_id: schoolId, name,
    })));
  }

  // 4) Subject combinations (Science/Art/Commercial) — only relevant for o_level
  if (preset.combinations.length) {
    await sb('/subject_combinations', 'POST', preset.combinations.map(c => ({
      school_id: schoolId, ...c,
    })));
  }

  // 5) First term/semester/session so the dashboard isn't blank on first login
  await sb('/terms', 'POST', {
    school_id: schoolId,
    name: preset.termName,
    session: sessionLabel,
    is_current: true,
    start_date: now.toISOString().slice(0, 10),
  });
}

function generateTempPassword() {
  const words   = ['Track', 'Learn', 'Edu', 'Smart', 'Bright', 'Swift'];
  const symbols = ['@', '#', '!', '$'];
  return `${words[Math.floor(Math.random() * words.length)]}${symbols[Math.floor(Math.random() * symbols.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export const config = { path: '/api/provision-school' };
