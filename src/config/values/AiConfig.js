'use strict';

class AiConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.geminiKey = reader.getOptionalString('GEMINI_KEY', '');
    this.anthropicKey = reader.getOptionalString('ANTHROPIC_KEY', '');
    this.claudeKey = reader.getOptionalString('CLAUDE_KEY', '');
    this.openaiKey = reader.getOptionalString('OPENAI_KEY', '');
    Object.freeze(this);
  }
}

module.exports = AiConfig;
