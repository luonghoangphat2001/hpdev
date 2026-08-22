import {
  getLearnings,
  getLearningDetail,
  generateLearningAI,
  saveLearningAIBatch,
} from '../../api/learning.js';

export const aiGeneratorFeature = {
  async openAIGeneratorModal(defaultType = 'tech_question', defaultSlug = null) {
    const modal = document.getElementById('learning-ai-generator-modal');
    if (!modal) return;

    const typeSelect = document.getElementById('modal-ai-type');
    if (typeSelect) typeSelect.value = defaultType;

    await this.onModalTypeChange(defaultSlug);
    document.getElementById('modal-ai-preview-area')?.classList.add('hidden');
    modal.classList.remove('hidden');
  },

  async onModalTypeChange(preferredSlug = null) {
    const type = document.getElementById('modal-ai-type')?.value || 'tech_question';
    const isTech = type === 'tech_question';
    const labelEl = document.getElementById('modal-ai-learning-label');
    const slugSelect = document.getElementById('modal-ai-learning-slug');
    if (!slugSelect) return;

    if (isTech) {
      if (labelEl) labelEl.textContent = '💻 Tech Stack';
      const res = await getLearnings('tech');
      if (!res?.ok || !res.learnings) return;

      slugSelect.innerHTML = res.learnings.map(l => `
        <option value="${l.slug}">${l.icon || '💻'} ${l.name}</option>
      `).join('');

      const targetSlug = preferredSlug || this.activeTechSlug || res.learnings[0]?.slug;
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    // English types
    const [skillsRes, vocabRes] = await Promise.all([
      getLearnings('english'),
      getLearnings('english', 'vocabulary'),
    ]);

    const skills = (skillsRes?.learnings || []).filter(l => l.type !== 'vocabulary');
    const vocabTopics = vocabRes?.learnings || [];

    if (type === 'vocabulary') {
      if (labelEl) labelEl.textContent = '📖 Chủ đề từ vựng (Topic 1 - 50)';
      slugSelect.innerHTML = vocabTopics.map(t => `
        <option value="${t.slug}">${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
      `).join('');

      const targetSlug = preferredSlug || (this.activeTopicNo ? `vocab-topic-${this.activeTopicNo}` : vocabTopics[0]?.slug);
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    if (type === 'quiz') {
      if (labelEl) labelEl.textContent = '🧩 Chủ đề Trắc nghiệm';
      const quizSkill = skills.find(s => s.type === 'quiz') || { slug: 'english-quiz', name: 'Quiz & Practice (Tổng hợp)' };

      let html = `<option value="${quizSkill.slug}">${quizSkill.icon || '🧩'} ${quizSkill.name}</option>`;
      if (vocabTopics.length) {
        html += `<optgroup label="Luyện trắc nghiệm theo Chủ đề từ vựng">`;
        html += vocabTopics.map(t => `
          <option value="${t.slug}">📖 ${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
        `).join('');
        html += `</optgroup>`;
      }
      slugSelect.innerHTML = html;

      const targetSlug = preferredSlug || (this.activeTopicNo ? `vocab-topic-${this.activeTopicNo}` : quizSkill.slug);
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    if (type === 'reading') {
      if (labelEl) labelEl.textContent = '📖 Chủ đề bài Đọc Hiểu';
      const rSkill = skills.find(s => s.slug === 'english-reading' || s.type === 'reading') || { slug: 'english-reading', name: 'Reading Practice' };

      let html = `<option value="${rSkill.slug}">${rSkill.icon || '📖'} ${rSkill.name} (Chung)</option>`;
      if (vocabTopics.length) {
        html += `<optgroup label="Soạn bài đọc theo Chủ đề từ vựng">`;
        html += vocabTopics.map(t => `
          <option value="${t.slug}">📖 ${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
        `).join('');
        html += `</optgroup>`;
      }
      slugSelect.innerHTML = html;

      const targetSlug = preferredSlug || rSkill.slug;
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    if (type === 'writing') {
      if (labelEl) labelEl.textContent = '✍️ Chủ đề bài Luyện Viết';
      const wSkill = skills.find(s => s.slug === 'english-writing' || s.type === 'writing') || { slug: 'english-writing', name: 'Writing Studio' };

      let html = `<option value="${wSkill.slug}">${wSkill.icon || '✍️'} ${wSkill.name} (Chung)</option>`;
      if (vocabTopics.length) {
        html += `<optgroup label="Soạn đề viết theo Chủ đề từ vựng">`;
        html += vocabTopics.map(t => `
          <option value="${t.slug}">📖 ${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
        `).join('');
        html += `</optgroup>`;
      }
      slugSelect.innerHTML = html;

      const targetSlug = preferredSlug || wSkill.slug;
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    if (type === 'speaking') {
      if (labelEl) labelEl.textContent = '🗣️ Chủ đề Luyện Nói & Phỏng Vấn';
      const spSkill = skills.find(s => s.type === 'speaking') || { slug: 'english-speaking', name: 'Speaking Practice' };

      let html = `<option value="${spSkill.slug}">${spSkill.icon || '🗣️'} ${spSkill.name} (Phỏng vấn & Giao tiếp)</option>`;
      if (vocabTopics.length) {
        html += `<optgroup label="Luyện nói theo Chủ đề từ vựng">`;
        html += vocabTopics.map(t => `
          <option value="${t.slug}">📖 ${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
        `).join('');
        html += `</optgroup>`;
      }
      slugSelect.innerHTML = html;

      const targetSlug = preferredSlug || spSkill.slug;
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }

    if (type === 'ielts') {
      if (labelEl) labelEl.textContent = '🎯 Dạng đề IELTS (Writing / Speaking)';
      const ieltsSkill = skills.find(s => s.type === 'ielts') || { slug: 'english-ielts', name: 'IELTS Prep (0.0 - 9.0)' };

      let html = `<option value="${ieltsSkill.slug}">${ieltsSkill.icon || '🎯'} ${ieltsSkill.name}</option>`;
      if (vocabTopics.length) {
        html += `<optgroup label="Đề thi IELTS theo Chủ đề nâng cao">`;
        html += vocabTopics.map(t => `
          <option value="${t.slug}">📖 ${t.name || `Topic ${t.topic_no}`}${t.description ? ` — ${t.description}` : ''}</option>
        `).join('');
        html += `</optgroup>`;
      }
      slugSelect.innerHTML = html;

      const targetSlug = preferredSlug || ieltsSkill.slug;
      if (targetSlug) slugSelect.value = targetSlug;
      return;
    }
  },

  async submitAIGenerator() {
    const btn = document.getElementById('modal-ai-btn-submit');
    const type = document.getElementById('modal-ai-type')?.value;
    const learningSlug = document.getElementById('modal-ai-learning-slug')?.value;
    const level = document.getElementById('modal-ai-level')?.value;
    const count = document.getElementById('modal-ai-count')?.value;
    const customPrompt = document.getElementById('modal-ai-custom-prompt')?.value;

    let topicNo = this.activeTopicNo;
    if (learningSlug && learningSlug.startsWith('vocab-topic-')) {
      const parsedNo = Number(learningSlug.replace('vocab-topic-', ''));
      if (!isNaN(parsedNo)) topicNo = parsedNo;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Đần AI đang suy nghĩ và tạo nội dung...';
    }

    try {
      const res = await generateLearningAI({
        category: type === 'tech_question' ? 'tech' : 'english',
        type,
        learning: learningSlug,
        topic_no: topicNo,
        level,
        count,
        prompt: customPrompt,
      });

      if (!res?.ok || !res.items) {
        alert(res?.error || 'Có lỗi xảy ra khi gọi AI');
        return;
      }

      this.aiGeneratedItems = res.items;
      this.renderAIPreview(res.items);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✨</span> Bắt đầu tạo nội dung bằng AI';
      }
    }
  },

  renderAIPreview(items) {
    const previewArea = document.getElementById('modal-ai-preview-area');
    const countEl = document.getElementById('modal-ai-preview-count');
    const listEl = document.getElementById('modal-ai-preview-list');

    if (!previewArea || !listEl) return;
    previewArea.classList.remove('hidden');
    if (countEl) countEl.textContent = `${items.length} items`;

    listEl.innerHTML = items.map((it, idx) => `
      <div class="p-3 bg-gray-900 rounded-xl border border-gray-700 space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-white text-xs">${idx + 1}. ${it.title}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-900/60 rounded text-indigo-300">${it.level || 'junior'}</span>
        </div>
        <p class="text-gray-300 text-[11px]">${it.content?.meaning || it.content?.quick_answer || it.prompt || ''}</p>
      </div>
    `).join('');
  },

  async saveAIGeneratedBatch() {
    if (!this.aiGeneratedItems.length) return;

    const learningSlug = document.getElementById('modal-ai-learning-slug')?.value;
    const type = document.getElementById('modal-ai-type')?.value;

    let targetSlug = learningSlug;
    if (type === 'reading') targetSlug = 'english-reading';
    else if (type === 'writing') targetSlug = 'english-writing';
    else if (type === 'speaking') targetSlug = 'english-speaking';
    else if (type === 'ielts') targetSlug = 'english-ielts';

    let learningRes = await getLearningDetail(targetSlug);
    let learningId = learningRes?.learning?.id;

    if (!learningId && (type === 'reading' || type === 'writing')) {
      learningRes = await getLearningDetail('english-rw');
      learningId = learningRes?.learning?.id;
    }

    if (!learningId && learningSlug) {
      learningRes = await getLearningDetail(learningSlug);
      learningId = learningRes?.learning?.id;
    }

    if (!learningId) {
      alert('Không tìm thấy Topic/Stack ID để lưu');
      return;
    }

    const res = await saveLearningAIBatch({
      learning_id: learningId,
      type,
      items: this.aiGeneratedItems,
    });

    if (res?.ok) {
      alert(`Đã lưu thành công ${res.count} items vào Ngân hàng!`);
      this.closeModal('learning-ai-generator-modal');
      await this.loadVocabTopics();
      if (type === 'tech_question') this.loadTechQuestions();
      if (type === 'vocabulary') this.loadVocabWords();
      if (type === 'reading') this.loadReading();
      if (type === 'writing') this.loadWriting();
      if (type === 'speaking') this.loadSpeaking();
      if (type === 'ielts') this.loadIelts();
      if (type === 'quiz') this.loadQuiz();
    } else {
      alert(res?.error || 'Lưu thất bại');
    }
  },
};
