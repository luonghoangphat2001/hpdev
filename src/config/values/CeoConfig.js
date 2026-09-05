'use strict';

class CeoConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    let discordIds = reader.getOptionalArray('CEO_DISCORD_USER_IDS');
    if (discordIds.length === 0) {
      discordIds = reader.getOptionalArray('CEO_DISCORD_USER_ID');
    }
    this.discordUserIds = discordIds;
    this.dashboardActorIds = reader.getOptionalArray('CEO_DASHBOARD_ACTOR_IDS');
    this.operatorIds = Object.freeze([
      ...new Set([...this.discordUserIds, ...this.dashboardActorIds]),
    ]);

    this.dailyBrief = Object.freeze({
      enabled: reader.requireBoolean('CEO_DAILY_BRIEF_ENABLED'),
      timezone: reader.requireString('CEO_DAILY_BRIEF_TIMEZONE'),
      time: reader.requireString('CEO_DAILY_BRIEF_TIME'),
      sectionTimeoutMs: reader.requireNumber('CEO_DAILY_BRIEF_SECTION_TIMEOUT_MS'),
    });

    Object.freeze(this);
  }
}

module.exports = CeoConfig;
