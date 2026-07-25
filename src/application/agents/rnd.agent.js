'use strict';

const BaseProposalAgent = require('../../domain/agents/base-proposal.agent');
const MenuAnalysisService = require('../../domain/agents/rnd/menu-analysis.service');

class RndAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    analyzer = new MenuAnalysisService(),
    idFactory,
    clock,
  }) {
    super({
      agentId: 'dan_rnd',
      proposalTypes: ['menu_review'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.analyzer = analyzer;
  }

  async execute({ workflowId, query = {} }) {
    const productResult = await this.readAdapter.listProducts(query);
    const analysis = this.analyzer.analyze(productResult.data);
    const candidates = analysis.filter(({ signals }) => signals.length > 0);

    return this.createProposal({
      workflowId,
      type: 'menu_review',
      summary: `${candidates.length}/${analysis.length} sản phẩm cần xem xét`,
      evidence: analysis.map((item) => ({
        source_ref: `product:${item.product_id}`,
        ...item,
      })),
      recommendations: candidates.map((item) => ({
        product_id: item.product_id,
        recommendation: 'review_menu_item',
        reasons: item.signals,
      })),
      requestedActions: [],
    });
  }
}

module.exports = RndAgent;
