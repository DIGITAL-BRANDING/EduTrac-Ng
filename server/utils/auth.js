const USER_SELECT = "id,role,school_id,is_active,full_name,email";

export function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export async function getAuthUser(supabase, req) {
  const token = getBearerToken(req);
  if (!token) return { error: "Unauthorized", status: 401 };

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user?.id) return { error: "Unauthorized", status: 401 };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) return { error: "User profile not found", status: 401 };
  if (profile.is_active === false) return { error: "User account is inactive", status: 403 };

  return { user: profile, token };
}

export async function requireRole(supabase, req, roles) {
  const result = await getAuthUser(supabase, req);
  if (result.error) return result;
  if (!roles.includes(result.user.role)) return { error: "Forbidden", status: 403 };
  return result;
}

export async function getUserById(supabase, userId) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export function sameSchoolOrSaasOwner(actor, target) {
  return actor.role === "saas_owner" || actor.school_id === target.school_id;
}
