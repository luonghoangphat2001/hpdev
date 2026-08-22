import {
  getLearnings,
  createLearningItem,
  deleteLearningItem,
  toggleLearningBookmark,
  getLearningConfig,
  saveLearningConfig,
} from '../../api/learning.js';

export const crudFeature = {
  async openCreateItemModal(type = 'tech_question') {
    const modal = document.getElementById('learning-item-crud-modal');
    if (!modal) return;

    const isTech = type === 'tech_question';
    const category = isTech ? 'tech' : 'english';
    const res = await getLearnings(category);

    const select = document.getElementById('crud-learning-id');
    if (select && res?.ok) {
      select.innerHTML = res.learnings.map(l => `
        <option value="${l.id}">${l.name}</option>
      `).join('');
    }

    document.getElementById('crud-item-id').value = '';
    document.getElementById('crud-title').value = '';
    document.getElementById('crud-meaning').value = '';
    document.getElementById('crud-pronunciation').value = '';
    document.getElementById('crud-prompt').value = '';
    document.getElementById('crud-note').value = '';

    modal.classList.remove('hidden');
  },

  async saveCrudItem() {
    const learningId = document.getElementById('crud-learning-id')?.value;
    const title = document.getElementById('crud-title')?.value?.trim();
    const meaning = document.getElementById('crud-meaning')?.value?.trim();
    const pronunciation = document.getElementById('crud-pronunciation')?.value?.trim();
    const prompt = document.getElementById('crud-prompt')?.value?.trim();
    const note = document.getElementById('crud-note')?.value?.trim();

    if (!learningId || !title) {
      alert('Vui lòng nhập đầy đủ Chủ đề và Tiêu đề');
      return;
    }

    const res = await createLearningItem({
      learning_id: Number(learningId),
      type: this.activeCategory === 'tech' ? 'tech_question' : 'vocabulary',
      title,
      prompt,
      content: {
        meaning,
        pronunciation,
        note,
      },
    });

    if (res?.ok) {
      alert('Đã thêm thành công!');
      this.closeModal('learning-item-crud-modal');
      if (this.activeCategory === 'tech') this.loadTechQuestions();
      else this.loadVocabWords();
    } else {
      alert(res?.error || 'Thêm thất bại');
    }
  },

  async deleteItem(id) {
    if (!confirm('Bạn có chắc muốn xóa item này không?')) return;
    const res = await deleteLearningItem(id);
    if (res?.ok) {
      if (this.activeCategory === 'tech') {
        this.loadTechQuestions();
      } else {
        if (this.activeEnglishSubTab === 'vocab') this.loadVocabWords();
        if (this.activeEnglishSubTab === 'rw') this.loadReadingWriting();
        if (this.activeEnglishSubTab === 'speaking') this.loadSpeaking();
        if (this.activeEnglishSubTab === 'ielts') this.loadIelts();
      }
    } else {
      alert(res?.error || 'Xóa thất bại');
    }
  },

  async toggleBookmark(id) {
    const item = this.techQuestions.find(q => q.id === id);
    if (!item) return;

    const nextState = item.is_bookmarked === 1 ? 0 : 1;
    const res = await toggleLearningBookmark(id, nextState);
    if (res?.ok) {
      item.is_bookmarked = nextState;
      this.renderTechList();
    }
  },

  async loadNotificationConfig() {
    const res = await getLearningConfig();
    if (!res?.ok || !res.config) return;
    const c = res.config;

    const notifyCheck = document.getElementById('learning-vocab-notify');
    const timeInput = document.getElementById('learning-vocab-time');
    const countInput = document.getElementById('learning-vocab-count');
    const channelInput = document.getElementById('learning-vocab-channel');

    if (notifyCheck) notifyCheck.checked = c.notify_vocab_enabled !== false;
    if (timeInput) timeInput.value = c.daily_time || '08:00';
    if (countInput) countInput.value = c.words_per_day || 5;
    if (channelInput) channelInput.value = c.discord_channel_id || '';
  },

  async saveNotificationConfig() {
    const data = {
      notify_vocab_enabled: document.getElementById('learning-vocab-notify')?.checked,
      vocab_daily_time: document.getElementById('learning-vocab-time')?.value,
      vocab_words_per_day: document.getElementById('learning-vocab-count')?.value,
      vocab_discord_channel_id: document.getElementById('learning-vocab-channel')?.value,
    };

    const res = await saveLearningConfig(data);
    if (res?.ok) {
      alert('Đã lưu cấu hình thông báo Discord thành công!');
    } else {
      alert('Lưu cấu hình thất bại');
    }
  },
};
