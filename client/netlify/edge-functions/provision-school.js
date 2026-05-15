// netlify/functions/provision-school.js
// Fixed: added email_confirm: true so the admin can log in immediately
// without needing to click an email confirmation link.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // must be the SERVICE ROLE key

function generateTempPassword() {
  const words   = ['Track','Learn','Edu','Smart','Bright','Swift'];
  const symbols = ['@','#','!','$'];
  const word    = words[Math.floor(Math.random() * words.length)];
  const sym     = symbols[Math.floor(Math.random() * symbols.length)];
  const num     = Math.floor(1000 + Math.random() * 9000);
  return `${word}${sym}${num}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const { application_id, admin_note } = body;
  if (!application_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'application_id is required' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Fetch the application
    const { data: app, error: appErr } = await supabase
      .from('school_applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (appErr || !app) throw new Error(appErr?.message || 'Application not found');
    if (app.status !== 'pending') throw new Error('Application is not pending');

    const adminEmail  = app.admin_email;
    const tempPassword = generateTempPassword();

    // 2. Create Supabase Auth user
    //    KEY FIX: email_confirm: true  — without this, Supabase marks the
    //    account as unconfirmed and signInWithPassword fails even with the
    //    correct password ("Email not confirmed" / "Invalid credentials").
    let userId;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email:         adminEmail,
      password:      tempPassword,
      email_confirm: true,          // <-- THE CRITICAL FIX
      user_metadata: {
        full_name: `${app.admin_first_name || ''} ${app.admin_last_name || ''}`.trim(),
        role: 'admin',
      },
    });

    if (authErr) {
      // If the email already exists, reset the password on the existing account
      if (authErr.message?.includes('already been registered') || authErr.status === 422) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === adminEmail);
        if (!existing) throw new Error('Auth error: ' + authErr.message);
        await supabase.auth.admin.updateUserById(existing.id, {
          password:      tempPassword,
          email_confirm: true,       // also fix any previously unconfirmed account
        });
        userId = existing.id;
      } else {
        throw new Error('Auth error: ' + authErr.message);
      }
    } else {
      userId = authData.user.id;
    }

    // 3. Create the school record
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .insert({
        name:       app.school_name,
        type:       app.school_type,
        ownership:  app.school_ownership,
        lga:        app.school_lga,
        state:      app.school_state,
        city:       app.school_city,
        address:    app.school_address,
        email:      app.school_email,
        plan:       'free',
        is_active:  true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (schoolErr) throw new Error('Failed to create school: ' + schoolErr.message);

    // 4. Create the admin user record
    const { error: userErr } = await supabase
      .from('users')
      .upsert({
        id:                  userId,
        full_name:           `${app.admin_first_name || ''} ${app.admin_last_name || ''}`.trim(),
        phone:               app.admin_phone || null,
        role:                'admin',
        school_id:           school.id,
        is_active:           true,
        must_change_password: true,
      }, { onConflict: 'id' });

    if (userErr) throw new Error('Failed to create user record: ' + userErr.message);

    // 5. Mark application as approved
    const { error: updateErr } = await supabase
      .from('school_applications')
      .update({
        status:      'approved',
        admin_note:  admin_note || null,
        school_id:   school.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    if (updateErr) throw new Error('Failed to update application: ' + updateErr.message);

    // 6. Audit log
    await supabase.from('saas_audit_log').insert({
      action:      'school_created',
      target_id:   school.id,
      target_type: 'school',
      meta: { name: app.school_name, plan: 'free', admin_email: adminEmail },
    });

    // 7. Return credentials
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:       true,
        login_email:   adminEmail,
        temp_password: tempPassword,
        school_id:     school.id,
      }),
    };

  } catch (err) {
    console.error('[provision-school] Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
