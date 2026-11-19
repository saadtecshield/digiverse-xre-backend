import "dotenv/config";

function required(name) {
  const v = process.env[name];
  if (!v || v.trim() === "" || v.includes("paste_your")) {
    throw new Error(`Missing env var: ${name}. Check Backend/.env.`);
  }
  return v.trim();
}

function optional(name, def = "") {
  const v = process.env[name];
  return v == null || v.trim() === "" ? def : v.trim();
}

export const config = {
  apiKey: required("GEMINI_API_KEY"),
  model: optional("GEMINI_MODEL", "gemini-3.1-flash-live-preview"),
  // Official Live API WebSocket for ephemeral tokens (v1beta constrained).
  wsUrl: optional(
    "GEMINI_WS_URL",
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained"
  ),
  tokenExpirySeconds: Number.parseInt(optional("TOKEN_EXPIRY_SECONDS", "1800"), 10),
  newSessionExpirySeconds: Number.parseInt(optional("NEW_SESSION_EXPIRY_SECONDS", "60"), 10),
  port: Number.parseInt(optional("PORT", "8787"), 10),
  allowedOrigin: optional("ALLOWED_ORIGIN", "*"),
  clientSharedSecret: optional("CLIENT_SHARED_SECRET", ""),
};
