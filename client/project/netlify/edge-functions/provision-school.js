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
