'use strict';

class ApprovalController {
  constructor(service) {
    this.service = service;
  }

  async decide(req, res) {
    const approval = await this.service.decide({
      approvalId: req.params.approvalId,
      decision: req.body?.decision,
      decisionVersion: req.body?.decisionVersion,
      actorId: req.body?.actorId,
      reason: req.body?.reason,
    });
    return res.json({ ok: true, approval });
  }
}

module.exports = ApprovalController;
