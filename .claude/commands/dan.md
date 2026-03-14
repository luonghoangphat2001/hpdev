# /dan — Skill trợ lý phát triển cho project dan_ai

Bạn là trợ lý phát triển chuyên biệt cho project **dan_ai** — Discord/Telegram AI bot + web dashboard viết bằng Node.js.

## Kiến trúc project (cập nhật)

```
src/
├── bots/
│   ├── BaseBot.js          # "đần" prefix, model switch, schedule intent detection
│   ├── DiscordBot.js       # slash /ai /myschedule /delschedule /setchannelschedule
│   └── TelegramBot.js      # telegraf v4, /ai /model /setmodel
├── services/
│   ├── AIService.js        # provider selection, history, 429→gemini fallback
│   ├── SchedulerService.js # 60s tick, Gemini parse, bulk regex, edit, notify
│   └── ai/                 # AIFactory, AIProvider, Gemini/Claude/ChatGPT providers
├── models/
│   ├── Database.js             # mysql2 pool (dateStrings:true), auto migrations
│   ├── ConfigRepository.js     # in-memory cache, seeds defaults
│   ├── ConversationRepository.js
│   ├── ScheduleRepository.js   # CRUD + findUpcoming/findByDate/findByKeyword/update
│   └── UserRepository.js
├── server/DashboardServer.js   # Express app factory
├── controllers/                # Auth/Chat/Config/History/Log/Stats/UserController
├── routes/                     # api.js (incl. /logs), web.js
├── utils/
│   ├── Logger.js               # console.* → logs/YYYY-MM-DD.log
│   └── TimeUtils.js            # timezone-safe date ops (no Date obj for DB strings)
└── middleware/
Entry: app.js (dashboard/Passenger) | bot.js (bots/pm2)
DB: MariaDB/MySQL, dateStrings:true, utf8mb4
```

## Argument nhận vào: `$ARGUMENTS`

---

## Chế độ xử lý

### 1. Không có argument hoặc `analyze`
Phân tích toàn bộ project:
- Đọc các file chính trong `src/`
- Liệt kê features đã có (chat AI, model switching, schedule/reminder, logging, dashboard, stats)
- Chỉ ra technical debt, điểm cần cải thiện
- Đề xuất roadmap, hỏi user muốn làm gì tiếp

### 2. `feature <tên>`
Lên kế hoạch + implement feature mới:

1. **Khám phá** — đọc file liên quan
2. **Phân tích** — hiểu pattern (class-based, `#` private, constructor injection, raw SQL)
3. **Thiết kế** — trình bày plan (files tạo/sửa, DB schema) trước khi code
4. **Implement** theo pattern:
   - Model: `class XRepository { #db; constructor(db){...} }`
   - Service: inject qua constructor
   - Controller: `async handle(req, res)` + try/catch + JSON
   - Bot: thêm vào `#registerHandlers()`
   - DB: `CREATE TABLE IF NOT EXISTS` hoặc `#addColumnIfMissing` trong `Database.js`
5. **Hướng dẫn** test + deploy

### 3. `schedule` / `reminder` / `timetable`
Hệ thống lịch **đã implemented**. Xem `/dan-schedule` để debug hoặc mở rộng.

Tóm tắt đã có:
- Thêm lịch: AI parse (Gemini) hoặc bulk regex format `Ngày DD/MM/YYYY học … giờ HH:MM-HH:MM`
- Xem lịch: tất cả / hôm nay / ngày cụ thể
- Chỉnh sửa: Gemini parse tìm theo keyword hoặc ID
- Xóa: theo ID
- Notify: Discord channel mỗi 60s, gửi `⏰ Nhắc lịch!`
- Timezone: `schedule_timezone` config (default `Asia/Ho_Chi_Minh`)

### 4. `ai-support`
Nâng cấp AI — các tính năng đề xuất:
1. **Context dài hơn** — hiện lấy 10 messages, thêm summarization
2. **System prompt per user** — persona/tone riêng từng user
3. **Tool calls** — AI gọi hàm tìm lịch, đặt nhắc, tra thông tin
4. **User memory** — nhớ tên, sở thích, lịch học qua DB
5. **Intent detection nâng cao** — phân biệt hỏi AI / đặt lịch / báo cáo

### 5. `logging`
Hệ thống log **đã implemented**:
- `Logger.init()` ở boot → patches `console.*` → `logs/YYYY-MM-DD.log`
- API admin: `GET /api/logs` (list), `GET /api/logs/:filename` (download)
- Log format: `[2026-03-15 08:00:01.123] [INFO] [Discord] Message | user=...`

### 6. `status`
Kiểm tra nhanh:
- Đọc `package.json`
- Kiểm tra `.env` có đủ keys không
- Xem log file mới nhất trong `logs/`
- Liệt kê TODO/FIXME trong code

---

## Quy tắc khi viết code

1. `'use strict'` đầu file
2. Private fields `#` (không dùng `_` prefix)
3. Constructor injection cho dependencies
4. DB migration tự động trong `Database.js#createTables()`
5. `utf8mb4` cho tất cả table mới
6. Không ORM — raw SQL với `mysql2/promise`
7. **`dateStrings: true`** trong pool — DATETIME trả về string, không phải Date object
8. **Không dùng `new Date(dbStr).toISOString/toTimeString`** cho schedule data — dùng `TimeUtils`
9. Error handling: catch + log `[ClassName]` prefix + reply thân thiện
10. Config qua DB `config` table, đọc qua `ConfigRepository`
11. Tiếng Việt cho bot response (tone "đần" — thân thiện, hơi ngốc nghếch)
12. Commit message format: `ai <verb> <feature>` (vd: `ai add schedule edit feature`)

---

Bắt đầu xử lý argument: **$ARGUMENTS**
