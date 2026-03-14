'use strict';

/**
 * Timezone-safe date utilities.
 *
 * Philosophy: DB stores datetimes in the configured local timezone (e.g. Asia/Ho_Chi_Minh).
 * We NEVER rely on the server's OS timezone or MySQL's NOW() for display/comparison.
 * All operations go through the configured timezone via Intl APIs.
 */
class TimeUtils {
  /**
   * Get the current datetime as "YYYY-MM-DD HH:MM:SS" in the given IANA timezone.
   * Used to compare against DB values (which are also stored in that timezone).
   * @param {string} tz  IANA timezone e.g. "Asia/Ho_Chi_Minh"
   * @returns {string}
   */
  static nowString(tz = 'Asia/Ho_Chi_Minh') {
    return TimeUtils.#toDatetimeString(new Date(), tz);
  }

  /**
   * Get today's date as "YYYY-MM-DD" in the given timezone.
   * @param {string} tz
   * @returns {string}
   */
  static todayString(tz = 'Asia/Ho_Chi_Minh') {
    return TimeUtils.nowString(tz).slice(0, 10);
  }

  /**
   * Format a DB datetime string ("YYYY-MM-DD HH:MM:SS") for Discord display.
   * Parses the components directly — no timezone conversion since DB already stores local time.
   * @param {string} dbStr  e.g. "2026-03-15 05:45:00"
   * @returns {string}  e.g. "15/03/2026 05:45"
   */
  static display(dbStr) {
    const s = String(dbStr);
    const yyyy = s.slice(0, 4);
    const mm   = s.slice(5, 7);
    const dd   = s.slice(8, 10);
    const hhmm = s.slice(11, 16) || '00:00';
    return `${dd}/${mm}/${yyyy} ${hhmm}`;
  }

  /**
   * Get just the "HH:MM" part from a DB datetime string.
   * @param {string} dbStr
   * @returns {string}
   */
  static timeOf(dbStr) {
    return String(dbStr).slice(11, 16) || '00:00';
  }

  /**
   * Get just the "YYYY-MM-DD" part from a DB datetime string.
   * @param {string} dbStr
   * @returns {string}
   */
  static dateOf(dbStr) {
    return String(dbStr).slice(0, 10);
  }

  /**
   * Add N days to a DB datetime string, keeping the time component unchanged.
   * Pure arithmetic — completely timezone-independent.
   * @param {string} dbStr  "YYYY-MM-DD HH:MM:SS"
   * @param {number} days
   * @returns {string}  "YYYY-MM-DD HH:MM:SS"
   */
  static addDays(dbStr, days) {
    const s      = String(dbStr);
    const timePart = s.slice(10) || ' 00:00:00'; // " HH:MM:SS"
    const [yyyy, mm, dd] = s.slice(0, 10).split('-').map(Number);
    // Use UTC constructor to avoid DST surprises
    const d = new Date(Date.UTC(yyyy, mm - 1, dd + days));
    const newDate = d.toISOString().slice(0, 10);
    return newDate + timePart;
  }

  /**
   * Format current date/time for Gemini prompt ("YYYY-MM-DD HH:MM:SS (tz)").
   * @param {string} tz
   * @returns {string}
   */
  static promptNow(tz = 'Asia/Ho_Chi_Minh') {
    return `${TimeUtils.nowString(tz)} (${tz})`;
  }

  // ─── private ───────────────────────────────────────────────────────────────

  /**
   * Convert a JS Date to "YYYY-MM-DD HH:MM:SS" in the given IANA timezone.
   * @param {Date} date
   * @param {string} tz
   * @returns {string}
   */
  static #toDatetimeString(date, tz) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year:   'numeric',
      month:  '2-digit',
      day:    '2-digit',
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const p = {};
    for (const { type, value } of parts) p[type] = value;

    // Some engines return "24" for midnight in hour12:false mode
    const h = p.hour === '24' ? '00' : p.hour;
    return `${p.year}-${p.month}-${p.day} ${h}:${p.minute}:${p.second}`;
  }
}

module.exports = TimeUtils;
