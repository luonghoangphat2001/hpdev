/**
 * @fileoverview ApprovalController - Provides approval functionality.
 */
'use strict';

const BaseController = require('./BaseController');

/**
 * ApprovalController
 * Manages approval logic.
 */
class ApprovalController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} service - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(service) {
    super();
    this.service = service;
  }

  /**
   * decide - Asynchronously executes decide.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async decide(req, res) {
    const approval = await this.service.decide({
      approvalId: req.params.approvalId,
      decision: req.body?.decision,
      decisionVersion: req.body?.decisionVersion,
      actorId: req.body?.actorId,
      reason: req.body?.reason,
    });
    return this.ok(res, { ok: true, approval });
  }
}

module.exports = ApprovalController;
