'use strict';

class OperatorControlController {
  constructor({ controlService, replayService }) {
    this.controlService = controlService;
    this.replayService = replayService;
  }

  async control(req, res) {
    const result = await this.controlService.control({
      workflowId: req.params.workflowId,
      operation: req.body?.operation,
      expectedVersion: req.body?.expectedVersion,
      actorId: req.body?.actorId,
      reason: req.body?.reason,
    });
    return res.json({ ok: true, workflow: result });
  }

  async feedback(req, res) {
    const feedback = await this.controlService.feedback({
      workflowId: req.params.workflowId,
      actorId: req.body?.actorId,
      rating: req.body?.rating,
      comment: req.body?.comment,
    });
    return res.status(201).json({ ok: true, feedback });
  }

  async replay(req, res) {
    const result = await this.replayService.replay({
      eventId: req.params.eventId,
      dryRun: req.body?.dryRun !== false,
      actorId: req.body?.actorId,
    });
    return res.status(result.mode === 'dry_run' ? 200 : 202).json({ ok: true, ...result });
  }
}

module.exports = OperatorControlController;
