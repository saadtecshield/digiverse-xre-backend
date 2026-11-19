# DIGIVERSE XRE Backend — cloud deploy (Render)

Goal: **any phone** can talk to AI. No PC IP, no adb, no same-WiFi.

```
Phone (Unity app)
   → https://YOUR-APP.onrender.com/api/gemini/session
   → short-lived Gemini token
   → phone connects to Gemini Live directly
```

Permanent Gemini API key stays only on the server (Render env vars). Never in the APK.

---

## 1) Create free Render account

1. Go to https://render.com → Sign up (GitHub login OK)
2. Dashboard → **New +** → **Web Service**
3. Connect this GitHub repo (or upload / connect the `Backend` folder)

If the whole repo is connected, set:

| Setting | Value |
|---|---|
| **Root Directory** | `Backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm run start` |
| **Instance** | Free |

## 2) Environment variables (Render Dashboard → Environment)

Copy from `.env.example`. **Required:**

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | your permanent Google AI Studio key (`AIza...`) |
| `GEMINI_MODEL` | `gemini-3.1-flash-live-preview` |
| `PORT` | `10000` (Render sets this automatically — our server already reads `PORT`) |
| `ALLOWED_ORIGIN` | `*` |

Optional: leave the rest as defaults from `.env.example`.

**Never** put `GEMINI_API_KEY` in Unity or git.

## 3) Deploy

Click **Create Web Service** → wait ~2 minutes → you get a URL like:

```
https://digiverse-xre-backend.onrender.com
```

Test in phone browser:

```
https://YOUR-APP.onrender.com/health
```

Should show: `{"ok":true}`

## 4) Point Unity at it

Open `Assets/_XRE/AI/GeminiLiveConfig.asset` → set:

```
Backend Session Url = https://YOUR-APP.onrender.com/api/gemini/session
```

Save → Build And Run on **any** phone (any WiFi / mobile data).

## 5) Test flow

1. Open app → enter world → walk near NPC
2. **Connect** → status should become `Ready` (few seconds; free tier may wake up slowly first time)
3. **Start Talking** → speak → **Stop Talking** → character replies with voice

---

## Free tier note

Render free services **sleep after ~15 min idle**. First Connect after sleep can take 30–60 seconds. That is normal. For demos, open `/health` in browser once before the walkthrough.

## Local PC backend?

Only for developers coding on the same machine. Final PoC / client demo = **cloud URL only**.
