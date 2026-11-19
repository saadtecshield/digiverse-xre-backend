import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { geminiSessionRouter } from "./routes/geminiSession.js";

const app = express();

app.use(cors({ origin: config.allowedOrigin === "*" ? true : config.allowedOrigin }));
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", geminiSessionRouter);

app.use((err, _req, res, _next) => {
  console.error("[GEMINI ERROR] Unhandled:", err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[GEMINI] Backend listening on 0.0.0.0:${config.port}`);
  console.log(`[GEMINI] Model: ${config.model}`);
  console.log(`[GEMINI] Token mint: @google/genai authTokens.create`);
  console.log(`[GEMINI] WS endpoint: ${config.wsUrl}`);
});
