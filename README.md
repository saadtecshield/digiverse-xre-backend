# DIGIVERSE XRE Backend

Tiny Node.js + Express server whose only job is to mint short-lived **ephemeral tokens**
for the Gemini Live API. The permanent Google API key stays here; the Unity client
never sees it.

## Setup

```bash
cd Backend
cp .env.example .env
# edit .env — paste your permanent Gemini API key
npm install
npm run start
```

Server listens on `http://localhost:8787` by default (see `PORT` in `.env`).

## Endpoint

`POST /api/gemini/session`

Request body:

```json
{ "npcId": "ataturk" }
```

Allowed `npcId` values (see `src/personas.js`):
- `ataturk`
- `amazon_woman_01`
- `amazon_woman_02`

Successful response:

```json
{
  "token": "…short-lived credential…",
  "expireTime": "2026-08-12T13:45:00Z",
  "wsEndpoint": "wss://generativelanguage.googleapis.com/ws/…/BidiGenerateContentConstrained",
  "setupJson": "{\"setup\":{\"model\":\"…\",\"generationConfig\":{…},\"systemInstruction\":{…}}}"
}
```

Unity must forward `setupJson` verbatim as its first WebSocket message, because it
matches the constraints locked into the token.

## Security notes

- `.env` is gitignored. Do NOT commit it.
- Tokens are created with the official `@google/genai` SDK (`authTokens.create`).
- Every token uses `liveConnectConstraints` locking at least:
  - `model` (from `GEMINI_MODEL`)
  - `responseModalities = ["AUDIO"]`
  - `speechConfig` (persona voice)
  - `systemInstruction` (server-side persona allowlist)
- Unity connects to the **v1beta** constrained WebSocket:
  `.../v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=TOKEN`
- Token lifetime defaults: 30 minutes session / 60 seconds to *start* one / `uses = 1`.
- Permanent API key never leaves the server. Unity receives only `token.name`.
- Set `CLIENT_SHARED_SECRET` for an extra header check between Unity and the backend.
