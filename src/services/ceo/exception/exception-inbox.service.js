/**
 * @fileoverview exception-inbox.service - Provides exception-inbox functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

/**
 * ExceptionInboxService
 * Manages exception inbox logic.
 */
class ExceptionInboxService {
  constructor({
    repository,
    notificationGateway = null,
    allowedActorIds = [],
    clock = () => new Date(),
  }) {
    this.repository = repository;
    this.notificationGateway = notificationGateway;
    this.allowedActorIds = new Set(allowedActorIds);
    this.clock = clock;
  }

  /**
   * refresh - Asynchronously executes refresh.
   * @returns {*} Promise resolving result.
   */
  async refresh() {
    const counts = {
      approval: await this.repository.collectApprovals(),
      deadLetter: await this.repository.collectDeadLetters(),
      conflict: await this.repository.collectConflicts(),
      kpiDeviation: await this.repository.collectKpiDeviations(),
    };
    const added = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (added > 0 && this.notificationGateway) {
      const date = this.clock().toISOString().slice(0, 10);
      await this.notificationGateway.notify({
        idempotencyKey: `ceo-exception-refresh:${date}:${added}`,
        title: `${added} ngoại lệ mới cần CEO xem`,
        message: `Approval ${counts.approval} · Dead-letter ${counts.deadLetter} · `
          + `Conflict ${counts.conflict} · KPI ${counts.kpiDeviation}`,
        severity: counts.deadLetter > 0 ? 'critical' : 'warning',
      });
    }
    return Object.freeze({ added, counts: Object.freeze(counts) });
  }

  /**
   * list - Asynchronously executes list.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async list(limit) {
    return this.repository.listOpen(limit);
  }

  /**
   * acknowledge - Asynchronously executes acknowledge.
   * @param {*} exceptionId - Input parameter.
   * @param {*} actorId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async acknowledge(exceptionId, actorId) {
    if (!this.allowedActorIds.has(String(actorId))) {
      throw new AppError('CEO actor is not authorized', 403);
    }
    const changed = await this.repository.acknowledge(
      exceptionId,
      String(actorId),
      this.clock(),
    );
    if (!changed) throw new AppError('Exception is not open', 409);
    return { exceptionId, status: 'acknowledged' };
  }
}

module.exports = ExceptionInboxService;
