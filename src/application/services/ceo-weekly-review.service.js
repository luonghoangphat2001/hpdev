'use strict';

class CeoWeeklyReviewService {
  constructor({
    repository,
    financeProvider,
    notificationGateway,
    sectionTimeoutMs = 5000,
  }) {
    this.repository = repository;
    this.financeProvider = financeProvider;
    this.notificationGateway = notificationGateway;
    this.sectionTimeoutMs = sectionTimeoutMs;
  }

  async generate({ weekNumber, year, from, to }) {
    const collectors = {
      weeklyTrends: () => this.repository.weeklyTrendSnapshot(from, to),
      goalOffTrack: () => this.repository.goalOffTrackSnapshot(from, to),
      financeWeekly: () => this.financeProvider.getFinanceSummary('week'),
      recommendedActions: () => this.repository.recommendedActionSnapshot(from, to),
    };

    const entries = await Promise.all(Object.entries(collectors).map(
      async ([name, collect]) => {
        try {
          return [name, await this.#timeout(collect(), name)];
        } catch (error) {
          return [name, { degraded: true, errorCode: error.code || 'section_failed' }];
        }
      }
    ));

    const sections = Object.freeze(Object.fromEntries(entries));
    const degraded = entries.some(([, value]) => value.degraded);
    const message = this.#format(weekNumber, year, sections);
    const receipt = await this.notificationGateway.notify({
      idempotencyKey: `ceo-weekly-review:${year}-W${weekNumber}`,
      title: `CEO Weekly Business Review — Tuần ${weekNumber}/${year}`,
      message,
      severity: degraded || Number(sections.goalOffTrack?.count || 0) > 0
        ? 'warning'
        : 'success',
    });

    return Object.freeze({ weekNumber, year, sections, receipt });
  }

  #format(weekNumber, year, sections) {
    const value = (section, fallback = 'degraded') =>
      section?.degraded ? fallback : JSON.stringify(section);
    return [
      `📅 **Tuần:** ${weekNumber}/${year}`,
      `📈 **Xu hướng tuần:** ${value(sections.weeklyTrends)}`,
      `🎯 **Mục tiêu lệch:** ${value(sections.goalOffTrack)}`,
      `💰 **Tài chính tuần:** ${value(sections.financeWeekly?.data || sections.financeWeekly)}`,
      `💡 **Hành động đề xuất:** ${value(sections.recommendedActions)}`,
    ].join('\n');
  }

  #timeout(promise, section) {
    let timer;
    const deadline = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`CEO weekly review section timed out: ${section}`);
        error.code = 'weekly_review_section_timeout';
        reject(error);
      }, this.sectionTimeoutMs);
    });
    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timer));
  }
}

module.exports = CeoWeeklyReviewService;
