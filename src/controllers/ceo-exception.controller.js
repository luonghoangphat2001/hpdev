'use strict';

class CeoExceptionController {
  constructor(service) {
    this.service = service;
  }

  async list(req, res) {
    const exceptions = await this.service.list(Number(req.query.limit || 100));
    return res.json({ count: exceptions.length, exceptions });
  }

  async refresh(_req, res) {
    const result = await this.service.refresh();
    return res.status(202).json({ ok: true, ...result });
  }

  async acknowledge(req, res) {
    const result = await this.service.acknowledge(
      req.params.exceptionId,
      req.body?.actorId,
    );
    return res.json({ ok: true, ...result });
  }
}

module.exports = CeoExceptionController;
