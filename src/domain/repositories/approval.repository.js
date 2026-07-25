'use strict';

class ApprovalRepository {
  async findByApprovalIdForUpdate(_approvalId) {
    throw new Error('ApprovalRepository.findByApprovalIdForUpdate must be implemented');
  }

  async decidePending(_approvalId, _decision) {
    throw new Error('ApprovalRepository.decidePending must be implemented');
  }

  async markExpired(_approvalId, _decidedAt) {
    throw new Error('ApprovalRepository.markExpired must be implemented');
  }
}

module.exports = ApprovalRepository;
