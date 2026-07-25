'use strict';

class DraftEditorConfigService {
  constructor() {
    this.drafts = new Map();
  }

  saveDraft({ agentId, draftType, content, changeReason }) {
    const draftId = `draft_${agentId}_${draftType}_${Math.random().toString(36).substr(2, 9)}`;
    const draftData = Object.freeze({
      draftId,
      agentId,
      draftType,
      content,
      changeReason,
      validated: true,
      autosavedAt: new Date().toISOString(),
    });

    this.drafts.set(draftId, draftData);
    return draftData;
  }
}

module.exports = DraftEditorConfigService;
