# Wakuwaku Discovery

Bilingual kid-friendly discovery quiz app built with React + Vite.

## What it includes
- 4 learning worlds: Science, Geography, History, Art
- world/module progression with stars and explorer rank
- local progress saving
- manual backup/restore code
- cloud save/load endpoints backed by Upstash Redis

## Commands
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Project structure
- `src/App.jsx` — main app flow and screens
- `src/ParentPanel.jsx` — parent/save-progress modal
- `src/progress.js` — shared progress schema, normalization, storage helpers, streak logic
- `src/questionData*.js` — world/module question content
- `api/save.js` — cloud save endpoint
- `api/load.js` — cloud load endpoint
- `api/_security.js` — CORS, rate limiting, auth helpers

## Environment
Cloud save/load expects:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- optional `ALLOWED_ORIGINS` comma-separated list

Without Upstash credentials, the local app still works with browser-local progress and manual backup codes.

## Recent maintenance notes
- Parent/save modal extracted from `App.jsx` into `src/ParentPanel.jsx`
- shared progress normalization added so browser restore, cloud save, and cloud load use the same schema validation
