export const ADDITIONAL_MODELS = [
  {
    key: 'deepseek',
    label: '🌊 DeepSeek',
    modelKey: 'deepseek_model',
    placeholder: 'deepseek-v4-flash',
  },
  {
    key: 'kimi',
    label: '🧠 Kimi',
    modelKey: 'kimi_model',
    placeholder: 'kimi-k2.6',
  },
  {
    key: 'vllm',
    label: '⚡ vLLM',
    modelKey: 'vllm_model',
    placeholder: 'llama3.1',
  },
  {
    key: 'ollama',
    label: '🦙 Ollama',
    modelKey: 'ollama_model',
    placeholder: 'llama3.1',
  },
  {
    key: 'nvidia',
    label: '🟢 NVIDIA NIM',
    modelKey: 'nvidia_model',
    placeholder: 'meta/llama-3.1-8b-instruct',
  },
  {
    key: 'cloudflare',
    label: '☁️ Cloudflare AI',
    modelKey: 'cloudflare_model',
    placeholder: '@cf/meta/llama-3.1-8b-instruct',
  },
];

export const OPENCLAW_AGENTS = [
  ['dan_rnd', 'R&D'],
  ['dan_logistics', 'Logistics'],
  ['dan_cfo', 'CFO'],
  ['dan_ops', 'Operations'],
  ['dan_cskh', 'CSKH'],
];

export const LEARNING_PROMPT_TEMPLATES = {
  'prompt-learning-tech': 'Bạn là Senior Technical Architect và Lead Interviewer. Tạo {{count}} câu hỏi thực chiến cho {{stackName}}, cấp độ {{level}}. Chỉ trả JSON ARRAY đúng schema Learning, không đánh số title, nội dung ngắn gọn và không thêm văn bản ngoài JSON.',
  'prompt-learning-vocab': 'Bạn là giảng viên ngôn ngữ Anh. Tạo {{count}} từ vựng cho {{topicName}}, cấp độ {{level}}. Không lặp từ trong {{existingWords}}. Chỉ trả JSON ARRAY đúng schema Learning.',
  'prompt-learning-quiz': 'Bạn là Quiz Master. Tạo {{count}} câu hỏi trắc nghiệm cho {{topicName}}, cấp độ {{level}}, mỗi câu có 4 lựa chọn và đáp án đúng. Chỉ trả JSON ARRAY.',
  'prompt-learning-reading': 'Bạn là Giám khảo IELTS Academic Reading. Tạo {{count}} bài Đọc hiểu chuẩn Cambridge cho "{{topicName}}", cấp độ {{level}}. Bài đọc tiếng Anh 250-400 từ chia đoạn rõ ràng [Paragraph A], [Paragraph B], [Paragraph C]..., kèm 4-6 câu hỏi gồm trắc nghiệm Multiple Choice (4 lựa chọn A, B, C, D) và True/False/Not Given, có đáp án đúng, trích dẫn đoạn văn (paragraph_ref) và lời giải thích chi tiết. Chỉ trả JSON ARRAY đúng schema Learning.',
  'prompt-learning-writing': 'Bạn là Giám khảo IELTS Academic Writing. Tạo {{count}} đề thi Viết chuẩn Cambridge (Task 1 hoặc Task 2) cho "{{topicName}}", Target Band: {{level}}. Đề bài chuẩn rubric Cambridge ("You should spend about 40 minutes... Write at least 250 words"), kèm dạng bài task_type, 5-8 từ vựng học thuật C1/C2 kèm nghĩa tiếng Việt, dàn ý 4 đoạn, bài luận mẫu Band 9.0 (280-330 từ) và lời phê của giám khảo (examiner_notes). Chỉ trả JSON ARRAY đúng schema Learning.',
  'prompt-learning-speaking': 'Bạn là Giám khảo IELTS Speaking Cambridge. Tạo {{count}} đề thi Nói mô phỏng 3 phần chuẩn Cambridge cho "{{topicName}}", Target Band: {{level}}. Bao gồm Part 1 (3-4 câu hỏi phỏng vấn), Part 2 Cue Card (thẻ chủ đề với 4 gợi ý và thời gian chuẩn bị 1 phút), Part 3 (3-4 câu hỏi thảo luận chuyên sâu), 5-8 thành ngữ/collocations bản xứ C1/C2 kèm nghĩa tiếng Việt và bài mẫu câu trả lời Band 8.5+ hoàn chỉnh cho cả 3 phần. Chỉ trả JSON ARRAY đúng schema Learning.',
  'prompt-learning-ielts': 'Bạn là Giám khảo IELTS Quốc tế chấm thi chính thức của Cambridge. Tạo {{count}} đề thi IELTS Academic/General chuẩn Cambridge cho "{{topicName}}", Target Band: {{level}}. Đề bài chuẩn rubric Cambridge ("You should spend about 40 minutes on this task... Write at least 250 words" cho Task 2 hoặc "You should spend about 20 minutes... Write at least 150 words" cho Task 1), kèm dạng bài task_type, 5-8 từ vựng học thuật C1/C2 kèm nghĩa tiếng Việt, dàn ý 4 đoạn gợi ý, bài luận mẫu Band 9.0 (280-340 từ) và lời phê chi tiết của giám khảo (examiner_notes) theo 4 tiêu chí TR, CC, LR, GRA. Chỉ trả JSON ARRAY đúng schema Learning.',
  'prompt-learning-eval-tech': 'Bạn là Senior Technical Architect phỏng vấn ứng viên. Chấm câu trả lời dựa trên đề bài {{title}} và câu trả lời {{submission}}, trả JSON có score (thang 10), summary, strengths, improvements và follow_up_trap.',
  'prompt-learning-eval-reading': 'Bạn là Giảng viên Tiếng Anh học thuật Cambridge chấm bài đọc hiểu. Đánh giá câu trả lời của học viên dựa trên bài đọc {{title}}, đoạn văn và câu hỏi cho bài làm {{submission}}, trả JSON có score (thang 10), summary, strengths, improvements và detailed_corrections.',
  'prompt-learning-eval-writing': 'Bạn là Giám khảo IELTS Writing Quốc tế. Đánh giá bài viết dựa trên đề bài {{title}} và bài làm {{submission}} theo đúng 4 tiêu chí Band Descriptors (TR, CC, LR, GRA từ 0.0 - 9.0), trả JSON có overall_band, criteria_scores, examiner_comment, strengths, improvements và detailed_corrections.',
  'prompt-learning-eval-speaking': 'Bạn là Giám khảo IELTS Speaking Cambridge. Đánh giá bài nói dựa trên đề bài {{title}} và bài làm/transcript {{submission}} theo đúng 4 tiêu chí Speaking Descriptors (FC, LR, GRA, PR từ 0.0 - 9.0), trả JSON có overall_band, criteria_scores, summary, examiner_comment, strengths, improvements và native_upgrades.',
  'prompt-learning-eval-ielts': 'Bạn là Giám khảo IELTS Quốc tế chấm thi chính thức. Đánh giá bài làm cho đề {{title}} dựa trên bài nộp {{submission}} theo đúng 4 tiêu chí Band Descriptors (TR, CC, LR, GRA), trả JSON có overall_band, criteria_scores, examiner_comment, strengths, improvements và detailed_corrections.',
};

export const PROMPT_FIELDS = [
  ['prompt-learning-tech', 'learning_prompt_tech'],
  ['prompt-learning-vocab', 'learning_prompt_vocab'],
  ['prompt-learning-quiz', 'learning_prompt_quiz'],
  ['prompt-learning-reading', 'learning_prompt_reading'],
  ['prompt-learning-writing', 'learning_prompt_writing'],
  ['prompt-learning-speaking', 'learning_prompt_speaking'],
  ['prompt-learning-ielts', 'learning_prompt_ielts'],
  ['prompt-learning-eval-tech', 'learning_prompt_eval_tech'],
  ['prompt-learning-eval-reading', 'learning_prompt_eval_reading'],
  ['prompt-learning-eval-writing', 'learning_prompt_eval_writing'],
  ['prompt-learning-eval-speaking', 'learning_prompt_eval_speaking'],
  ['prompt-learning-eval-ielts', 'learning_prompt_eval_ielts'],
];
