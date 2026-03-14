# /dan-schedule — Hệ thống lịch nhắc nhở dan_ai (ĐÃ IMPLEMENT)

Skill này dùng để **mở rộng hoặc debug** hệ thống schedule đã có sẵn.

## Argument: `$ARGUMENTS`

---

## Trạng thái hiện tại (IMPLEMENTED)

Hệ thống schedule đã hoàn chỉnh với các tính năng:

### Files đã tạo
| File | Mô tả |
|------|-------|
| `src/models/ScheduleRepository.js` | CRUD: create, findByUser, findByDate, findByKeyword, findUpcoming(nowStr), markFired, update, delete |
| `src/services/SchedulerService.js` | 60s tick, AI parse (Gemini), bulk parse (regex), parseAndUpdate, notifications |
| `src/utils/TimeUtils.js` | Timezone-safe: nowString, todayString, display, timeOf, dateOf, addDays, promptNow |

### Files đã sửa
- `Database.js` — bảng `schedules` + `dateStrings: true`
- `ConfigRepository.js` — seed `schedule_timezone`, `schedule_discord_channel_id`
- `BaseBot.js` — intent detection: thêm/xem/xóa/chỉnh sửa lịch
- `DiscordBot.js` — handlers đầy đủ + slash commands
- `scripts/register.js` — `/myschedule`, `/delschedule`, `/setchannelschedule`
- `bot.js` — wire SchedulerService + inject Discord client sau clientReady

### Schema DB
```sql
CREATE TABLE IF NOT EXISTS schedules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(32)  NOT NULL,
  username    VARCHAR(64),
  platform    VARCHAR(16)  DEFAULT 'discord',
  channel_id  VARCHAR(32),
  title       VARCHAR(255) NOT NULL,
  remind_at   DATETIME     NOT NULL,  -- stored in schedule_timezone (default Asia/Ho_Chi_Minh)
  repeat_type ENUM('none','daily','weekly') DEFAULT 'none',
  is_active   TINYINT      DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_remind (remind_at, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Cách bot nhận lịch
```
# Một lịch (Gemini AI parse)
đần thêm lịch thứ 2 8h học Toán

# Nhiều lịch cùng lúc (regex parse, không gọi AI)
đần thêm lịch
Ngày 15/03/2026 học Lập trình hướng đối tượng giờ 05:45 - 08:45
Ngày 16/03/2026 học Kinh tế chính trị Mác - Lênin giờ 11:00 - 14:00

# Xem lịch
đần xem lịch              → tất cả upcoming
đần xem lịch hôm nay
đần xem lịch ngày 15/03/2026

# Chỉnh sửa (Gemini parse)
đần chỉnh sửa lịch Toán 1 ngày 14/03/2026 8h30pm
đần sửa lịch #5 ngày mai 9h

# Xóa
đần xóa lịch #5
/delschedule id:5
```

### Timezone rules
- Lưu DB theo `schedule_timezone` config (default `Asia/Ho_Chi_Minh`)
- Tick so sánh bằng `TimeUtils.nowString(tz)` → không phụ thuộc MySQL timezone
- `mysql2` dùng `dateStrings: true` → DATETIME trả về string, không phải Date object

### Notification format
```
⏰ Nhắc lịch!
👤 @username
📌 Lập trình hướng đối tượng
🔁 Một lần (CN 05:45)
```

---

## Chế độ xử lý argument

- `status` → kiểm tra DB có bảng `schedules` chưa, đọc config timezone + channel
- `debug` → xem log `[Scheduler]` gần nhất, kiểm tra `findUpcoming` có trả về đúng không
- `extend <tính năng>` → lên plan mở rộng (vd: Telegram support, monthly repeat, remind trước X phút)
- `timezone` → hướng dẫn đổi timezone qua config `schedule_timezone`
- `bulk-format` → hiển thị lại format bulk import thời khoá biểu

---

## Quy tắc khi sửa schedule system

1. **Không dùng `new Date(dbStr)`** để parse datetime từ DB — dùng `TimeUtils.dateOf/timeOf/display`
2. **Không dùng `toISOString/toTimeString/toLocaleString`** trên schedule data
3. **Không dùng `NOW()`** trong SQL schedule queries — dùng `findUpcoming(TimeUtils.nowString(tz))`
4. **`addDays`** dùng `TimeUtils.addDays(dbStr, n)` — pure date arithmetic, tz-independent
5. **Gemini prompt** phải kèm `TimeUtils.promptNow(tz)` để AI biết múi giờ hiện tại
