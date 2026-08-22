import {
  evaluateLearningAI,
} from '../../api/learning.js';

export const evaluatorFeature = {
  openMockInterviewModal() {
    const item = this.activeTechQuestion;
    if (!item) {
      alert('Vui lòng chọn 1 câu hỏi kỹ thuật trước!');
      return;
    }

    this.currentEvaluationItem = item;
    const modal = document.getElementById('learning-evaluator-modal');
    const titleEl = document.getElementById('evaluator-question-title');
    const promptEl = document.getElementById('evaluator-question-prompt');
    const badgeEl = document.getElementById('evaluator-question-badge');
    const feedbackArea = document.getElementById('evaluator-feedback-area');

    if (titleEl) titleEl.textContent = item.title;
    if (promptEl) promptEl.textContent = item.prompt || item.content?.detailed_answer || '';
    if (badgeEl) badgeEl.textContent = `Câu hỏi phỏng vấn — ${item.learning_name || 'Tech'}`;
    if (feedbackArea) feedbackArea.classList.add('hidden');

    const userSubInput = document.getElementById('evaluator-user-submission');
    if (userSubInput) userSubInput.value = '';
    modal?.classList.remove('hidden');
  },

  async submitAIEvaluation() {
    if (!this.currentEvaluationItem) return;
    const userSubmission = document.getElementById('evaluator-user-submission')?.value?.trim();
    if (!userSubmission) {
      alert('Vui lòng nhập câu trả lời của bạn!');
      return;
    }

    const btn = document.getElementById('evaluator-btn-submit');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Đần AI đang phân tích và chấm điểm...';
    }

    try {
      const res = await evaluateLearningAI({
        item_id: this.currentEvaluationItem.id,
        type: this.currentEvaluationItem.type || 'tech_question',
        user_submission: userSubmission,
      });

      if (!res?.ok || !res.feedback) {
        alert(res?.error || 'Lỗi khi chấm điểm');
        return;
      }

      this.renderEvaluationFeedback(res.feedback);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🤖</span> Đần AI Chấm Điểm & Nhận Xét';
      }
    }
  },

  renderEvaluationFeedback(fb) {
    const area = document.getElementById('evaluator-feedback-area');
    if (!area) return;
    area.classList.remove('hidden');

    const score = fb.score || fb.overall_band || 0;
    const isGood = score >= 7;

    area.innerHTML = `
      <div class="p-4 rounded-xl border ${isGood ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-amber-950/40 border-amber-700/60'} space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-white">Kết Quả Đánh Giá Từ Đần AI</span>
          <span class="text-lg font-black ${isGood ? 'text-emerald-400' : 'text-amber-400'} font-mono">${score} / 10</span>
        </div>
        <p class="text-xs text-gray-200 leading-relaxed font-medium">${fb.summary || fb.examiner_comment || ''}</p>

        ${fb.strengths?.length ? `
          <div>
            <span class="font-bold text-emerald-400 text-[10px] block mb-1">✅ Điểm mạnh:</span>
            <ul class="list-disc list-inside text-gray-300 text-[11px] space-y-0.5">
              ${fb.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fb.improvements?.length ? `
          <div>
            <span class="font-bold text-amber-400 text-[10px] block mb-1">⚠️ Cần cải thiện / Bổ sung:</span>
            <ul class="list-disc list-inside text-gray-300 text-[11px] space-y-0.5">
              ${fb.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fb.optimal_answer ? `
          <div class="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <span class="font-bold text-indigo-400 text-[10px] block mb-1">⚡ Gợi ý câu trả lời 1 phút tối ưu:</span>
            <p class="text-gray-300 text-[11px] leading-relaxed">${fb.optimal_answer}</p>
          </div>
        ` : ''}

        ${fb.follow_up_trap ? `
          <div class="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <span class="font-bold text-purple-400 text-[10px] block mb-1">❓ Câu hỏi vặn vẹo tiếp theo của Interviewer:</span>
            <p class="text-purple-200 text-[11px] leading-relaxed italic">"${fb.follow_up_trap}"</p>
          </div>
        ` : ''}
      </div>
    `;
  },
};
