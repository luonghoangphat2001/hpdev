import { LEARNING_PROMPT_TEMPLATES, PROMPT_FIELDS } from './constants.js';

export function fillPromptTemplate(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = LEARNING_PROMPT_TEMPLATES[fieldId] || '';
  }
}

export function fillAllPromptTemplates() {
  const templateKeys = Object.keys(LEARNING_PROMPT_TEMPLATES);
  for (const key of templateKeys) {
    fillPromptTemplate(key);
  }
}

export function clearPromptField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = '';
    field.focus();
  }
}

export function populatePromptFields(data) {
  for (const [elemId, dataKey] of PROMPT_FIELDS) {
    const el = document.getElementById(elemId);
    if (el) {
      el.value = data[dataKey] || '';
    }
  }
}
