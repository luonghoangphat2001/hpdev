export const ROUTE_NAMES = Object.freeze({
  ROOT: 'root',
  LOGIN: 'login',
  TECH: 'learning-tech',
  VOCAB: 'learning-vocab',
  DISCORD: 'learning-discord',
  QUIZ: 'learning-quiz',
  EXAM: 'learning-exam',
  READING: 'learning-reading',
  WRITING: 'learning-writing',
  SPEAKING: 'learning-speaking',
  IELTS: 'learning-ielts',
});

export const DEFAULT_TECH_STACK = 'php';
export const TECH_STACKS = new Set(['php', 'nextjs', 'python', 'reactjs', 'javascript', 'nodejs']);

export const DEFAULT_QUIZ_MODE = 'multiple_choice';
export const QUIZ_MODES = new Set(['multiple_choice', 'spelling', 'leaderboard']);
