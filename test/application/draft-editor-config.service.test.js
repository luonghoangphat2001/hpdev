'use strict';

const DraftEditorConfigService = require('../../src/application/services/draft-editor-config.service');

describe('T154: Draft Editor for Prompt/SOP/Policy/Config Service', () => {
  test('saves validated draft with change reason and autosave timestamp', () => {
    const service = new DraftEditorConfigService();
    const draft = service.saveDraft({
      agentId: 'dan_ops',
      draftType: 'PROMPT',
      content: 'Updated ops prompt for beverage inventory',
      changeReason: 'Optimize stock check accuracy',
    });

    expect(draft.agentId).toBe('dan_ops');
    expect(draft.validated).toBe(true);
    expect(draft.changeReason).toBe('Optimize stock check accuracy');
  });
});
