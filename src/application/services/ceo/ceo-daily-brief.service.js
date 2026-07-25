'use strict';

class CeoDailyBriefService {
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

  async generate({ reportDate, from, to }) {
    const collectors = {
      goals: () => this.repository.goalSnapshot(),
      kpis: () => this.repository.kpiSnapshot(from, to),
      finance: () => this.financeProvider.getFinanceSummary('day'),
      risks: () => this.repository.exceptionSnapshot(),
      decisions: () => this.repository.approvalSnapshot(),
      completed: () => this.repository.completedSnapshot(from, to),
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
    const message = this.#format(reportDate, sections);
    const receipt = await this.notificationGateway.notify({
      idempotencyKey: `ceo-daily-brief:${reportDate}`,
      title: `CEO Daily Brief — ${reportDate}`,
      message,
      severity: degraded || Number(sections.risks?.critical || 0) > 0
        ? 'warning'
        : 'success',
    });
    return Object.freeze({ reportDate, sections, receipt });
  }

  #format(date, sections) {
    const value = (section, fallback = 'degraded') =>
      section?.degraded ? fallback : JSON.stringify(section);
    return [
      `📅 **Ngày:** ${date}`,
      `🎯 **Mục tiêu:** ${value(sections.goals)}`,
      `📊 **KPI:** ${value(sections.kpis)}`,
      `💰 **Tiền:** ${value(sections.finance?.data || sections.finance)}`,
      `⚠️ **Rủi ro:** ${value(sections.risks)}`,
      `🧑‍⚖️ **Chờ quyết định:** ${value(sections.decisions)}`,
      `✅ **Đã hoàn tất:** ${value(sections.completed)}`,
    ].join('\n');
  }

  #timeout(promise, section) {
    let timer;
    const deadline = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`CEO brief section timed out: ${section}`);
        error.code = 'brief_section_timeout';
        reject(error);
      }, this.sectionTimeoutMs);
    });
    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timer));
  }
}

module.exports = CeoDailyBriefService;
