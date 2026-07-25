'use strict';

class QualityTestGateService {
  verifyTestCoverage({ totalTests = 0, passedTests = 0, coveragePercent = 100 }) {
    const allPassed = passedTests === totalTests && totalTests > 0;
    const thresholdMet = coveragePercent >= 80;

    return Object.freeze({
      passed: allPassed && thresholdMet,
      totalTests,
      passedTests,
      coveragePercent,
      verifiedAt: new Date().toISOString(),
    });
  }
}

module.exports = QualityTestGateService;
