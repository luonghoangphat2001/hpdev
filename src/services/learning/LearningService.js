'use strict';

const XLSX = require('xlsx');
const { parseJson, unpackItems, normalizeItem } = require('@services/learning/ContentNormalizer');
const { performanceMap, weightedShuffle } = require('@services/learning/AdaptiveSelector');

// ─── PROMPT GENERATOR STRATEGIES ─────────────────────────────
const PROMPT_BUILDERS = {
  tech_question: ({ stackName, level, count, customPrompt }) => ({
    system: `Bạn là Senior Technical Architect kiêm Lead Interviewer tuyển dụng kỹ sư phần mềm chuyên nghiệp.
Soạn ${count} câu hỏi kỹ thuật phỏng vấn và thực chiến xuất sắc cho ${stackName}. Cấp độ: ${level}.
QUY TẮC BẮT BUỘC: CHỈ TRẢ VỀ JSON ARRAY [ ... ] thuần túy không kèm lời mở đầu.
KHÔNG đánh số tiêu đề và KHÔNG thêm tiền tố như "Câu hỏi 1:", "Question 1:"; trường title chỉ chứa tiêu đề nội dung.
TOÀN BỘ title, prompt và phần trả lời phải viết bằng tiếng Việt; chỉ giữ nguyên từ khóa API và code tiếng Anh khi cần.
[
  {
    "title": "Tiêu đề câu hỏi ngắn gọn",
    "prompt": "Chi tiết câu hỏi phỏng vấn thực tế",
    "level": "${level}",
    "content": {
      "quick_answer": "Tóm tắt 30s phỏng vấn",
      "detailed_answer": "Phân tích chuyên sâu",
      "code_example": "Code minh họa tối ưu",
      "interview_tips": "Bẫy phỏng vấn",
      "practical_tips": "Kinh nghiệm thực chiến"
    },
    "sample_solution": { "key_takeaways": "Điểm cốt lõi" },
    "tags": "${stackName.toLowerCase()}, interview, ${level}"
  }
]`,
    user: customPrompt
      ? `Tạo ${count} câu hỏi về ${stackName}: "${customPrompt}". Cấp độ: ${level}. Viết bằng tiếng Việt. CHỈ TRẢ VỀ JSON ARRAY.`
      : `Tạo ${count} câu hỏi phỏng vấn thực chiến đa dạng về ${stackName}, cấp độ: ${level}. Viết bằng tiếng Việt, không lặp khuôn câu hỏi. CHỈ TRẢ VỀ JSON ARRAY.`
  }),

  vocabulary: ({ topicName, level, count, customPrompt, existingWords }) => {
    const wordsList = Array.isArray(existingWords) ? existingWords.slice(0, 50).join(', ') : String(existingWords || '');
    return {
      system: `Bạn là Chuyên gia Khảo thí và Giảng viên Ngôn ngữ Anh cao cấp (Master of Applied Linguistics).
Soạn ${count} từ vựng Tiếng Anh thực chiến và đắt giá cho chủ đề: "${topicName}". Cấp độ: ${level}.
${wordsList ? `LƯU Ý: KHÔNG ĐƯỢC sinh trùng các từ sau: [${wordsList}]` : ''}
QUY TẮC BẮT BUỘC: CHỈ TRẢ VỀ JSON ARRAY [ ... ] thuần túy.
[
  {
    "title": "Từ vựng tiếng Anh (e.g. Resilience)",
    "prompt": "Định nghĩa hoặc ngữ cảnh ngắn",
    "level": "${level}",
    "content": {
      "word": "Resilience",
      "meaning": "Nghĩa tiếng Việt chuẩn",
      "pronunciation": "/rɪˈzɪl.jəns/",
      "example": "Câu ví dụ thực tế bằng tiếng Anh",
      "note": "Dịch nghĩa tiếng Việt của câu ví dụ",
      "collocations": ["build resilience", "emotional resilience"],
      "mnemonics": "Mẹo ghi nhớ nhanh"
    },
    "sample_solution": { "synonyms": ["tenacity", "toughness"] },
    "tags": "vocabulary, ${topicName.toLowerCase()}, ${level}"
  }
]`,
      user: customPrompt
        ? `Sinh ${count} từ vựng cho chủ đề "${topicName}": "${customPrompt}". CHỈ TRẢ VỀ JSON ARRAY.`
        : `Sinh ${count} từ vựng chất lượng cao cho chủ đề "${topicName}", cấp độ: ${level}. CHỈ TRẢ VỀ JSON ARRAY.`
    };
  },

  quiz: ({ topicName, level, count, customPrompt }) => ({
    system: `Bạn là Trưởng ban Đề thi Tiếng Anh (Senior Quiz Master).
Soạn ${count} câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) cho: "${topicName}". Cấp độ: ${level}.
QUY TẮC: CHỈ TRẢ VỀ JSON ARRAY [ ... ] thuần túy.
[
  {
    "title": "Câu hỏi kiểm tra",
    "prompt": "Choose the best option: ...",
    "level": "${level}",
    "content": {
      "options": ["A. Opt 1", "B. Opt 2", "C. Opt 3", "D. Opt 4"],
      "correct_option": "A",
      "explanation": "Giải thích chi tiết"
    },
    "sample_solution": { "correct_answer": "A. Opt 1" },
    "tags": "quiz, ${topicName.toLowerCase()}, ${level}"
  }
]`,
    user: customPrompt ? `Soạn ${count} câu trắc nghiệm: "${customPrompt}"` : `Soạn ${count} câu trắc nghiệm chủ đề "${topicName}"`
  }),

  reading: ({ topicName, level, count, customPrompt }) => ({
    system: `You are an expert Cambridge IELTS Academic Reading Examiner. Create ${count || 1} authentic IELTS Reading Comprehension lessons for topic "${topicName}", Level: ${level || 'intermediate'}.
CRITICAL REQUIREMENTS:
1. "title": English article headline (e.g. "The Architecture of Deep-Sea Bioluminescence", "The Evolution of Urban Microclimates").
2. "prompt": A well-structured academic English passage of 250-400 words, clearly organized into labeled paragraphs: [Paragraph A], [Paragraph B], [Paragraph C], [Paragraph D].
3. "content.key_vocabulary": Array of 5-8 C1/C2 academic vocabulary items with definitions and Vietnamese meaning: "word (pos): definition - nghĩa tiếng Việt".
4. "content.questions": Array of 4-5 authentic Cambridge IELTS format questions:
   - Mix of "multiple_choice" (4 options: ["A. ...", "B. ...", "C. ...", "D. ..."]) and "true_false_not_given" (options: ["TRUE", "FALSE", "NOT GIVEN"]).
   - Each question MUST contain: "id", "type", "question", "options" (array of choices), "correct_answer" (e.g. "A" or "TRUE"), "paragraph_ref" (e.g. "Paragraph B"), and "explanation".
5. "sample_solution.model_answer": Clear answer keys with paragraph references and explanations.
6. ONLY return a valid JSON ARRAY matching this schema:
[
  {
    "title": "The Architecture of Deep-Sea Bioluminescence",
    "prompt": "[Paragraph A] In the aphotic zone of the world's oceans—depths below 1,000 meters where sunlight never penetrates—more than 75% of marine creatures produce their own light. This phenomenon, known as bioluminescence, serves distinct ecological purposes ranging from counterillumination camouflage to predatory deception.\\n\\n[Paragraph B] Unlike artificial light sources that emit considerable heat, bioluminescence is virtually 100% efficient 'cold light', catalyzed by enzymes called luciferases reacting with substrate luciferins. This biochemical efficiency ensures minimal thermal energy loss in cold abyssal waters.\\n\\n[Paragraph C] Furthermore, lanternfish and cookiecutter sharks use ventral photophores to match the faint downwelling ambient light from above. This counterillumination renders their dark silhouettes invisible to predators lurking beneath them.",
    "level": "${level || 'intermediate'}",
    "content": {
      "key_vocabulary": [
        "aphotic zone (n): vùng biển sâu không có ánh sáng mặt trời",
        "counterillumination (n): cơ chế ngụy trang phát quang chống lại bóng tối",
        "biomedical imaging (n): chẩn đoán hình ảnh y sinh"
      ],
      "questions": [
        {
          "id": 1,
          "type": "multiple_choice",
          "question": "What is the primary biological advantage of 'cold light' mentioned in Paragraph B?",
          "options": [
            "A. It prevents energy loss through thermal dissipation",
            "B. It allows predators to withstand extreme oceanic pressure",
            "C. It accelerates bacterial cell division in abyssal trenches",
            "D. It permanently blinds approaching apex predators"
          ],
          "correct_answer": "A",
          "paragraph_ref": "Paragraph B",
          "explanation": "Paragraph B states that bioluminescence is virtually 100% efficient cold light that minimizes thermal heat loss."
        },
        {
          "id": 2,
          "type": "true_false_not_given",
          "question": "Cookiecutter sharks emit light from their dorsal surface to attract deep-sea prey.",
          "options": ["TRUE", "FALSE", "NOT GIVEN"],
          "correct_answer": "FALSE",
          "paragraph_ref": "Paragraph C",
          "explanation": "Paragraph C states that they emit light from their ventral (underside) photophores for camouflage, not dorsal surfaces."
        }
      ]
    },
    "sample_solution": {
      "model_answer": "1. A (Paragraph B)\\n2. FALSE (Paragraph C)"
    },
    "tags": "reading, ielts, cambridge, ${topicName.toLowerCase()}"
  }
]`,
    user: customPrompt
      ? `Generate ${count || 1} Cambridge IELTS Reading lessons with multiple choice and T/F/NG questions for: "${customPrompt}".`
      : `Generate ${count || 1} Cambridge IELTS Reading lessons with multiple choice and T/F/NG questions on topic "${topicName}".`
  }),

  writing: ({ topicName, level, count, customPrompt }) => ({
    system: `You are an official Cambridge IELTS Senior Examiner and Writing Specialist. Create ${count || 1} authentic IELTS Writing tasks for topic "${topicName}", Target Band: ${level || '7.5 - 8.5'}.
CRITICAL REQUIREMENTS:
1. "title": Official IELTS Exam Task Title (e.g. "IELTS Writing Task 2: Artificial Intelligence in Modern Workplace" or "IELTS Academic Task 1: Global Renewable Energy Production").
2. "prompt": The EXACT official Cambridge IELTS prompt rubric:
   - For Task 2: "You should spend about 40 minutes on this task.\\n\\nWrite about the following topic:\\n\\n[Authentic IELTS debate statement or scenario]\\n\\n[Question prompt: e.g. To what extent do you agree or disagree? / Discuss both views and give your opinion.]\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words."
3. "content.task_type": "Writing Task 2 (Discussion & Opinion)" or "Writing Task 2 (Agree/Disagree)" or "Writing Task 1 (Academic Chart/Process)".
4. "content.target_band": "7.5 - 9.0"
5. "content.instructions": "Spend 40 minutes. Write at least 250 words. Demonstrate sophisticated cohesive devices, academic collocations, and varied grammatical structures."
6. "content.key_vocabulary": Array of 5-8 C1/C2 advanced lexical collocations with Vietnamese meanings.
7. "content.suggested_outline": 4-paragraph essay outline with bullet points (Introduction, Body 1, Body 2, Conclusion).
8. "sample_solution.model_answer": Full 280-330 word Band 9.0 model essay.
9. "sample_solution.examiner_notes": Breakdown explaining why this achieves Band 9.0 across TR, CC, LR, and GRA.
10. ONLY return a valid JSON ARRAY matching this schema:
[
  {
    "title": "IELTS Writing Task 2: The Impact of Automation on Employment",
    "prompt": "You should spend about 40 minutes on this task.\\n\\nWrite about the following topic:\\n\\nSome people believe that artificial intelligence and automation will transform work positively, while others argue they will lead to mass unemployment and social inequality.\\n\\nDiscuss both views and give your own opinion.\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words.",
    "level": "${level || 'ielts_7'}",
    "content": {
      "task_type": "Writing Task 2 (Discussion & Opinion)",
      "target_band": "7.5 - 9.0",
      "instructions": "Write at least 250 words. Maintain an academic tone.",
      "key_vocabulary": [
        "paramount importance (collocation): tầm quan trọng tối cao",
        "technological proliferation (n): sự bùng nổ công nghệ",
        "structural unemployment (n): thất nghiệp cơ cấu",
        "indispensable catalyst (n): chất xúc tác không thể thiếu"
      ],
      "suggested_outline": "Introduction: Paraphrase debate + Clear thesis statement\\n- Body 1: Positive productivity and new industries\\n- Body 2: Disruptive job displacement and inequality\\n- Conclusion: Synthesis advocating lifelong reskilling"
    },
    "sample_solution": {
      "model_answer": "The advent of automation has ignited substantial debate regarding the trajectory of human labor...",
      "examiner_notes": "TR: Fully developed position. CC: Flawless progression. LR: Sophisticated C1/C2 collocations. GRA: Varied complex syntax."
    },
    "tags": "writing, ielts, cambridge, ${topicName.toLowerCase()}"
  }
]`,
    user: customPrompt
      ? `Create ${count || 1} authentic Cambridge IELTS Writing tasks for: "${customPrompt}". Target Band: ${level || '7.5 - 8.5'}.`
      : `Create ${count || 1} authentic Cambridge IELTS Writing tasks on topic "${topicName}". Target Band: ${level || '7.5 - 8.5'}.`
  }),

  speaking: ({ topicName, level, count, customPrompt }) => ({
    system: `You are an official Cambridge IELTS Speaking Examiner. Create ${count || 1} authentic 3-Part IELTS Speaking Test Simulations on topic "${topicName}", Target Band: ${level || '7.5 - 8.5'}.
CRITICAL REQUIREMENTS:
1. "title": Official IELTS Speaking Exam Title (e.g. "IELTS Speaking: Technology & Artificial Intelligence", "IELTS Speaking: Environment & Sustainable Living").
2. "prompt": Full 3-Part Cambridge IELTS Speaking format:
   - Part 1 (Introduction & Interview): 3-4 short familiar questions.
   - Part 2 (Individual Long Turn / Cue Card): Official Cue Card with "Describe [topic]... You should say: What it is, When/Where, Who is involved, And explain why... (You have 1 minute to prepare and 2 minutes to speak)".
   - Part 3 (Two-way Discussion): 3-4 deep, abstract, and societal analytical questions linked to Part 2.
3. "content.part1_questions": Array of 3-4 Part 1 questions.
4. "content.part2_cue_card": Object containing { "topic": "...", "bullet_points": ["...", "..."], "preparation_time": "1 minute", "speaking_time": "2 minutes" }.
5. "content.part3_questions": Array of 3-4 Part 3 analytical questions.
6. "content.target_expressions": Array of 5-8 native idioms, C1/C2 collocations, and discourse markers with Vietnamese meanings.
7. "sample_solution.sample_response": A comprehensive Band 8.5+ candidate response transcript covering Part 1, Part 2, and Part 3.
8. "sample_solution.examiner_notes": Assessment of Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and Pronunciation.
9. ONLY return a valid JSON ARRAY matching this schema:
[
  {
    "title": "IELTS Speaking: Artificial Intelligence and Human Future",
    "prompt": "PART 1: Introduction & Everyday Tech\\n1. How often do you use digital devices?\\n2. Do you think technology makes life easier or more complicated?\\n\\nPART 2: Cue Card\\nDescribe an AI tool or technological innovation that changed how you study or work.\\nYou should say:\\n- What the technology is\\n- When you began using it\\n- How you use it in daily life\\n- And explain whether it has improved your overall productivity.\\n\\nPART 3: In-Depth Discussion\\n1. Will artificial intelligence replace human teachers in the future?\\n2. What ethical challenges are posed by autonomous decision-making?",
    "level": "${level || 'ielts_7'}",
    "content": {
      "part1_questions": [
        "How often do you use digital tools in your daily routine?",
        "Do you prefer reading physical books or using digital e-readers?"
      ],
      "part2_cue_card": {
        "topic": "Describe an AI tool that has significantly impacted your workflow",
        "bullet_points": [
          "What the tool is and how you discovered it",
          "What specific tasks you use it for",
          "How steep the learning curve was",
          "And explain why it has become indispensable to your daily productivity"
        ],
        "preparation_time": "1 minute",
        "speaking_time": "2 minutes"
      ],
      "part3_questions": [
        "To what extent will automated systems redefine white-collar professions?",
        "What measures should governments take to regulate synthetic media and deepfakes?"
      ],
      "target_expressions": [
        "a double-edged sword (idiom): con dao hai lưỡi",
        "streamline mundane workflows (collocation): tinh giản quy trình làm việc nhàm chán",
        "indispensable asset (n): tài sản không thể thiếu",
        "spark ethical apprehensions (collocation): dấy lên những lo ngại về đạo đức"
      ]
    },
    "sample_solution": {
      "sample_response": "Part 1 Response:\\nTo be completely candid, digital technology is interwoven into virtually every aspect of my daily routine...\\n\\nPart 2 Cue Card Response:\\nToday I would like to talk about an AI-powered coding assistant that has revolutionized my productivity...\\n\\nPart 3 Discussion:\\nRegarding whether AI will supplant human educators, I firmly believe that while automated tools can deliver instruction, they lack the emotional intelligence and empathy inherent to human mentorship...",
      "examiner_notes": "Fluency: Effortless pacing with natural discourse markers. Lexical Resource: Idiomatic expressions used with precision. Grammar: Full flexibility with conditionals and inversion."
    },
    "tags": "speaking, ielts, cambridge, ${topicName.toLowerCase()}"
  }
]`,
    user: customPrompt
      ? `Create ${count || 1} authentic Cambridge IELTS 3-Part Speaking tests for: "${customPrompt}". Target Band: ${level || '7.5 - 8.5'}.`
      : `Create ${count || 1} authentic Cambridge IELTS 3-Part Speaking tests on topic "${topicName}". Target Band: ${level || '7.5 - 8.5'}.`
  }),

  ielts: ({ topicName, level, count, customPrompt }) => ({
    system: `You are an official Cambridge IELTS Senior Examiner. Create ${count || 1} authentic IELTS Exam tasks on topic "${topicName}", Target Band: ${level || '7.5 - 8.5'}.
CRITICAL REQUIREMENTS:
1. "title": Official IELTS Exam Title specifying task type (e.g. "IELTS Writing Task 2: Artificial Intelligence & Employment", "IELTS Academic Task 1: Global Energy Production", "IELTS Speaking Part 2: A Significant Technological Innovation").
2. "prompt": The EXACT official Cambridge IELTS prompt rubric:
   - For Task 2: "You should spend about 40 minutes on this task.\\n\\nWrite about the following topic:\\n\\n[Authentic IELTS debate statement or scenario]\\n\\n[Specific question prompt: e.g. To what extent do you agree or disagree? / Discuss both views and give your opinion.]\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words."
3. "content.task_type": Must be one of ["Writing Task 2 (Agree/Disagree)", "Writing Task 2 (Discussion & Opinion)", "Writing Task 2 (Problem & Solution)", "Writing Task 2 (Advantages & Disadvantages)", "Academic Writing Task 1", "Speaking Part 2 (Cue Card)"].
4. "content.target_band": "7.5 - 9.0"
5. "content.key_vocabulary": Array of 5-8 C1/C2 advanced lexical collocations with Vietnamese meanings.
6. "content.suggested_outline": 4-stage essay structure with bullet points.
7. "sample_solution.band_9_sample": A full 280-340 word Band 9.0 model essay demonstrating sophisticated cohesive devices, nuanced lexical resource, and complex grammatical structures (inversions, conditionals, passive voice, nominalisation).
8. "sample_solution.examiner_notes": Breakdown explaining why this response achieves Band 9.0 across TR, CC, LR, and GRA.
9. ONLY return a valid JSON ARRAY matching this schema:
[
  {
    "title": "IELTS Writing Task 2: Artificial Intelligence in Modern Workplace",
    "prompt": "You should spend about 40 minutes on this task.\\n\\nWrite about the following topic:\\n\\nSome people believe that artificial intelligence will transform the nature of human work positively, while others argue it will lead to mass unemployment and social crisis.\\n\\nDiscuss both views and give your own opinion.\\n\\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\\n\\nWrite at least 250 words.",
    "level": "${level || '7.5 - 8.5'}",
    "content": {
      "task_type": "Writing Task 2 (Discussion & Opinion)",
      "target_band": "7.5 - 9.0",
      "key_vocabulary": [
        "paramount importance (collocation): tầm quan trọng tối cao",
        "technological proliferation (n): sự bùng nổ công nghệ",
        "exacerbate disparities (v): làm trầm trọng thêm sự bất bình đẳng",
        "indispensable asset (n): tài sản/yếu tố không thể thiếu"
      ],
      "suggested_outline": "Introduction: Paraphrase debate + Clear thesis statement\\n- Body 1: Positive productivity and new job creation\\n- Body 2: Negative displacement concerns and structural unemployment\\n- Conclusion: Balanced synthesis with lifelong reskilling mandate"
    },
    "sample_solution": {
      "band_9_sample": "The advent of artificial intelligence (AI) has sparked intense debate concerning the future of the global labor market. While critics contend that widespread automation will culminate in unprecedented unemployment, proponents argue that AI will serve as a catalyst for productivity and novel industries. In my view, although transitional friction is inevitable, AI will ultimately elevate human occupational standards through synergy rather than outright substitution.\\n\\nOn the one hand, apprehensions regarding job displacement are well-founded...",
      "examiner_notes": "Task Response: Fully developed position with nuanced arguments. Lexical Resource: Natural use of low-frequency items. Grammar: Flawless variety with cleft sentences and nominalisations."
    },
    "tags": "ielts, writing_task_2, cambridge, ${topicName.toLowerCase()}"
  }
]`,
    user: customPrompt
      ? `Create ${count || 1} authentic Cambridge IELTS exam tasks for: "${customPrompt}".`
      : `Create ${count || 1} authentic Cambridge IELTS exam tasks on topic "${topicName}".`
  })
};

// ─── EVALUATION STRATEGIES ───────────────────────────────────
const EVALUATION_BUILDERS = {
  tech_question: (item, submission) => `Bạn là Senior Technical Architect đang phỏng vấn ứng viên.
Câu hỏi: "${item.title}"
Chi tiết: "${item.prompt || ''}"
Đáp án chuẩn: "${item.content?.detailed_answer || ''}"
Bài trả lời của ứng viên:
"""
${submission}
"""
QUY TẮC: CHỈ TRẢ VỀ JSON OBJECT:
{
  "score": 8.5,
  "summary": "Nhận xét tổng quan súc tích",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Điểm cần bổ sung 1"],
  "optimal_answer": "Gợi ý câu trả lời 1 phút tối ưu",
  "follow_up_trap": "Câu hỏi vặn vẹo tiếp theo"
}`,

  ielts: (item, submission) => `You are a certified British Council / Cambridge IELTS Senior Examiner.
Evaluate the candidate's response strictly according to the official IELTS Band Descriptors (Bands 0.0 - 9.0).
Exam Title: "${item.title}"
Prompt Rubric:
"""
${item.prompt || ''}
"""
Candidate's Submission:
"""
${submission}
"""
CRITICAL ASSESSMENT CRITERIA:
1. Task Achievement / Task Response (TR): Fully addresses all parts, clear position throughout, well-supported ideas.
2. Coherence and Cohesion (CC): Logical flow, clear paragraph progression, sophisticated use of cohesive devices.
3. Lexical Resource (LR): Wide lexical range, natural collocations, minimal errors, idiomatic expressions.
4. Grammatical Range and Accuracy (GRA): Wide variety of complex sentence structures, high accuracy, natural punctuation.

ONLY RETURN A VALID JSON OBJECT:
{
  "overall_band": 7.5,
  "criteria_scores": {
    "task_achievement": 7.5,
    "coherence_cohesion": 7.0,
    "lexical_resource": 8.0,
    "grammatical_range_accuracy": 7.5
  },
  "examiner_comment": "Comprehensive examiner assessment in Vietnamese & English detailing performance against Cambridge Band Descriptors",
  "strengths": ["Clear thesis statement and logical paragraphing", "Strong domain-specific vocabulary"],
  "improvements": ["Needs deeper elaboration on the secondary counter-argument in Body 2"],
  "detailed_corrections": [
    { "original": "error phrase in submission", "correction": "Band 8/9 standard correction", "reason": "Grammar/collocation explanation" }
  ]
}`,
  reading: (item, submission) => {
    const content = item.content || {};
    const questions = Array.isArray(content.comprehension_questions)
      ? content.comprehension_questions.join('\n')
      : (Array.isArray(content.guiding_questions) ? content.guiding_questions.join('\n') : '');
    const model = item.sample_solution?.model_answer || '';

    return `Bạn là Giảng viên Tiếng Anh học thuật (Cambridge Examiner) chấm bài đọc hiểu.
Bài đọc: "${item.title}"
Đoạn văn đọc hiểu:
"""
${item.prompt || ''}
"""
Câu hỏi đọc hiểu:
"""
${questions || 'Đọc hiểu và tóm tắt nội dung chính'}
"""
${model ? `Đáp án chuẩn tham khảo:\n"""\n${model}\n"""` : ''}

Câu trả lời của học viên:
"""
${submission}
"""
QUY TẮC: CHỈ TRẢ VỀ JSON OBJECT:
{
  "score": 8.5,
  "summary": "Nhận xét tổng quan về mức độ trả lời đúng trọng tâm các câu hỏi đọc hiểu",
  "strengths": ["Điểm làm tốt (hiểu đúng ý chính, scan thông tin chính xác)"],
  "improvements": ["Điểm cần bổ sung"],
  "detailed_corrections": [{ "original": "câu/từ tiếng Anh chưa chuẩn", "correction": "sửa đúng & tự nhiên hơn", "reason": "giải thích ngắn" }]
}`;
  },

  speaking: (item, submission) => `You are a certified British Council / Cambridge IELTS Senior Speaking Examiner.
Evaluate the candidate's speaking response strictly according to the official IELTS Speaking Band Descriptors (0.0 - 9.0).
Exam Title: "${item.title}"
Context / Cue Card:
"""
${item.prompt || ''}
"""
Candidate's Spoken Response / Transcript:
"""
${submission}
"""
CRITICAL ASSESSMENT CRITERIA:
1. Fluency & Coherence (FC): Speech rate, continuity, hesitation, natural use of discourse markers.
2. Lexical Resource (LR): Breadth of vocabulary, idioms, precision, paraphrasing.
3. Grammatical Range & Accuracy (GRA): Sentence variety, complex structures, grammatical accuracy.
4. Pronunciation & Natural Expression (PR): Intonation, rhythm, native phrasing.

ONLY RETURN A VALID JSON OBJECT:
{
  "overall_band": 7.5,
  "score": 7.5,
  "criteria_scores": {
    "fluency_coherence": 7.5,
    "lexical_resource": 8.0,
    "grammatical_range_accuracy": 7.5,
    "pronunciation": 7.0
  },
  "summary": "Examiner's summary evaluation in Vietnamese",
  "examiner_comment": "Detailed breakdown across the 4 IELTS criteria",
  "strengths": ["Spontaneous flow with minimal hesitation", "Great use of topic-specific collocations"],
  "improvements": ["Incorporate more variety in subordinate clauses"],
  "native_upgrades": [
    { "original": "simple phrase used by candidate", "upgrade": "idiomatic/C1 native equivalent", "reason": "Why this enhances Band score" }
  ]
}`,

  writing: (item, submission) => `You are a certified British Council / Cambridge IELTS Senior Writing Examiner.
Evaluate the candidate's writing response strictly according to official IELTS Writing Band Descriptors (0.0 - 9.0).
Exam Title: "${item.title}"
Prompt Rubric:
"""
${item.prompt || ''}
"""
Candidate's Essay Submission:
"""
${submission}
"""
CRITICAL ASSESSMENT CRITERIA:
1. Task Achievement / Task Response (TR): Fully develops position, supports ideas, answers all parts.
2. Coherence and Cohesion (CC): Paragraph progression, cohesive devices, logical flow.
3. Lexical Resource (LR): Range, collocations, precision, style.
4. Grammatical Range and Accuracy (GRA): Variety of complex sentences, grammatical precision.

ONLY RETURN A VALID JSON OBJECT:
{
  "overall_band": 7.5,
  "score": 7.5,
  "criteria_scores": {
    "task_achievement": 7.5,
    "coherence_cohesion": 7.0,
    "lexical_resource": 8.0,
    "grammatical_range_accuracy": 7.5
  },
  "summary": "Tổng quan nhận xét bài viết IELTS",
  "examiner_comment": "Chi tiết đánh giá theo 4 tiêu chí chuẩn Cambridge IELTS",
  "strengths": ["Clear thesis statement and logical paragraphing", "Strong academic vocabulary"],
  "improvements": ["Elaborate further on the second main idea"],
  "detailed_corrections": [
    { "original": "error sentence or phrase", "correction": "Band 8/9 standard correction", "reason": "Grammar / lexical explanation" }
  ]
}`,

  default: (item, submission) => `Bạn là Giáo viên chuyên môn cao đánh giá bài làm.
Đề bài: "${item.title}"
Bài nộp:
"""
${submission}
"""
QUY TẮC: CHỈ TRẢ VỀ JSON OBJECT:
{
  "score": 8.0,
  "summary": "Nhận xét tổng quan",
  "strengths": ["Điểm tốt"],
  "improvements": ["Cần sửa"]
}`
};

/**
 * Unified Learning Service for Tech Stacks and English Modules.
 */
class LearningService {
  /** @type {import('../models/LearningRepository')} */
  #learningRepo;

  /** @type {import('./AIService')} */
  #aiService;

  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /** @type {import('discord.js').Client|null} */
  #discordClient = null;

  constructor(learningRepo, aiService, configRepo) {
    this.#learningRepo = learningRepo;
    this.#aiService = aiService;
    this.#configRepo = configRepo;
  }

  setDiscordClient(client) {
    this.#discordClient = client;
  }

  #log(event, context = {}) {
    console.log(`[Learning] ${JSON.stringify({ event, source: 'learning', ...context })}`);
  }

  // ─── 1. UNIVERSAL AI CONTENT GENERATOR ───────────────────────
  async generateAIContent(params) {
    return this.generateContent({
      ...params,
      category: params.category || params.categorySlug,
      learning: params.learning || params.learningSlug || params.learningId,
      topic_no: params.topic_no || params.topicNo,
    });
  }

  async evaluateAISubmission(params) {
    return this.evaluateSubmission({
      ...params,
      item_id: params.item_id || params.itemId,
      user_submission: params.user_submission || params.submission || params.userSubmission,
    });
  }

  async generateContent({ category, type, learning, topic_no, level = 'junior', count = 5, prompt: customPrompt, model }) {
    // Keep the generator batch bounded for provider stability while allowing
    // the UI's supported presets: 5, 10, 20, and 30 items.
    const targetCount = Math.max(1, Math.min(parseInt(count, 10) || 5, 30));
    // Keep each response small enough for providers with a 1K-token limit.
    // Larger presets are assembled from several short, valid JSON batches.
    const batchSize = Math.min(targetCount, 3);
    const targetLevel = level || 'junior';
    const targetType = category === 'tech' ? 'tech_question' : (type || 'vocabulary');
    this.#log('generate_start', {
      category: category || null,
      type: targetType,
      learning: learning || null,
      topicNo: topic_no || null,
      level: targetLevel,
      count: targetCount,
    });

    let targetLearning = null;
    if (learning) {
      targetLearning = /^\d+$/.test(learning)
        ? await this.#learningRepo.findLearningById(Number(learning))
        : await this.#learningRepo.findLearningBySlug(String(learning));
    }
    if (!targetLearning && topic_no && category === 'english') {
      targetLearning = await this.#learningRepo.findLearningBySlug(`vocab-topic-${topic_no}`);
    }

    // Deduplication check for vocabulary
    let existingWords = [];
    if (targetType === 'vocabulary' && targetLearning) {
      const items = await this.#learningRepo.findItems({ learningId: targetLearning.id, type: 'vocabulary', limit: 300 });
      existingWords = items.map((i) => i.title.toLowerCase().trim());
    }

    const configKeyMap = {
      tech_question: 'learning_prompt_tech',
      vocabulary: 'learning_prompt_vocab',
      quiz: 'learning_prompt_quiz',
      reading: 'learning_prompt_reading',
      writing: 'learning_prompt_writing',
      speaking: 'learning_prompt_speaking',
      ielts: 'learning_prompt_ielts',
    };

    const customConfigPrompt = this.#configRepo.get(configKeyMap[targetType] || '')
      || (targetType === 'reading' ? this.#configRepo.get('learning_prompt_rw') : '');
    const vars = {
      stackName: targetLearning?.name || 'Web Engineering',
      topicName: targetLearning?.name || `Topic ${topic_no || 1}`,
      level: targetLevel,
      count: batchSize,
      customPrompt: customPrompt || '',
      existingWords: existingWords.slice(0, 50).join(', '),
    };

    let system = '';
    let user = '';

    if (customConfigPrompt && customConfigPrompt.trim()) {
      system = customConfigPrompt.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] !== undefined ? vars[k] : '');
      user = customPrompt
        ? `Tạo ${batchSize} nội dung theo yêu cầu: "${customPrompt}". Cấp độ: ${targetLevel}.`
        : `Tạo ${batchSize} nội dung cho ${vars.topicName || vars.stackName}, cấp độ: ${targetLevel}.`;
    } else {
      const builder = PROMPT_BUILDERS[targetType] || PROMPT_BUILDERS.vocabulary;
      const b = builder(vars);
      system = b.system;
      user = b.user;
    }

    if (targetType === 'tech_question') {
      system += `\n\nGIỚI HẠN ĐỘ DÀI BẮT BUỘC:\n- Mỗi title tối đa 12 từ.\n- Mỗi prompt tối đa 35 từ.\n- quick_answer tối đa 30 từ.\n- detailed_answer tối đa 80 từ.\n- Mỗi code_example tối đa 12 dòng.\n- interview_tips và practical_tips mỗi trường tối đa 25 từ.`;
    } else {
      // Reading passages and official Writing rubrics intentionally exceed
      // the short interview-question limits above. Keep their schemas intact.
      system += '\n\nDo not shorten or omit any field required by the schema above.';
    }
    system += `\n- Mỗi lần chỉ trả đúng tối đa ${batchSize} item, không thêm văn bản ngoài JSON ARRAY.`;

    const normalizeBatch = (parsed) => unpackItems(Array.isArray(parsed) ? parsed : [parsed])
      .map((item) => normalizeItem(item, { level: targetLevel }));
    const uniqueByTitle = (items) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = item.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    let items = normalizeBatch(this.#parseAIJson(
      await this.#aiService.chatOnce([{ role: 'user', content: `${system}\n\n${user}` }], model, 'learning')
    ));

    // Some providers return one object even when asked for an array. Ask for
    // the missing remainder instead of rendering a misleading one-item batch.
    const maxAttempts = Math.ceil(targetCount / batchSize) + 2;
    for (let attempt = 0; items.length < targetCount && attempt < maxAttempts; attempt++) {
      const remaining = Math.min(batchSize, targetCount - items.length);
      const existingTitles = items.map((item) => item.title).join(', ');
      const retryPrompt = `${user}\n\nBạn mới trả về ${items.length} item. Hãy tạo đúng ${remaining} item còn thiếu, chỉ trả về JSON ARRAY. Không lặp lại các tiêu đề: ${existingTitles}`;
      const retry = this.#parseAIJson(
        await this.#aiService.chatOnce([{ role: 'user', content: `${system}\n\n${retryPrompt}` }], model, 'learning')
      );
      items = uniqueByTitle([...items, ...normalizeBatch(retry)]);
    }

    items = uniqueByTitle(items);

    this.#log('generate_success', {
      type: targetType,
      learningId: targetLearning?.id || null,
      itemCount: items.length,
      requestedCount: targetCount,
    });

    return {
      learningId: targetLearning?.id || null,
      learningSlug: targetLearning?.slug || null,
      learningName: targetLearning?.name || 'General',
      type: targetType,
      items,
    };
  }

  async saveAIBatch({ learningId, type, items }) {
    const normalized = unpackItems(items);
    const itemType = type || (normalized[0] && normalized[0].type) || 'vocabulary';

    let targetLearningId = Number(learningId);
    let targetLearning = await this.#learningRepo.findLearningById(targetLearningId);

    if (itemType === 'reading') {
      if (!targetLearning || targetLearning.type !== 'reading') {
        const rLearning = await this.#learningRepo.findLearningBySlug('english-reading')
          || await this.#learningRepo.findLearningBySlug('english-rw');
        if (rLearning) targetLearningId = rLearning.id;
      }
    } else if (itemType === 'writing') {
      if (!targetLearning || targetLearning.type !== 'writing') {
        const wLearning = await this.#learningRepo.findLearningBySlug('english-writing');
        if (wLearning) targetLearningId = wLearning.id;
      }
    } else if (itemType === 'speaking') {
      if (!targetLearning || targetLearning.type !== 'speaking') {
        const spLearning = await this.#learningRepo.findLearningBySlug('english-speaking');
        if (spLearning) targetLearningId = spLearning.id;
      }
    } else if (itemType === 'ielts') {
      if (!targetLearning || targetLearning.type !== 'ielts') {
        const ieltsLearning = await this.#learningRepo.findLearningBySlug('english-ielts');
        if (ieltsLearning) targetLearningId = ieltsLearning.id;
      }
    }

    this.#log('save_batch_start', { learningId: targetLearningId, type: itemType, itemCount: normalized.length });
    const ids = [];
    for (const item of normalized) {
      ids.push(await this.#learningRepo.createItem({
        learningId: targetLearningId,
        type: itemType,
        title: item.title,
        prompt: item.prompt,
        level: item.level,
        content: item.content,
        sampleSolution: item.sample_solution,
        tags: item.tags,
        createdBy: 'ai',
      }));
    }
    this.#log('save_batch_success', { learningId: targetLearningId, type: itemType, itemCount: ids.length });
    return { count: ids.length, ids };
  }

  // ─── 2. UNIVERSAL AI EVALUATOR ───────────────────────────────
  async evaluateSubmission({ item_id, type, user_submission, username = 'learner', model }) {
    this.#log('evaluate_start', { itemId: item_id, type: type || null, username });
    const item = await this.#learningRepo.findItemById(item_id);
    if (!item) throw new Error(`Item #${item_id} not found`);

    const evalKeyMap = {
      tech_question: 'learning_prompt_eval_tech',
      ielts: 'learning_prompt_eval_ielts',
      writing: 'learning_prompt_eval_ielts',
      reading: 'learning_prompt_eval_rw',
      speaking: 'learning_prompt_eval_speaking',
    };
    const customConfigPrompt = this.#configRepo.get(evalKeyMap[type] || '');

    let prompt = '';
    if (customConfigPrompt && customConfigPrompt.trim()) {
      const vars = {
        title: item.title,
        prompt: item.prompt || '',
        detailedAnswer: item.content?.detailed_answer || '',
        submission: user_submission,
      };
      prompt = customConfigPrompt.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] !== undefined ? vars[k] : '');
    } else {
      const builder = EVALUATION_BUILDERS[type] || EVALUATION_BUILDERS.default;
      prompt = builder(item, user_submission);
    }

    const raw = await this.#aiService.chatOnce([{ role: 'user', content: prompt }], model, 'learning');
    const feedback = this.#parseAIJson(raw);
    const finalScore = feedback.score || feedback.overall_band || 7.0;

    await this.#learningRepo.upsertMetadata(item.id, username, {
      metaKey: 'evaluation',
      status: finalScore >= 7 ? 'mastered' : 'studying',
      score: finalScore,
      userSubmission: user_submission,
      aiFeedback: feedback,
    });

    this.#log('evaluate_success', { itemId: item.id, type: type || null, username, score: finalScore });

    return {
      itemId: item.id,
      score: finalScore,
      feedback,
    };
  }

  // ─── 3. VOCABULARY QUIZ ENGINE (DB-Driven) ────────────────────
  async generateQuizSession(opts = {}) {
    const limit = Math.max(3, Math.min(opts.count || 5, 50));
    this.#log('quiz_generate_start', { count: limit, topicNo: opts.topicNo || null, mode: opts.mode || 'multiple_choice' });
    const words = await this.#learningRepo.findItems({
      type: 'vocabulary',
      ...(opts.topicNo ? { topicNo: opts.topicNo } : {}),
      ...(opts.level ? { level: opts.level } : {}),
      // Load the complete 50-topic bank (repository cap: 1000) before the
      // adaptive shuffle. A 100-row window could silently restrict an exam
      // to only the first few topics.
      limit: 1000,
    });

    if (words.length < 3) {
      this.#log('quiz_generate_failed', { reason: 'insufficient_vocabulary', available: words.length, required: 3 });
      throw new Error('Chưa có đủ từ vựng trong CSDL để tạo bài kiểm tra (cần tối thiểu 3 từ)');
    }

    const history = opts.userId && typeof this.#learningRepo.getItemPerformance === 'function'
      ? await this.#learningRepo.getItemPerformance(opts.userId, words.map((word) => word.id))
      : [];
    const selected = weightedShuffle(words, performanceMap(history)).slice(0, limit);
    const optionLetters = ['A', 'B', 'C', 'D'];

    const questions = selected.map((item, idx) => {
      const c = item.content || {};
      const meaning = c.meaning || item.title;
      const otherMeanings = words
        .filter((w) => w.id !== item.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.content?.meaning || w.title);

      const options = [meaning, ...otherMeanings].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(meaning);

      return {
        id: item.id,
        index: idx + 1,
        word: item.title,
        pronunciation: c.pronunciation || '',
        example: c.example || '',
        note: c.note || '',
        level: item.level || 'beginner',
        options: options.map((opt, i) => `${optionLetters[i]}. ${opt}`),
        correct_option: optionLetters[correctIdx >= 0 ? correctIdx : 0],
        correct_meaning: meaning,
      };
    });

    const result = {
      total: questions.length,
      mode: opts.mode || 'multiple_choice',
      topicNo: opts.topicNo || null,
      questions,
    };
    this.#log('quiz_generate_success', { total: result.total, topicNo: result.topicNo, mode: result.mode });
    return result;
  }

  // Backward-compatible name used by the LearningController and older UI.
  async buildQuizFromVocab(opts = {}) {
    return this.generateQuizSession(opts);
  }

  async recordQuizScore(username, score, total, details = {}, userId = username) {
    const items = await this.#learningRepo.findItems({ type: 'vocabulary', limit: 1 });
    const itemId = items[0]?.id || 1;
    const numericScore = Number(((score / total) * 10).toFixed(1));
    this.#log('quiz_score_start', { username, score: Number(score), total: Number(total), normalizedScore: numericScore });
    const userSubmission = JSON.stringify({
      score: Number(score),
      total: Number(total),
      date: new Date().toISOString(),
    });

    if (typeof this.#learningRepo.insertQuizResult === 'function') {
      await this.#learningRepo.insertQuizResult(itemId, username, {
        score: numericScore,
        userSubmission,
        aiFeedback: details,
      });
    } else {
      // Compatibility for older repository adapters during rolling deploys.
      await this.#learningRepo.upsertMetadata(itemId, username, {
        metaKey: 'quiz_result',
        score: numericScore,
        userSubmission,
        aiFeedback: details,
      });
    }

    const attempts = Array.isArray(details?.attempts) ? details.attempts : [];
    const recorded = typeof this.#learningRepo.recordItemAttempts === 'function'
      ? await this.#learningRepo.recordItemAttempts(userId, username, 'vocabulary', attempts)
      : 0;

    this.#log('quiz_score_success', {
      username,
      score: Number(score),
      total: Number(total),
      normalizedScore: numericScore,
      itemId,
      attemptsRecorded: recorded,
    });
    return { ok: true, score, total, attemptsRecorded: recorded };
  }

  async recordPracticeExamAttempts(userId, username, attempts = []) {
    if (typeof this.#learningRepo.recordItemAttempts !== 'function') return 0;
    return this.#learningRepo.recordItemAttempts(userId, username, 'practice_exam', attempts);
  }

  /**
   * Get learning history with pagination and account summary.
   * @param {{ userId?: string, username?: string, isAdmin?: boolean, query?: object }} opts
   */
  async getLearningHistory({ userId, username, isAdmin = false, query = {} }) {
    const targetUserId = isAdmin && (query.userId || query.user_id)
      ? String(query.userId || query.user_id)
      : (isAdmin && (query.all === '1' || query.all === 'true') ? undefined : String(userId || username || ''));

    const targetUsername = isAdmin && query.username
      ? String(query.username)
      : (isAdmin && (query.userId || query.user_id || query.all === '1' || query.all === 'true') ? undefined : String(username || ''));

    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const page = Math.max(1, Number(query.page || 1));
    const offset = query.offset !== undefined ? Math.max(0, Number(query.offset)) : (page - 1) * limit;

    const filters = {
      userId: targetUserId,
      username: targetUsername,
      quizType: query.quiz_type || query.type,
      isCorrect: query.is_correct !== undefined ? query.is_correct : query.correct,
      learningSlug: query.learning || query.learning_slug,
      categorySlug: query.category || query.category_slug,
      search: query.search,
      startDate: query.start_date || query.startDate,
      endDate: query.end_date || query.endDate,
      limit,
      offset,
    };

    const [history, total, summary] = await Promise.all([
      typeof this.#learningRepo.findLearningHistory === 'function'
        ? this.#learningRepo.findLearningHistory(filters)
        : [],
      typeof this.#learningRepo.countLearningHistory === 'function'
        ? this.#learningRepo.countLearningHistory(filters)
        : 0,
      typeof this.#learningRepo.getUserLearningSummary === 'function'
        ? this.#learningRepo.getUserLearningSummary(targetUserId || userId, targetUsername || username)
        : null,
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      history,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        totalPages,
      },
      summary,
    };
  }

  /**
   * Get learning statistics summary for a user.
   * @param {{ userId?: string, username?: string }} opts
   */
  async getUserLearningStats({ userId, username }) {
    if (typeof this.#learningRepo.getUserLearningSummary === 'function') {
      return this.#learningRepo.getUserLearningSummary(userId, username);
    }
    return null;
  }

  // ─── 4. SELECTIVE DISCORD NOTIFICATIONS ──────────────────────
  getConfig() {
    const rawVocabEnabled = this.#configRepo.get('vocab_enabled');
    const rawNotifyEnabled = this.#configRepo.get('notify_vocab_enabled');
    const vocabEnabled = rawVocabEnabled !== null
      ? (rawVocabEnabled === 'true' || rawNotifyEnabled === 'true')
      : (rawNotifyEnabled !== 'false');

    return {
      notify_vocab_enabled: vocabEnabled,
      notify_tech_enabled: this.#configRepo.get('notify_tech_enabled') === 'true',
      notify_quiz_enabled: this.#configRepo.get('notify_quiz_enabled') === 'true',
      notify_ielts_enabled: this.#configRepo.get('notify_ielts_enabled') === 'true',
      daily_time: this.#configRepo.get('vocab_daily_time') || '08:00',
      words_per_day: Number(this.#configRepo.get('vocab_words_per_day') || 5),
      discord_channel_id: this.#configRepo.get('vocab_discord_channel_id') || this.#configRepo.get('schedule_discord_channel_id') || '',
      current_topic_no: Number(this.#configRepo.get('vocab_current_topic_no') || 1),
    };
  }

  async updateConfig(data) {
    const keys = [
      'notify_vocab_enabled', 'notify_tech_enabled', 'notify_quiz_enabled', 'notify_ielts_enabled',
      'vocab_daily_time', 'vocab_words_per_day', 'vocab_discord_channel_id', 'vocab_current_topic_no'
    ];
    for (const k of keys) {
      if (data[k] !== undefined) {
        await this.#configRepo.set(k, String(data[k]));
        if (k === 'notify_vocab_enabled') {
          await this.#configRepo.set('vocab_enabled', String(data[k]));
        }
      }
    }
  }

  async sendSingleItemToDiscord(itemId) {
    const item = await this.#learningRepo.findItemById(itemId);
    if (!item) throw new Error(`Item #${itemId} not found`);

    const channelId = this.getConfig().discord_channel_id;
    if (!channelId) throw new Error('Chưa cấu hình Discord Channel ID trong phần Cấu hình!');

    const message = item.type === 'vocabulary'
      ? [
        `📖 **TODAY'S VOCABULARY LESSON**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🎯 **${item.title.toUpperCase()}**${item.content?.pronunciation ? ` \`/${item.content.pronunciation.replace(/^\/|\/$/g, '')}/\`` : ''}`,
        `💡 **Nghĩa:** ${item.content?.meaning || ''}`,
        item.content?.example ? `📝 **Ví dụ:** *"${item.content.example}"*` : null,
        item.content?.note ? `💬 **Dịch nghĩa:** ${item.content.note}` : null,
        item.content?.collocations ? `🔗 **Collocations:** ${item.content.collocations.join(', ')}` : null,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Sent via Đần AI Learning Hub 🚀*`,
      ].filter(Boolean).join('\n')
      : [
        `💻 **DAILY TECH INTERVIEW QUESTION**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📌 **${item.title}**`,
        item.prompt ? `❓ **Đề bài:** ${item.prompt}` : null,
        item.content?.quick_answer ? `⚡ **Trả lời nhanh 30s:**\n${item.content.quick_answer}` : null,
        item.content?.code_example ? `💻 **Code:**\n\`\`\`${item.tags?.includes('php') ? 'php' : 'javascript'}\n${item.content.code_example}\n\`\`\`` : null,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Sent via Đần AI Learning Hub 🚀*`,
      ].filter(Boolean).join('\n');

    let sent = false;
    if (this.#discordClient) {
      try {
        const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased?.() || channel?.send) {
          console.log(`[Learning] ${JSON.stringify({ event: 'dispatch', source: 'learning', type: 'single_item', itemId: item.id, itemType: item.type, channelId })}`);
          await channel.send(message);
          sent = true;
        }
      } catch (_) { }
    }

    if (!sent) {
      const token = process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN : this.#configRepo.get('discord_token');
      if (token) {
        const discordApiUrl = process.env.DISCORD_API_BASE_URL;
        if (!discordApiUrl) {
          throw new Error('[LearningService] DISCORD_API_BASE_URL is required in environment');
        }
        const res = await fetch(`${discordApiUrl.replace(/\/$/, '')}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: message }),
        });
        if (res.ok) {
          sent = true;
        }
      }
    }

    if (sent) {
      await this.#learningRepo.markItemSent(item.id);
      console.log(`[Learning] ${JSON.stringify({ event: 'sent', source: 'learning', type: 'single_item', itemId: item.id, channelId })}`);
      return { ok: true, message: `Đã gửi item #${item.id} (${item.title}) sang Discord!` };
    }

    throw new Error('Discord bot client chưa sẵn sàng hoặc channel ID không hợp lệ');
  }

  // ─── 5. US IPA PRONUNCIATION AUTO-FETCHER ────────────────────
  async fillMissingPronunciations() {
    const items = await this.#learningRepo.findItems({ type: 'vocabulary', limit: 1000 });
    let updated = 0;
    let failed = 0;
    const batchSize = 10;

    const missing = items.filter((item) => {
      const pronunciation = item.content?.pronunciation;
      return !pronunciation || String(pronunciation).trim() === '';
    });

    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        const ipa = await this.#fetchUSIpa(item.title);
        if (!ipa) {
          failed++;
          return;
        }
        const content = { ...(item.content || {}), pronunciation: ipa };
        await this.#learningRepo.updateItem(item.id, { content });
        updated++;
      }));
    }
    return { total: missing.length, updated, failed };
  }

  async #fetchUSIpa(word) {
    try {
      const dictionaryUrl = process.env.DICTIONARY_API_URL;
      if (!dictionaryUrl) {
        throw new Error('[LearningService] DICTIONARY_API_URL is required in environment');
      }
      const cleanWord = encodeURIComponent(word.toLowerCase().trim().replace(/[^a-z-]/g, ''));
      const res = await fetch(`${dictionaryUrl.replace(/\/$/, '')}/${cleanWord}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const phonetics = Array.isArray(data) ? data[0]?.phonetics || [] : [];
      return (
        phonetics.find((p) => p.audio?.includes('-us.') || p.audio?.includes('/us/'))?.text ||
        phonetics.find((p) => p.text)?.text ||
        data[0]?.phonetic ||
        null
      );
    } catch {
      return null;
    }
  }

  // ─── 6. EXCEL EXPORT & IMPORT (xlsx) ─────────────────────────
  async exportToExcel(learningSlug = null) {
    const targetLearning = learningSlug && learningSlug !== 'all'
      ? await this.#learningRepo.findLearningBySlug(learningSlug)
      : null;

    const items = targetLearning
      ? await this.#learningRepo.findItems({ learningId: targetLearning.id, limit: 1000 })
      : await this.#learningRepo.findItems({ type: 'vocabulary', limit: 2000 });

    const isTech = items.some((i) => i.type === 'tech_question') || targetLearning?.type === 'tech_question';
    const rows = isTech
      ? [
        ['ID', 'Category', 'Stack', 'Title', 'Prompt', 'Level', 'Quick Answer', 'Detailed Answer', 'Code Example', 'Interview Tips', 'Practical Tips', 'Tags'],
        ...items.map((i) => [
          i.id, i.category_name || 'Tech', i.learning_name || 'General', i.title, i.prompt || '', i.level || 'junior',
          i.content?.quick_answer || '', i.content?.detailed_answer || '', i.content?.code_example || '',
          i.content?.interview_tips || '', i.content?.practical_tips || '', i.tags || '',
        ]),
      ]
      : [
        ['ID', 'Category', 'Topic', 'Word / Title', 'Pronunciation', 'Meaning', 'Example', 'Note', 'Status'],
        ...items.map((i) => [
          i.id, i.category_name || 'English', i.learning_name || 'General', i.title,
          i.content?.pronunciation || '', i.content?.meaning || '', i.content?.example || i.prompt || '',
          i.content?.note || '', i.is_sent ? 'Sent' : 'Unsent',
        ]),
      ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Vocabulary Bank');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(learningId, buffer) {
    const learning = await this.#learningRepo.findLearningById(learningId);
    if (!learning) throw new Error(`Learning #${learningId} not found`);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error('File Excel rỗng!');

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!rows.length) throw new Error('File Excel không có dữ liệu!');

    let created = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.length) continue;

      const title = String(r[3] || r[2] || r[1] || '').trim();
      if (!title) continue;

      const isTech = learning.type === 'tech_question';
      const content = isTech
        ? {
          quick_answer: String(r[6] || '').trim(),
          detailed_answer: String(r[7] || '').trim(),
          code_example: String(r[8] || '').trim(),
          interview_tips: String(r[9] || '').trim(),
          practical_tips: String(r[10] || '').trim(),
        }
        : {
          meaning: String(r[5] || r[3] || '').trim(),
          pronunciation: String(r[4] || '').trim(),
          example: String(r[6] || r[4] || '').trim(),
          note: String(r[7] || r[5] || '').trim(),
        };

      await this.#learningRepo.createItem({
        learningId: learning.id,
        type: learning.type || 'vocabulary',
        title,
        prompt: isTech ? String(r[4] || '').trim() : String(r[6] || r[4] || '').trim(),
        level: isTech ? String(r[5] || 'junior').trim() : undefined,
        content,
        tags: isTech ? String(r[11] || '').trim() : undefined,
        createdBy: 'import',
      });
      created++;
    }

    return { total: rows.length - 1, created };
  }

  // ─── 7. SMART SELF-HEALING AI JSON PARSER ─────────────────────
  #parseAIJson(text) {
    const raw = String(text || '').trim().replace(/^\uFEFF/, '');

    const structured = parseJson(raw);
    if (structured !== null) return structured;

    // 1. Strip markdown fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
    let candidate = fenceMatch ? fenceMatch[1].trim() : raw;

    // 2. Extract outermost [ ... ] or { ... }
    const match = candidate.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) candidate = match[0].trim();

    // 3. Fast-path: Standard JSON parse
    try {
      return JSON.parse(candidate);
    } catch (_) { }

    // 4. Smart Self-Healing Pipeline
    try {
      let repaired = candidate
        // Strip single-line (//) and multi-line (/* */) comments
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
        // Convert single-quoted string literals to double quotes
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
        // Quote unquoted object keys: { title: "abc" } -> { "title": "abc" }
        .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
        // Escape raw unescaped control characters inside double quotes
        .replace(/"((?:[^"\\]|\\.)*)"/gs, (_, str) =>
          '"' + str.replace(/[\n\r\t\b\f]/g, (c) => ({
            '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f'
          }[c] || '')) + '"'
        )
        // Strip trailing commas before } or ]
        .replace(/,\s*([\]}])/g, '$1');

      // Auto-balance missing closing brackets if truncated
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;

      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';

      return JSON.parse(repaired);
    } catch (_) { }

    // 5. Fallback: Parse structured plain text lines gracefully
    return this.#fallbackExtract(raw);
  }

  #fallbackExtract(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const items = [];
    let current = null;

    for (const line of lines) {
      const match = line.match(/^(?:(?:\d+\.|\-|\*|###)\s*)([^\:]+)(?:\:\s*(.*))?$/);
      if (match) {
        if (current) items.push(current);
        const title = match[1].replace(/[\*\#\`]/g, '').trim();
        const desc = (match[2] || '').trim();
        current = {
          title,
          prompt: desc,
          level: 'junior',
          content: { meaning: desc || title, quick_answer: desc, detailed_answer: desc },
        };
      } else if (current) {
        current.content.detailed_answer = (current.content.detailed_answer ? current.content.detailed_answer + '\n' : '') + line;
      }
    }
    if (current) items.push(current);

    return items.length > 0
      ? items
      : [{ title: 'Generated Content', prompt: text.slice(0, 300), level: 'junior', content: { quick_answer: text, detailed_answer: text } }];
  }
}

module.exports = LearningService;
