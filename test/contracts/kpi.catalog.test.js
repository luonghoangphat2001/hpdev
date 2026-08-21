'use strict';

const { kpiDictionary, getKpiDefinition } = require('../../src/schemas/reporting/kpi.catalog');

describe('T069: KPI Dictionary and Ownership', () => {
  test('contains definitions for all 5 domain agents', () => {
    expect(kpiDictionary['rnd.proposal_acceptance_rate'].ownerAgent).toBe('dan_rnd');
    expect(kpiDictionary['logistics.stockout_rate'].ownerAgent).toBe('dan_logistics');
    expect(kpiDictionary['cfo.gross_margin'].ownerAgent).toBe('dan_cfo');
    expect(kpiDictionary['ops.sla_compliance_rate'].ownerAgent).toBe('dan_ops');
    expect(kpiDictionary['cskh.customer_satisfaction_score'].ownerAgent).toBe('dan_cskh');
  });

  test('getKpiDefinition returns frozen definition or throws', () => {
    const def = getKpiDefinition('ops.sla_compliance_rate');
    expect(def.target).toBe(0.95);
    expect(() => getKpiDefinition('invalid')).toThrow('Unknown KPI key');
  });
});
