'use strict';

const { KINDS } = require('../domain/capabilities/capability-registry');
const { AppError } = require('../middlewares/error.middleware');

class CapabilityController {
  constructor(registry) {
    this.registry = registry;
  }

  list(req, res) {
    const kind = req.query.kind || null;
    if (kind && !KINDS.includes(kind)) {
      throw new AppError('kind must be agent, tool, or model', 400);
    }
    const available = req.query.available === undefined
      ? null
      : req.query.available === 'true';
    const entries = this.registry.query({
      kind,
      capability: req.query.capability || null,
      permission: req.query.permission || null,
      available,
    });
    return res.json({ count: entries.length, entries });
  }
}

module.exports = CapabilityController;
