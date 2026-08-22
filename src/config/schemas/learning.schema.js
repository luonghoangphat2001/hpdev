'use strict';

/**
 * Schema definitions for Learning Hub AI prompts and evaluation templates.
 */
const LEARNING_CONFIG_SCHEMA = [
  {
    key: 'learning_prompt_tech',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_vocab',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_quiz',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_reading',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_writing',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_speaking',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_ielts',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_eval_tech',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_reading',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_writing',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_speaking',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_ielts',
    type: 'text',
    category: 'learning_evaluation',
  },
];

module.exports = {
  LEARNING_CONFIG_SCHEMA,
};
