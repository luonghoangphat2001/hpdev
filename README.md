# OpenClaw

Microservice hỗ trợ AI bot — tìm kiếm web, crawl trang, proxy HTTP, và tự động hóa trình duyệt.

Chạy độc lập tại `http://localhost:4000`, được gọi từ bot `dan_ai` qua shared Bearer token.

## Endpoints

Tất cả endpoint (trừ `/health`) yêu cầu header: `Authorization: Bearer <API_SECRET>`

## Cấu trúc source

```text
src/
├── app.js
├── server.js
├── routes/
├── controllers/
├── services/
├── middlewares/
├── validations/
└── config/
```

- `routes`: khai báo endpoint và bind controller.
- `controllers`: nhận request, validate input, gọi service, trả response.
- `services`: chứa business logic và tích hợp external service như Serper, axios, Playwright.
- `validations`: chuẩn hóa input và báo lỗi request.
- `middlewares`: auth, async/error handler.
- `config`: đọc cấu hình môi trường.

### `GET /health`
Kiểm tra server còn sống.
```json
{ "status": "ok" }
```

---

### `POST /search`
Tìm kiếm web qua [Serper.dev](https://serper.dev) (Google Search API — 2500 queries/tháng miễn phí).

**Request:**
```json
{ "query": "tour du lịch Hà Nội", "num": 5 }
```

**Response:**
```json
{
  "results": [
    { "title": "...", "link": "https://...", "snippet": "..." }
  ]
}
```

---

### `POST /fetch`
Proxy HTTP request — gọi bất kỳ URL nào từ phía server.

**Request:**
```json
{ "url": "https://example.com/api", "method": "GET", "headers": {}, "data": null }
```

**Response:**
```json
{ "status": 200, "headers": {}, "body": "..." }
```

---

### `POST /crawl`
Crawl trang web bằng Playwright (Chromium headless) — trả về text + HTML sau khi JS render.

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{ "url": "...", "title": "...", "text": "...", "html": "..." }
```
> `text` tối đa 50,000 ký tự, `html` tối đa 200,000 ký tự.

---

### `POST /automate`
Tự động thao tác trình duyệt: click, fill form, chờ, chụp ảnh màn hình.

**Request:**
```json
{
  "url": "https://example.com",
  "steps": [
    { "action": "fill", "selector": "#search", "value": "keyword" },
    { "action": "click", "selector": "button[type=submit]" },
    { "action": "wait", "ms": 2000 }
  ],
  "screenshot": true
}
```

**Response:**
```json
{ "url": "...", "screenshot": "<base64 PNG>" }
```

> `action` hỗ trợ: `click`, `fill`, `wait`

---

## Cài đặt

```bash
git clone <repo> openclaw.hpdev.name.vn
cd openclaw.hpdev.name.vn
git checkout openclaw

cp .env.example .env
# Chỉnh sửa .env (xem bên dưới)

npm install
npx playwright install-deps chromium
npx playwright install chromium

npm start
# hoặc: pm2 start server.js --name openclaw
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `PORT` | Không | Port server (mặc định: `4000`) |
| `API_SECRET` | Có | Bearer token — phải khớp với `OPENCLAW_SECRET` bên bot |
| `SERPER_KEY` | Có (cho /search) | API key từ [serper.dev](https://serper.dev/signup) — free 2500 queries/tháng |

**.env mẫu:**
```env
PORT=4000
API_SECRET="your-secret-uuid"
SERPER_KEY="your-serper-api-key"
```

## Deploy (pm2)

```bash
# Lần đầu
pm2 start server.js --name openclaw

# Sau khi git pull
pm2 restart openclaw --update-env
```

## Tích hợp với dan_ai bot

Bot đọc 2 biến môi trường:
- `OPENCLAW_URL=http://localhost:4000`
- `OPENCLAW_SECRET=<giống API_SECRET trên>`

Khi user nhắn có intent tìm kiếm, bot tự động gọi `POST /search` và trả kết quả.
