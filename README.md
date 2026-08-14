# OpenClaw

Service Node.js hỗ trợ Đần AI: web search, HTTP fetch, crawl bằng Playwright, browser automation và lớp orchestrator cho workflow/approval/CEO dashboard. Service lắng nghe mặc định tại `http://localhost:4000`.

## Khởi động

```bash
cd ai_dan/openclaw
npm ci
cp .env.example .env
npx playwright install chromium
npm run migrate
npm start
```

`npm start` chạy `node src/server.js`. Có thể chạy `node server.js` hoặc dùng PM2:

```bash
pm2 start server.js --name openclaw
pm2 restart openclaw --update-env
```

Chạy test:

```bash
npm test -- --runInBand
```

## Authentication

- `GET /health` không yêu cầu authentication.
- Các endpoint còn lại yêu cầu `Authorization: Bearer <API_SECRET>`.
- `POST /orchestrator/v1/events` dùng chữ ký webhook (`x-openclaw-timestamp`, `x-openclaw-delivery-id`, `x-openclaw-key-id`, `x-openclaw-signature`), không dùng Bearer. Cần cấu hình `ECOMMERCE_WEBHOOK_KEYS_JSON`; nếu chưa cấu hình endpoint trả `503`.

## API chính

### Web tools

| Method | Path | Body tối thiểu | Mục đích |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/search` | `{ "query": "...", "num": 5 }` | Search qua Serper |
| POST | `/fetch` | `{ "url": "...", "method": "GET", "headers": {}, "data": null }` | HTTP proxy |
| POST | `/crawl` | `{ "url": "..." }` | Render Chromium và lấy text/HTML |
| POST | `/automate` | `{ "url": "...", "steps": [], "screenshot": true }` | Click/fill/wait/screenshot |

`/search`, `/fetch`, `/crawl` và `/automate` đều là `POST` tại đúng path trên. `steps[].action` của automate hiện hỗ trợ `click`, `fill`, `wait`.

### Orchestrator

Các nhóm route hiện có:

```text
/orchestrator/v1/events
/orchestrator/v1/metrics
/orchestrator/v1/capabilities
/orchestrator/v1/approvals/:approvalId/decision
/orchestrator/v1/control/workflows/:workflowId/control
/orchestrator/v1/control/workflows/:workflowId/feedback
/orchestrator/v1/control/events/:eventId/replay
/orchestrator/v1/commands/:commandName
/orchestrator/v1/exceptions
/orchestrator/v1/exceptions/refresh
/orchestrator/v1/exceptions/:exceptionId/acknowledge
/orchestrator/v1/dashboard/overview
/orchestrator/v1/dashboard/company/today-metrics
/orchestrator/v1/dashboard/company/metrics
/orchestrator/v1/dashboard/agents
/orchestrator/v1/dashboard/workflows
```

Các route orchestrator cần Bearer token và database riêng của OpenClaw. Xem catalog/schema trong `src/contracts/` trước khi tích hợp request mới.

## Cấu trúc source

```text
src/app.js                       # Express app và route registration
src/server.js                    # HTTP server + daily schedulers
src/config/env.js                # Chuẩn hóa process.env
src/routes, controllers/         # HTTP boundary
src/services/                    # Search/fetch/crawl/automate/logging
src/domain/                      # Policy, workflow state machine, agents
src/application/                 # Use cases, adapters, budget/approval services
src/infrastructure/              # MySQL, HTTP clients, validation, metrics
src/contracts/                   # API/event/command/policy schemas
scripts/migrate.js               # Migration runner
test/                            # Jest tests
```

## Biến môi trường

Copy `.env.example` và chỉ bật các feature cần dùng:

| Nhóm | Biến chính |
|---|---|
| Server/search | `PORT`, `API_SECRET`, `SERPER_KEY` |
| Webhook | `ECOMMERCE_WEBHOOK_KEYS_JSON` |
| Ecommerce SSOT | `ECOMMERCE_API_URL`, `ECOMMERCE_AGENT_CODE`, `ECOMMERCE_AGENT_TOKEN` |
| Đần AI | `DAN_AI_API_URL`, `DAN_AI_API_SECRET`, `DAN_AI_API_TIMEOUT_MS` |
| Scheduler | `DAILY_REPORT_*`, `CEO_DAILY_BRIEF_*` |
| Orchestrator DB | `ORCHESTRATOR_DB_HOST`, `ORCHESTRATOR_DB_PORT`, `ORCHESTRATOR_DB_NAME`, `ORCHESTRATOR_DB_USER`, `ORCHESTRATOR_DB_PASSWORD`, `ORCHESTRATOR_DB_POOL_*` |
| Release/telemetry | `ORCHESTRATOR_PRODUCTION_ENABLED`, `INTELLIGENCE_*` |

Không commit `.env`, webhook key hoặc token. `ORCHESTRATOR_PRODUCTION_ENABLED`, `DAILY_REPORT_ENABLED` và `CEO_DAILY_BRIEF_ENABLED` mặc định tắt.

## Deploy

`.github/workflows/deploy.yml` chạy trên `main`, `ai` và `openclaw`. Nhánh `openclaw` cập nhật `/home/hpdev/openclaw.hpdev.name.vn`, chạy `npm ci`, `npm run migrate`, cài Chromium và restart PM2 process `openclaw`. Nhánh `ai` deploy bot/dashboard Đần AI; `main` deploy website production.

Log mặc định được ghi bởi logger service; khi chạy PM2 dùng `pm2 logs openclaw` để xem log process.
