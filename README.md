# AI Discord Bot + Web Dashboard

Discord bot tích hợp AI (Claude & Gemini) kèm web dashboard quản lý.

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Repo                       │
│                   branch: ai                         │
└──────────────────────┬──────────────────────────────┘
                       │ git push
                       ▼
┌─────────────────────────────────────────────────────┐
│           GitHub Actions (CI/CD)                     │
│  deploy-ai.yml: SSH → git pull → npm install → pm2  │
└──────────────────────┬──────────────────────────────┘
                       │ SSH deploy
                       ▼
┌─────────────────────────────────────────────────────┐
│              Server (cPanel/VPS)                     │
│  ~/ai.hpdev.name.vn/                                 │
│                                                      │
│  pm2 → node app.js                                   │
│           ├── Bot (discord.js v14)                   │
│           │     └── Slash command /ai                │
│           └── Dashboard (Express)                    │
│                 └── http://ai.hpdev.name.vn          │
└─────────────────────────────────────────────────────┘
```

---

## Cấu trúc file

```
├── app.js                  # Entry point
├── bot/
│   └── index.js            # Discord bot (discord.js v14)
├── ai/
│   ├── claude.js           # Anthropic Claude API
│   └── gemini.js           # Google Gemini API
├── db/
│   └── index.js            # MariaDB (mysql2)
├── dashboard/
│   ├── server.js           # Express web server
│   └── views/
│       ├── login.html      # Trang đăng nhập
│       └── dashboard.html  # Dashboard chính
├── scripts/
│   └── register.js         # Đăng ký slash commands (chạy 1 lần)
├── .env                    # Credentials (không commit)
├── .env.example            # Template env
└── .github/workflows/
    └── deploy-ai.yml       # CI/CD pipeline
```

---

## Flow hoạt động

### Discord Bot
```
User gõ /ai <câu hỏi>
    → Discord gửi interaction đến bot
    → Bot đọc active_model từ DB
    → Gọi Claude hoặc Gemini API
    → Lưu lịch sử vào MariaDB
    → Reply kết quả cho user
```

### Web Dashboard
```
Admin vào ai.hpdev.name.vn
    → Login bằng DASHBOARD_PASSWORD
    → Tab Chat: chat trực tiếp với AI
    → Tab Config: đổi model mặc định, system prompt, Claude base URL
    → Tab History: xem lịch sử chat Discord
    → Tab Stats: thống kê số lượng tin nhắn
```

### CI/CD Deploy
```
git push origin ai
    → GitHub Actions trigger
    → SSH vào server
    → git pull origin ai
    → npm install
    → pm2 restart app
```

---

## Cài đặt lần đầu

### 1. Clone và cài dependencies
```bash
git clone <repo> && cd ai.hpdev.name.vn
npm install
```

### 2. Tạo file .env
```bash
cp .env.example .env
nano .env
```

```env
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...

GEMINI_KEY=...
CLAUDE_KEY=...
CLAUDE_BASE_URL=https://proxy-api.example.com/

DB_HOST=localhost
DB_USER=...
DB_PASSWORD=...
DB_NAME=...

DASHBOARD_PASSWORD=...
DASHBOARD_SECRET=...
DASHBOARD_PORT=3000
```

### 3. Đăng ký slash commands (1 lần duy nhất)
```bash
node scripts/register.js
```

### 4. Chạy app
```bash
# Development
node app.js

# Production (pm2)
pm2 start app.js --name app
pm2 save
```

---

## GitHub Secrets cần thiết

| Secret | Mô tả |
|---|---|
| `SSH_HOST` | IP hoặc hostname server |
| `SSH_PORT` | Port SSH (mặc định 22) |
| `SSH_USER` | Username SSH |
| `SSH_PRIVATE_KEY` | Private key SSH |
| `SSH_PASSPHRASE` | Passphrase của SSH key (nếu có) |

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Discord Bot | discord.js v14 |
| AI Models | Claude Sonnet + Gemini 2.5 Flash |
| Database | MariaDB/MySQL (mysql2) |
| Web Server | Express.js |
| Auth | express-session + bcryptjs |
| Process Manager | pm2 |
| CI/CD | GitHub Actions + appleboy/ssh-action |
