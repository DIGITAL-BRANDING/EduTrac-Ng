/**
 * EduTrack NG - School Provisioning Route
 * POST /api/provision-school
 *
 * Only an active saas_owner may approve an application and provision a school.
 */

import crypto from "crypto";
import express from "express";
import supabase from "../supabaseClient.js";
import { requireRole } from "../utils/auth.js";
import { cleanString, isUuid } from "../utils/validation.js";

const router = express.Router();

router.post("/provision-school", async (req, res) => {
  const { application_id, admin_note } = req.body;

  if (!isUuid(application_id)) {
    return res.status(400).json({ error: "Valid application_id is required" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: "Server not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const auth = await requireRole(supabase, req, ["saas_owner"]);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const headers = {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "return=representation",
  };

  try {
    const { data: app, error: appError } = await supabase
      .from("school_applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();

    if (appError) throw appError;
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status !== "pending") {
      return res.status(409).json({ error: "Application is not pending" });
    }

    const adminEmail = cleanString(app.admin_email, 254).toLowerCase();
    if (!adminEmail) return res.status(400).json({ error: "Application is missing admin email" });

    const adminName = `${cleanString(app.admin_first_name, 80)} ${cleanString(app.admin_last_name, 80)}`.trim();
    const tempPassword = generateTempPassword();

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: adminEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: adminName, role: "admin" },
      }),
    });

    let authData = await authRes.json();
    if (authData.error || !authData.id) {
      if (authData.msg?.includes("already") || authData.code === "email_exists") {
        const existRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(adminEmail)}`,
          { headers },
        );
        const existData = await existRes.json();
        if (!existData.users?.length) {
          return res.status(500).json({ error: "Auth user lookup failed" });
        }
        authData = existData.users[0];
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authData.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ password: tempPassword, email_confirm: true }),
        });
      } else {
        return res.status(500).json({ error: "Auth user creation failed" });
      }
    }

    const authUserId = authData.id;

    const schoolPayload = {
      name: cleanString(app.school_name, 180),
      school_type: normaliseSchoolType(app.school_type),
      ownership: cleanString(app.school_ownership, 80),
      address: cleanString(app.school_address, 300),
      city: cleanString(app.school_city, 100),
      state: cleanString(app.school_state, 100),
      lga: cleanString(app.school_lga, 100),
      postal: cleanString(app.school_postal, 30),
      email: cleanString(app.school_email || adminEmail, 254),
      phone: cleanString(app.admin_phone, 40),
      website: cleanString(app.school_website, 200),
      is_active: true,
      plan: "free",
    };

    let { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert([schoolPayload])
      .select("id,name")
      .single();

    if (isMissingColumnError(schoolError)) {
      const compatibleSchoolPayload = {
        name: schoolPayload.name,
        school_type: schoolPayload.school_type,
        address: schoolPayload.address,
        state: schoolPayload.state,
        lga: schoolPayload.lga,
        email: schoolPayload.email,
        phone: schoolPayload.phone,
        plan: "free",
      };

      ({ data: school, error: schoolError } = await supabase
        .from("schools")
        .insert([compatibleSchoolPayload])
        .select("id,name")
        .single());
    }

    if (schoolError || !school?.id) {
      throw schoolError || new Error("School creation failed");
    }

    let { error: userError } = await supabase
      .from("users")
      .upsert([{
        id: authUserId,
        school_id: school.id,
        full_name: adminName,
        email: adminEmail,
        phone: cleanString(app.admin_phone, 40),
        role: "admin",
        is_active: true,
        must_change_password: true,
      }], { onConflict: "id" });

    if (isMissingColumnError(userError)) {
      ({ error: userError } = await supabase
        .from("users")
        .upsert([{
          id: authUserId,
          school_id: school.id,
          full_name: adminName,
          phone: cleanString(app.admin_phone, 40),
          role: "admin",
          is_active: true,
        }], { onConflict: "id" }));
    }

    if (userError) throw userError;

    let { error: approveError } = await supabase
      .from("school_applications")
      .update({
        status: "approved",
        admin_note: cleanString(admin_note, 1000) || null,
        reviewed_at: new Date().toISOString(),
        provisioned_school_id: school.id,
      })
      .eq("id", application_id);

    if (isMissingColumnError(approveError)) {
      ({ error: approveError } = await supabase
        .from("school_applications")
        .update({
          status: "approved",
          admin_note: cleanString(admin_note, 1000) || null,
          reviewed_at: new Date().toISOString(),
          school_id: school.id,
        })
        .eq("id", application_id));
    }

    if (isMissingColumnError(approveError)) {
      ({ error: approveError } = await supabase
        .from("school_applications")
        .update({
          status: "approved",
          admin_note: cleanString(admin_note, 1000) || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application_id));
    }

    if (approveError) throw approveError;

    await supabase.from("saas_audit_log").insert([{
      actor_id: auth.user.id,
      action: "school_created",
      target_id: school.id,
      target_type: "school",
      meta: { application_id, school_name: school.name, admin_email: adminEmail },
    }]).catch(() => {});

    res.json({
      success: true,
      school_id: school.id,
      auth_user_id: authUserId,
      temp_password: tempPassword,
      login_email: adminEmail,
      message: `School "${school.name}" provisioned. Share the temporary password securely.`,
    });
  } catch (err) {
    console.error("[/api/provision-school]", err);
    res.status(500).json({ error: err.message || "School provisioning failed" });
  }
});

function generateTempPassword() {
  return `EduTrack@${crypto.randomBytes(9).toString("base64url")}`;
}

function isMissingColumnError(error) {
  if (!error) return false;
  const text = `${error.code || ""} ${error.message || ""} ${error.details || ""}`;
  return error.code === "PGRST204" ||
    /column|schema cache|Could not find/i.test(text);
}

function normaliseSchoolType(type) {
  const aliases = {
    primary: "o_level",
    secondary: "o_level",
    both: "o_level",
    islamiyya: "islamic",
    islamic_institute: "islamic",
    vocational_training: "vocational",
    tertiary_institute: "tertiary",
    computer_institute: "computer_training",
  };
  const value = cleanString(type, 80).toLowerCase();
  return aliases[value] || value || "o_level";
}

export default router;
