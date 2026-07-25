'use strict';

class CeoCommandController {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  async execute(req, res) {
    const receipt = await this.dispatcher.dispatch({
      commandName: req.params.commandName,
      payload: req.body?.payload,
      actorId: req.body?.actorId,
      idempotencyKey: req.body?.idempotencyKey,
    });
    return res.status(receipt.status === 'queued' ? 202 : 200).json({
      ok: true,
      receipt,
    });
  }
}

module.exports = CeoCommandController;
