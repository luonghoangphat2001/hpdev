# OpenClaw

Web search, crawl, fetch, and browser automation microservice.

## Endpoints

All endpoints require `Authorization: Bearer <API_SECRET>`.

| Method | Path | Description |
|---|---|---|
| GET | /health | Health check (no auth) |
| POST | /search | Google Custom Search |
| POST | /fetch | Proxy HTTP request |
| POST | /crawl | Playwright page crawl (text + HTML) |
| POST | /automate | Playwright automation + optional screenshot |

## Setup

```bash
cp .env.example .env
# fill in API_SECRET, GOOGLE_CX, GOOGLE_KEY
npm install
npx playwright install-deps chromium
npx playwright install chromium
npm start
```

## Environment

| Variable | Description |
|---|---|
| PORT | Server port (default: 4000) |
| API_SECRET | Bearer token for auth |
| GOOGLE_CX | Google Custom Search engine ID |
| GOOGLE_KEY | Google API key |
