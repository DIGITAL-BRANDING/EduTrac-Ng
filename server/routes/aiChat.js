/**
 * EduTrack NG - AI Chat Proxy Route
 * POST /api/ai-chat
 */

import express from "express";
import { limitMessages } from "../utils/validation.js";

const router = express.Router();

router.post("/ai-chat", async (req, res) => {
  const { messages, role } = req.body;
  const safeMessages = limitMessages(messages);

  if (!safeMessages.length) {
    return res.status(400).json({ error: "At least one valid message is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: systemPromptForRole(role),
        messages: safeMessages,
      }),
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error("[/api/ai-chat]", err);
    res.status(502).json({ error: "Failed to reach Anthropic API" });
  }
});

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

export default router;
