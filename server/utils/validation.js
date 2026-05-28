export function cleanString(value, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function requireStrings(body, fields) {
  const missing = fields.filter((field) => !cleanString(body?.[field]));
  return missing.length ? `${missing.join(", ")} required` : "";
}

export function limitMessages(messages, maxMessages = 12, maxChars = 2000) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-maxMessages)
    .filter((m) => ["user", "assistant"].includes(m?.role) && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, maxChars) }));
}
