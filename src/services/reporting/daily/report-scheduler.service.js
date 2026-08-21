/**
 * @fileoverview report-scheduler.service - Provides report-scheduler functionality.
 */
'use strict';

/**
 * ReportSchedulerService
 * Manages report scheduler logic.
 */
class ReportSchedulerService {
  constructor({
    aggregator,
    timezone = 'Asia/Ho_Chi_Minh',
    reportTime = '18:00',
    clock = () => new Date(),
    intervalMs = 60000,
  }) {
    this.aggregator = aggregator;
    this.timezone = timezone;
    this.reportTime = reportTime;
    this.clock = clock;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.lastSuccessfulDate = null;
  }

  /**
   * start - Executes start.
   * @returns {*} Result of operation.
   */
  start() {
    if (this.timer) return;
    this.tick().catch((error) =>
      console.error('[DailyReport] initial tick failed:', error.message));
    this.timer = setInterval(
      () => this.tick().catch((error) =>
        console.error('[DailyReport] tick failed:', error.message)),
      this.intervalMs,
    );
  }

  /**
   * stop - Executes stop.
   * @returns {*} Result of operation.
   */
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * tick - Asynchronously executes tick.
   * @returns {*} Promise resolving result.
   */
  async tick() {
    const now = this.clock();
    const local = this.#localParts(now);
    if (local.time < this.reportTime || this.lastSuccessfulDate === local.date) {
      return { status: 'skipped', reportDate: local.date };
    }

    const { from, to } = this.#utcDayBounds(local.date);
    const result = await this.aggregator.aggregateAndNotify({
      reportDate: local.date,
      from,
      to,
    });
    this.lastSuccessfulDate = local.date;
    return { status: 'sent', reportDate: local.date, ...result };
  }

  #localParts(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type) => parts.find((part) => part.type === type).value;
    return {
      date: `${value('year')}-${value('month')}-${value('day')}`,
      time: `${value('hour')}:${value('minute')}`,
    };
  }

  #utcDayBounds(localDate) {
    const noonUtc = new Date(`${localDate}T12:00:00.000Z`);
    const timezoneDate = this.#localParts(noonUtc).date;
    const offsetDays = (Date.parse(`${timezoneDate}T00:00:00Z`)
      - Date.parse(`${localDate}T00:00:00Z`)) / 86400000;
    const localMidnightAsUtc = new Date(`${localDate}T00:00:00.000Z`);
    const localHour = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(localMidnightAsUtc));
    const offsetHours = localHour + (offsetDays * 24);
    const from = new Date(localMidnightAsUtc.getTime() - offsetHours * 3600000);
    return { from, to: new Date(from.getTime() + 86400000) };
  }
}

module.exports = ReportSchedulerService;
