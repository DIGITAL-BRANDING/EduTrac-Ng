/**
 * EduTrack NG — Reset Staff Password Edge Function
 * Route: POST /api/reset-staff-password
 *
 * Allows school admins to reset any staff member's password.
 * Uses SUPABASE_SERVICE_KEY (server-side only — never exposed to browser).
 *
 * Netlify Environment Variables needed:
 *   SUPABASE_URL          — your project URL
 *   SUPABASE_SERVICE_KEY  — service_role key from Settings → API
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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL  = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Server not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify.' }, 500, corsHeaders);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!callerToken) return json({ error: 'Unauthorized' }, 401, corsHeaders);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400, corsHeaders); }

  const { user_id, new_password } = body;

  if (!user_id || !new_password) {
    return json({ error: 'user_id and new_password are required' }, 400, corsHeaders);
  }
  if (typeof new_password !== 'string' || new_password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
  }

  try {
    const caller = await getCallerProfile(SUPABASE_URL, SERVICE_KEY, callerToken);
    if (!caller) return json({ error: 'Unauthorized' }, 401, corsHeaders);
    if (!['admin', 'saas_owner'].includes(caller.role)) {
      return json({ error: 'Forbidden' }, 403, corsHeaders);
    }

    const target = await getUserRecord(SUPABASE_URL, SERVICE_KEY, user_id);
    if (!target) return json({ error: 'Target user not found' }, 404, corsHeaders);
    if (target.role === 'saas_owner') {
      return json({ error: 'Cannot reset a SaaS owner password here' }, 403, corsHeaders);
    }
    if (caller.role !== 'saas_owner' && target.school_id !== caller.school_id) {
      return json({ error: 'Forbidden: target user belongs to another school' }, 403, corsHeaders);
    }

    // Use Supabase Admin API to update the user's password
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ password: new_password }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || data.msg || 'Supabase admin update failed');
    }

    await audit(SUPABASE_URL, SERVICE_KEY, {
      actor_id: caller.id,
      action: 'staff_password_reset',
      target_id: user_id,
      target_type: 'user',
      meta: JSON.stringify({ target_role: target.role, school_id: target.school_id }),
    });

    return json({ success: true, user_id }, 200, corsHeaders);

  } catch (err) {
    return json({ error: err.message || String(err) }, 500, corsHeaders);
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function getCallerProfile(supabaseUrl, serviceKey, callerToken) {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${callerToken}` },
  });
  if (!authRes.ok) return null;
  const authUser = await authRes.json();
  if (!authUser?.id) return null;
  return getUserRecord(supabaseUrl, serviceKey, authUser.id);
}

async function getUserRecord(supabaseUrl, serviceKey, userId) {
  const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id,role,school_id,is_active`, {
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

async function audit(supabaseUrl, serviceKey, row) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/saas_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch {}
}

export const config = { path: '/api/reset-staff-password' };
