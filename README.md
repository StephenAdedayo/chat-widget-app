# Chat Widget (React + Express)

A floating chat button/panel that talks to Claude (or any Anthropic-compatible model) through a small Express backend. Tested end-to-end — install, add your API key, and run.

## Structure

```
chat-widget-app/
├── server/          Express API (/api/chat, /api/health)
└── client/          Vite + React app with the ChatWidget component + a demo page
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste your real ANTHROPIC_API_KEY
npm run dev
```

Runs on `http://localhost:3001`. Check it's alive: `curl http://localhost:3001/api/health`.

## 2. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`. Vite's dev proxy forwards `/api/*` to the server, so no CORS setup needed in dev.

Open the URL, click the 💬 button bottom-right, and chat.

## 3. Using the widget on a real site

`client/src/ChatWidget.jsx` is a single self-contained component (no CSS files, no extra deps beyond React). To use it elsewhere:

1. Copy `ChatWidget.jsx` into your project.
2. Mount it once near the root of your app: `<ChatWidget apiEndpoint="/api/chat" />`.
3. Point `apiEndpoint` at wherever you deploy the Express server (or adapt `server/index.js` into a serverless function / existing backend route).

## 4. Deploying

- **Server**: deploy `server/` anywhere that runs Node (Render, Railway, Fly.io, a VPS). Set `ANTHROPIC_API_KEY` as an environment variable there — never ship it in client code.
- **Client**: `npm run build` in `client/` produces a static `dist/` folder you can host anywhere (Vercel, Netlify, S3). Update `apiEndpoint` to the deployed server's full URL, and add proper CORS origins in `server/index.js` (currently wide open with `cors()` for local dev).

## Notes on what's included

- Basic in-memory rate limiting per IP (20 req/min) — swap for Redis in production.
- Server strips any fields except `role`/`content` from incoming messages before forwarding to Anthropic.
- Errors from the AI service are caught and shown inline in the widget instead of failing silently.
- No chat persistence — history resets on page reload. Add `localStorage` or a DB-backed session if you need it to survive refreshes.
