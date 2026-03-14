# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branch Architecture

This repo has two distinct purposes split across branches:

- **`main`** — WordPress custom theme, deploys to `/home/hpdev/public_html`
- **`ai`** — Discord/Telegram bot + web dashboard, deploys to `~/ai.hpdev.name.vn`

You are currently working on the **`ai`** branch.

## Running the App

```bash
# Web dashboard (Phusion Passenger in prod, direct node locally)
node app.js

# Bots only (pm2 in prod)
node bot.js

# Register Discord slash commands (one-time, after adding new commands)
node scripts/register.js

# Install dependencies
npm install
```

No build step. Node.js v19 on production.

## Application Architecture

Two separate entry points with shared internals:

| Entry | Runs | Managed by |
|---|---|---|
| `app.js` | Web dashboard only | Phusion Passenger (restart via `tmp/restart.txt`) |
| `bot.js` | Discord + Telegram bots only | pm2 (`pm2 restart bot`) |

### Source layout (`src/`)

```
src/
├── bots/
│   ├── BaseBot.js          # "đần" prefix, model switch, schedule intent detection
│   ├── DiscordBot.js       # discord.js v14; slash /ai /myschedule /delschedule /setchannelschedule
│   └── TelegramBot.js      # telegraf v4
├── services/
│   ├── AIService.js        # Provider selection, history, persistence; 429→gemini fallback
│   ├── SchedulerService.js # 60s tick, Gemini AI parse, Discord notifications, edit/update
│   └── ai/
│       ├── AIFactory.js
│       ├── AIProvider.js
│       ├── GeminiProvider.js
│       ├── ClaudeProvider.js
│       └── ChatGPTProvider.js
├── models/
│   ├── Database.js             # Singleton MariaDB/MySQL pool (mysql2, dateStrings:true)
│   ├── ConfigRepository.js     # In-memory cache over `config` table; seeds defaults on init
│   ├── ConversationRepository.js
│   ├── ScheduleRepository.js   # CRUD + findUpcoming(nowStr) + findByDate + findByKeyword
│   └── UserRepository.js
├── server/
│   └── DashboardServer.js      # Express app factory
├── controllers/
│   └── Auth/Chat/Config/History/Log/Stats/UserController.js
├── routes/
│   ├── api.js                  # incl. GET /api/logs, GET /api/logs/:filename
│   └── web.js
├── utils/
│   ├── Logger.js               # Patches console.* → logs/YYYY-MM-DD.log (daily rotation)
│   └── TimeUtils.js            # Timezone-safe: nowString, display, addDays (no Date obj)
└── middleware/
```

### Data flow — AI chat

```
User message (Discord /ai or Telegram "đần …")
  → DiscordBot / TelegramBot
  → BaseBot._handleDanCommand()   # model switch or strip prefix; returns isSchedule flag
  → AIService.chat()              # reads active_model from ConfigRepository
  → AIFactory.create(model)       # GeminiProvider | ClaudeProvider | ChatGPTProvider
  → persist to ConversationRepository
  → reply
```

### Data flow — Schedule system

```
"đần thêm lịch …"  →  BaseBot (isSchedule:true)  →  DiscordBot#replyScheduleCreate
  → SchedulerService.parseAndCreate()   # Gemini AI parse → { title, remind_at, repeat_type }
  → ScheduleRepository.create()         # INSERT INTO schedules

"đần thêm lịch\nNgày DD/MM/YYYY học … giờ HH:MM-HH:MM\n..."  →  bulk mode
  → SchedulerService.parseAndCreateBulk()   # regex parse, no AI call

"đần xem lịch hôm nay / ngày DD/MM"  →  SchedulerService.listByDate()
"đần chỉnh sửa lịch …"               →  SchedulerService.parseAndUpdate()
"đần xóa lịch #ID"                   →  SchedulerService.deleteSchedule()

[every 60s — SchedulerService#tick()]
  → ScheduleRepository.findUpcoming(nowStr)   # nowStr = TimeUtils.nowString(tz), not MySQL NOW()
  → channel.send(reminder message)
  → markFired: deactivate (one-shot) or advance remind_at (daily/weekly)
```

### Per-platform models

Config keys `discord_active_model` / `telegram_active_model` override `active_model`. Switching via "chuyển model sang claude/gemini/chatgpt" is handled in `BaseBot`.

### Logging

`Logger.init()` is called at boot in both `bot.js` and `app.js`. It patches `console.log/warn/error` to write to `logs/YYYY-MM-DD.log` (daily rotation). Log files are downloadable via `GET /api/logs/:filename` (admin only).

## DB Schema (key tables)

```sql
schedules (id, user_id, username, platform, channel_id, title,
           remind_at DATETIME, repeat_type ENUM('none','daily','weekly'),
           is_active TINYINT, created_at DATETIME)
-- remind_at stored in configured local timezone (schedule_timezone config key)
```

## Config keys (seeded in ConfigRepository)

| Key | Default | Purpose |
|-----|---------|---------|
| `active_model` | `gemini` | Global default model |
| `discord_active_model` | `claude` | Discord model override |
| `telegram_active_model` | `gemini` | Telegram model override |
| `gemini_model` | `models/gemini-2.5-flash` | Gemini version |
| `claude_model` | `claude-sonnet-4-6` | Claude version |
| `chatgpt_model` | `gpt-4o` | ChatGPT version |
| `schedule_timezone` | `Asia/Ho_Chi_Minh` | Timezone for schedule storage & display |
| `schedule_discord_channel_id` | `''` | Channel for automatic reminders |

## Timezone rules

- All schedule datetimes stored **in configured local timezone** (not UTC)
- Scheduler tick compares using `TimeUtils.nowString(tz)` passed to SQL — never `NOW()`
- `mysql2` pool uses `dateStrings: true` so DATETIME columns return as strings
- Display uses `TimeUtils.display(dbStr)` which slices string directly — no Date conversion

## Discord slash commands

| Command | Description |
|---------|-------------|
| `/ai` | Chat with AI |
| `/myschedule` | View your upcoming schedules |
| `/delschedule id:<n>` | Delete a schedule by ID |
| `/setchannelschedule channel:#ch` | Set notification channel (admin) |

## Credentials (`.env`)

```
DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID
TELEGRAM_TOKEN
GEMINI_KEY
CLAUDE_KEY, CLAUDE_BASE_URL
OPENAI_KEY
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
ADMIN_USER, DASHBOARD_PASSWORD, DASHBOARD_SECRET
DASHBOARD_PORT   # default 3000
```

Copy from `.env.example`. `CLAUDE_BASE_URL` defaults to `https://proxy-api.hdwebsoft.co/`.

## Deployment

Push to `ai` branch triggers `.github/workflows/deploy-ai.yml`:

```
SSH → git pull origin ai → npm install
→ touch tmp/restart.txt        (Phusion Passenger restarts app.js)
→ pm2 restart bot || pm2 start bot.js --name bot
```

After adding new Discord slash commands, run on server:
```bash
node scripts/register.js
```

GitHub Secrets needed: `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PASSPHRASE`.
