/**
 * EduTrack NG — Reset Admin Password Edge Function
 * Route: POST /api/reset-admin-password
 *
 * Called by SaaS console to reset any school admin's password.
 * Requires SUPABASE_SERVICE_ROLE_KEY (never exposed to browser).
 *
 * Body: { user_id, mode }
 *   mode = "email"    → sends Supabase password reset email
 *   mode = "generate" → generates temp password, sets it, returns it
 */

export default async function handler(request, context) {
  const origin = request.headers.get('Origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST')   return json({ error: 'Method not allowed' }, 405, cors);

  // Verify caller is authenticated saas_owner
  const authHeader = request.headers.get('Authorization') || '';
  const callerToken = authHeader.replace('Bearer ', '').trim();
  if (!callerToken) return json({ error: 'Unauthorized' }, 401, cors);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'Server misconfigured' }, 500, cors);

  // Helper: call Supabase REST
  const sb = async (path, method = 'GET', data = null, token = SERVICE_KEY) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation',
      },
    };
    if (data) opts.body = JSON.stringify(data);
    const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
    return r.json();
  };

  // Helper: call Supabase Auth Admin API
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

  // Verify caller is saas_owner using their token
  try {
    const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${callerToken}` },
    });
    const callerData = await callerRes.json();
    if (!callerData?.id) return json({ error: 'Unauthorized — invalid session' }, 401, cors);

    // Check role in users table
    const roleRes = await sb(`/users?id=eq.${callerData.id}&select=role`);
    const role = Array.isArray(roleRes) ? roleRes[0]?.role : null;
    if (role !== 'saas_owner') return json({ error: 'Forbidden — saas_owner only' }, 403, cors);
  } catch {
    return json({ error: 'Auth verification failed' }, 401, cors);
  }

  // Parse body
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const { user_id, mode, redirect_url } = body;
  if (!user_id) return json({ error: 'user_id is required' }, 400, cors);
  if (!['email', 'generate'].includes(mode)) return json({ error: 'mode must be "email" or "generate"' }, 400, cors);

  try {
    // Fetch the target user from auth
    const authUser = await sbAuth(`/users/${user_id}`);
    if (!authUser?.id) return json({ error: 'User not found' }, 404, cors);

    const email = authUser.email;

    // Verify target is an admin (not saas_owner)
    const userRec = await sb(`/users?id=eq.${user_id}&select=role,full_name,school_id`);
    const targetUser = Array.isArray(userRec) ? userRec[0] : null;
    if (!targetUser) return json({ error: 'User record not found' }, 404, cors);
    if (targetUser.role === 'saas_owner') return json({ error: 'Cannot reset saas_owner password here' }, 403, cors);

    if (mode === 'email') {
      // Send password reset email via Supabase
      const resetRes = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          email,
          redirect_to: redirect_url || 'https://edutracng.netlify.app/reset-password.html',
        }),
      });

      if (!resetRes.ok) {
        const err = await resetRes.json();
        throw new Error(err.msg || 'Failed to send reset email');
      }

      // Log action
      await sb('/saas_audit_log', 'POST', {
        action: 'password_reset_email_sent',
        target_id: user_id, target_type: 'user',
        meta: JSON.stringify({ email, name: targetUser.full_name }),
      }).catch(() => {});

      return json({ success: true, mode: 'email', email, message: `Reset email sent to ${email}` }, 200, cors);

    } else {
      // Generate a temp password and set it directly
      const tempPassword = generateTempPassword();

      const updateRes = await sbAuth(`/users/${user_id}`, 'PUT', {
        password:      tempPassword,
        email_confirm: true,
      });

      if (updateRes.error) throw new Error(updateRes.error.message || 'Failed to update password');

      // Mark must_change_password = true so they're forced to change on next login
      await sb(`/users?id=eq.${user_id}`, 'PATCH', { must_change_password: true }).catch(() => {});

      // Log action
      await sb('/saas_audit_log', 'POST', {
        action: 'password_reset_by_saas',
        target_id: user_id, target_type: 'user',
        meta: JSON.stringify({ email, name: targetUser.full_name }),
      }).catch(() => {});

      return json({
        success: true,
        mode: 'generate',
        email,
        temp_password: tempPassword,
        message: `Temporary password set for ${email}. Share it securely.`,
      }, 200, cors);
    }

  } catch (err) {
    console.error('[reset-admin-password] Error:', err);
    return json({ error: err.message }, 500, cors);
  }
}

function generateTempPassword() {
  const words   = ['Track', 'Learn', 'Edu', 'Smart', 'Bright', 'Swift', 'Eagle', 'Prime'];
  const symbols = ['@', '#', '!', '$', '%'];
  return `${words[Math.floor(Math.random() * words.length)]}${symbols[Math.floor(Math.random() * symbols.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export const config = { path: '/api/reset-admin-password' };
