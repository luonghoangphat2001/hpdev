'use strict';

const {
  LEVELS,
  selectedModules,
  validItem,
  generationPrompt,
  seedModule,
} = require('../../scripts/seed-english-reading-writing');

function readingItem(title, level = 'beginner') {
  return {
    title,
    prompt: '[Paragraph A] A complete passage.',
    level,
    content: {
      key_vocabulary: ['a', 'b', 'c', 'd', 'e'],
      questions: Array.from({ length: 4 }, (_, index) => ({
        id: index + 1,
        question: `Question ${index + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
      })),
    },
    sample_solution: { model_answer: '1. A' },
  };
}

describe('seed-english-reading-writing', () => {
  it('uses the four UI-compatible levels from A1 through C1', () => {
    expect(LEVELS.map((level) => level.value)).toEqual(['beginner', 'junior', 'intermediate', 'advanced']);
    expect(LEVELS.map((level) => level.cefr)).toEqual(['A1-A2', 'B1', 'B2', 'C1']);
  });

  it('validates module selection and required reading schema', () => {
    expect(selectedModules('reading,writing,reading')).toEqual(['reading', 'writing']);
    expect(validItem(readingItem('A valid lesson'), 'reading')).toBe(true);
    expect(validItem({ ...readingItem('Invalid'), content: { questions: [] } }, 'reading')).toBe(false);
  });

  it('includes CEFR calibration and title exclusions in the source prompt extension', () => {
    const prompt = generationPrompt('reading', LEVELS[0], ['Existing lesson']);
    expect(prompt).toContain('A1-A2');
    expect(prompt).toContain('Existing lesson');
  });

  it('is idempotent when a level already has its target count', async () => {
    const rows = Array.from({ length: 2 }, (_, index) => ({ ...readingItem(`Lesson ${index}`), is_active: 1 }));
    const repositories = {
      learningRepo: {
        findLearningBySlug: jest.fn(async () => ({ id: 7 })),
        updateLearning: jest.fn(async () => true),
        findItems: jest.fn(async ({ level }) => rows.map((row) => ({ ...row, level }))),
        createItem: jest.fn(async () => 1),
      },
    };
    const learningService = { generateContent: jest.fn() };

    const result = await seedModule({
      type: 'reading',
      targetPerLevel: 2,
      batchSize: 1,
      repositories,
      learningService,
    });

    expect(result.complete).toBe(true);
    expect(learningService.generateContent).not.toHaveBeenCalled();
    expect(repositories.learningRepo.createItem).not.toHaveBeenCalled();
  });
});
