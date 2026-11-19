import express from "express";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { getPersona } from "../personas.js";

export const geminiSessionRouter = express.Router();

function modelResourceName(model) {
  const m = (model || "").trim();
  if (!m) return "models/gemini-3.1-flash-live-preview";
  return m.startsWith("models/") ? m : `models/${m}`;
}

geminiSessionRouter.post("/gemini/session", async (req, res) => {
  try {
    if (config.clientSharedSecret) {
      const provided = req.header("Authorization") || "";
      if (provided !== config.clientSharedSecret) {
        return res.status(401).json({ error: "unauthorized" });
      }
    }

    const npcId = (req.body?.npcId || "").toString().trim().toLowerCase();
    const persona = getPersona(npcId);
    if (!persona) {
      return res.status(400).json({ error: `unknown npcId '${npcId}'` });
    }

    console.log(`[GEMINI] Requesting session token (npc=${npcId})`);

    const now = Date.now();
    const expireTime = new Date(now + config.tokenExpirySeconds * 1000).toISOString();
    const newSessionExpireTime = new Date(now + config.newSessionExpirySeconds * 1000);

    const model = modelResourceName(config.model);

    // Locked Live session config — server authoritative.
    // Client may only send matching setup; cannot override model / modality / persona.
    // Do NOT enable historyConfig.initialHistoryInClientContent — PoC uses realtime audio only.
    // Push-to-talk UX: disable server VAD; Unity sends activityStart/activityEnd.
    // (audioStreamEnd alone does not end a turn under automatic VAD.)
    const lockedLiveConfig = {
      responseModalities: ["AUDIO"],
      systemInstruction: persona.systemInstruction,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: persona.voice },
        },
      },
      realtimeInputConfig: {
        automaticActivityDetection: { disabled: true },
      },
      // Debug: verify mic heard + what model intended to speak.
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };

    const client = new GoogleGenAI({ apiKey: config.apiKey });

    let token;
    try {
      token = await client.authTokens.create({
        config: {
          uses: 1,
          expireTime,
          newSessionExpireTime,
          liveConnectConstraints: {
            model,
            config: lockedLiveConfig,
          },
        },
      });
    } catch (err) {
      console.error("[GEMINI ERROR] authTokens.create failed:", err?.message || err);
      return res.status(502).json({
        error: "gemini_token_create_failed",
        details: String(err?.message || err),
      });
    }

    // Official docs: pass token.name back to the client as the ephemeral credential.
    const ephemeral = token?.name;
    if (!ephemeral) {
      console.error("[GEMINI ERROR] Token response missing name:", token);
      return res.status(502).json({ error: "no_token_name_in_response" });
    }

    const tokenExpire = token.expireTime || expireTime;

    // Unity must send this as the first WebSocket message (matches locked constraints).
    // No historyConfig — initialHistoryInClientContent stays unset/false.
    const setupFrame = {
      setup: {
        model,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: lockedLiveConfig.speechConfig,
        },
        systemInstruction: {
          parts: [{ text: persona.systemInstruction }],
        },
        realtimeInputConfig: lockedLiveConfig.realtimeInputConfig,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    };

    console.log(`[GEMINI] Token issued (npc=${npcId}, expires ${tokenExpire})`);
    console.log(
      `[GEMINI SETUP] model=${model} modalities=AUDIO ` +
        `automaticVAD=disabled (manual activityStart/End) ` +
        `inputAudioTranscription=on outputAudioTranscription=on ` +
        `initialHistoryInClientContent=false sessionResumption=false`
    );

    return res.json({
      token: ephemeral,
      expireTime: tokenExpire,
      wsEndpoint: config.wsUrl,
      setupJson: JSON.stringify(setupFrame),
    });
  } catch (err) {
    console.error("[GEMINI ERROR] Session route threw:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});
