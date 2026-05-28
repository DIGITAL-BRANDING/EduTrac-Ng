/**
 * EduTrack NG — AI Proxy  (Netlify Edge Function)
 * Route: POST /api/ai-chat
 *
 * Keeps the Anthropic API key server-side.
 * Set ANTHROPIC_API_KEY in Netlify → Site Settings → Environment Variables.
 */

export default async function handler(request, context) {
  // ── CORS pre-flight ──────────────────────────────────────────
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://edutracng.netlify.app,http://localhost:8888,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return json({ error: 'Origin not allowed' }, 403, corsHeaders);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 20000) {
    return json({ error: 'Request body too large' }, 413, corsHeaders);
  }

  // ── Parse body ───────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const { messages, role } = body;

  if (!messages || !Array.isArray(messages)) {
    return json({ error: 'messages array is required' }, 400, corsHeaders);
  }

  const safeMessages = messages
    .slice(-12)
    .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!safeMessages.length) {
    return json({ error: 'At least one valid message is required' }, 400, corsHeaders);
  }

  // ── Read API key from environment ────────────────────────────
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: 'API key not configured. Set ANTHROPIC_API_KEY in Netlify environment variables.' }, 500, corsHeaders);
  }

  // ── Forward to Anthropic ─────────────────────────────────────
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPromptForRole(role),
        messages: safeMessages,
      }),
    });

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    return json({ error: 'Failed to reach Anthropic API', detail: err.message }, 502, corsHeaders);
  }
}

function systemPromptForRole(role) {
  const prompts = {
    visitor: "You are EduTrack NG's helpful AI assistant for Nigerian schools. Be warm, concise, and encourage school registration where relevant.",
    admin: "You are EduTrack NG's assistant for school administrators. Give practical step-by-step guidance for staff, students, results, fees, attendance, and settings.",
    staff: "You are EduTrack NG's assistant for teachers. Help with score entry, attendance, timetables, daily activities, and notifications.",
    student: "You are EduTrack NG's assistant for students. Use simple language for results, attendance, fees, and profile questions.",
    parent: "You are EduTrack NG's assistant for parents and guardians. Be clear and reassuring about results, attendance, fees, and complaints.",
    academic: "You are EduTrack NG's assistant for academic and exam officers. Be precise about grading, broadsheets, results, and report cards.",
    bursary: "You are EduTrack NG's assistant for bursary officers. Be precise about payments, receipts, balances, and fee setup.",
    saas: "You are EduTrack NG's assistant for SaaS platform administrators. Help with applications, schools, billing, scratch cards, announcements, and audit logs.",
  };
  return prompts[role] || prompts.visitor;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export const config = { path: '/api/ai-chat' };
