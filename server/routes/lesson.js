/**
 * EduTrack NG - Lesson Generator Route
 * POST /api/generate-lesson
 */

import express from "express";
import supabase from "../supabaseClient.js";
import { requireRole } from "../utils/auth.js";
import { cleanString, requireStrings } from "../utils/validation.js";

const router = express.Router();
const ALLOWED_ROLES = ["admin", "teacher", "exam_officer", "vp_academic", "saas_owner"];

router.post("/generate-lesson", async (req, res) => {
  try {
    const auth = await requireRole(supabase, req, ALLOWED_ROLES);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const missing = requireStrings(req.body, ["subject", "topic", "classLevel"]);
    if (missing) return res.status(400).json({ error: missing });

    const subject = cleanString(req.body.subject, 120);
    const topic = cleanString(req.body.topic, 180);
    const classLevel = cleanString(req.body.classLevel, 80);

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server" });
    }

    const prompt = `Generate a structured Nigerian school lesson note.

Subject: ${subject}
Class: ${classLevel}
Topic: ${topic}

Include:
- Learning Objectives
- Introduction / Motivation
- Step-by-step Explanation
- Evaluation Questions
- Assignment`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_LESSON_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful Nigerian school teacher. Keep content classroom-ready and age-appropriate." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("OpenAI error:", detail);
      return res.status(502).json({ error: "OpenAI API request failed" });
    }

    const aiData = await aiRes.json();
    const lesson = aiData.choices?.[0]?.message?.content;
    if (!lesson) return res.status(502).json({ error: "OpenAI returned an unexpected response" });

    const { error: dbError } = await supabase
      .from("lessons")
      .insert([{
        school_id: auth.user.school_id || null,
        created_by: auth.user.id,
        subject,
        topic,
        class_level: classLevel,
        content: lesson,
      }]);

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return res.status(207).json({ lesson, warning: "Lesson generated but could not be saved." });
    }

    res.json({ lesson });
  } catch (err) {
    console.error("[/api/generate-lesson]", err);
    res.status(500).json({ error: "Failed to generate lesson" });
  }
});

export default router;
