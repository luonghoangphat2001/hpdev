import {
  getLearningItems,
  evaluateLearningAI,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const speakingFeature = {
  async loadSpeaking() {
    const ws = document.getElementById('speaking-workspace');
    if (!ws) return;

    ws.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">⏳ Đang tải kịch bản luyện nói...</div>`;

    const res = await getLearningItems({
      category: 'english',
      type: 'speaking',
      level: this.englishFilterLevel,
      limit: 100,
    });

    this.speakingTopics = res?.items || [];

    if (!this.speakingTopics.length) {
      ws.innerHTML = `
        <div class="p-8 bg-gray-900 rounded-2xl border border-gray-700 text-center space-y-4 max-w-2xl mx-auto">
          <span class="text-4xl">🗣️</span>
          <h3 class="text-base font-bold text-white">AI Speech & Phỏng Vấn Giao Tiếp</h3>
          <p class="text-xs text-gray-400 leading-relaxed">
            Chưa có kịch bản luyện nói nào trong Ngân Hàng. Hãy bấm nút tạo chủ đề bên dưới để Đần AI soạn tình huống phản xạ nhé!
          </p>
          <button data-action="learning.openAIGeneratorModal" data-action-args='["speaking"]' class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow">
            ✨ Tạo Topic Luyện Nói Bằng AI
          </button>
        </div>
      `;
      return;
    }

    const requestedTopic = this.pendingEnglishItemId
      ? this.speakingTopics.find(t => t.id === this.pendingEnglishItemId)
      : null;
    this.pendingEnglishItemId = null;

    if (requestedTopic) {
      this.selectSpeakingTopic(requestedTopic.id, { updateUrl: false });
    } else if (!this.activeSpeakingTopic || !this.speakingTopics.some(t => t.id === this.activeSpeakingTopic.id)) {
      this.selectSpeakingTopic(this.speakingTopics[0].id, { updateUrl: false });
    } else {
      this.renderSpeakingWorkspace();
    }
  },

  selectSpeakingTopic(id, { updateUrl = true } = {}) {
    this.activeSpeakingTopic = this.speakingTopics.find(t => t.id === Number(id)) || null;
    this.showSpeakingSample = false;
    this.renderSpeakingWorkspace();
    if (updateUrl) this.syncUrl();
  },

  renderSpeakingWorkspace() {
    const ws = document.getElementById('speaking-workspace');
    if (!ws) return;

    const current = this.activeSpeakingTopic;
    if (!current) return;

    const content = current.content || {};
    const sample = current.sample_solution || {};
    const targetExpr = Array.isArray(content.target_expressions) ? content.target_expressions : [];
    const sampleResponse = sample.sample_response || sample.model_answer || '';
    const part1 = Array.isArray(content.part1_questions) ? content.part1_questions : [];
    const cueCard = content.part2_cue_card || null;
    const part3 = Array.isArray(content.part3_questions) ? content.part3_questions : [];

    ws.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-full min-h-0">
        <!-- Left: Topics List -->
        <div class="lg:col-span-4 bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 shadow-lg flex flex-col h-auto lg:h-full max-h-[40vh] lg:max-h-none min-h-0 overflow-hidden gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-gray-700 shrink-0">
            <h4 class="font-bold text-white text-xs">Chủ đề luyện nói (${this.speakingTopics.length})</h4>
            <button data-action="learning.openAIGeneratorModal" data-action-args='["speaking"]'
              class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition">
              + Tạo mới
            </button>
          </div>
          <div class="space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
            ${this.speakingTopics.map((item) => {
              const isSelected = item.id === current.id;
              return `
                <div data-action="learning.selectSpeakingTopic" data-action-args="${encodeActionArgs(item.id)}"
                  class="p-3 rounded-xl cursor-pointer border transition text-left space-y-1 group ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-md text-white'
                      : 'bg-gray-900/60 border-gray-700/60 text-gray-300 hover:bg-gray-750'
                  }">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs truncate ${isSelected ? 'text-indigo-300' : 'text-white'}">${item.title}</span>
                    <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(item.id)}" title="Xóa"
                      class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-[11px] p-0.5">🗑️</button>
                  </div>
                  <p class="text-[11px] text-gray-400 line-clamp-1">${item.prompt || ''}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Speaking Studio -->
        <div class="lg:col-span-8 bg-gray-800/90 rounded-2xl p-6 border border-gray-700/80 shadow-lg space-y-5 h-auto lg:h-full min-h-0 overflow-visible lg:overflow-y-auto overscroll-contain">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/60 font-semibold text-[10px]">
                🗣️ ${current.level || 'IELTS Speaking'}
              </span>
              <span class="text-xs text-gray-400 font-mono">#${current.id}</span>
            </div>
            <h3 class="text-lg font-bold text-white">${current.title}</h3>
          </div>

          <!-- IELTS 3-Part Speaking Structure -->
          <div class="bg-gray-900/90 rounded-2xl p-5 border border-gray-700 space-y-4 shadow-inner">
            
            ${part1.length ? `
              <!-- Part 1 -->
              <div class="p-4 bg-gray-950/70 rounded-xl border border-gray-800 space-y-2">
                <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-800">
                  Part 1: Introduction & Everyday Interview
                </span>
                <ul class="list-disc list-inside text-xs text-gray-200 space-y-1.5 pt-1">
                  ${part1.map(q => `<li class="leading-relaxed">${q}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${cueCard ? `
              <!-- Part 2: Cue Card -->
              <div class="p-4 bg-gradient-to-br from-indigo-950/60 to-gray-950 rounded-xl border border-indigo-700/70 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded bg-indigo-900 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                    Part 2: Candidate Cue Card (Individual Long Turn)
                  </span>
                  <span class="text-[10px] font-mono text-indigo-300">⏱️ Prep: 1 min • Speak: 2 min</span>
                </div>
                <h4 class="text-sm font-bold text-white">${cueCard.topic || current.title}</h4>
                <div class="text-xs text-gray-300 space-y-1 bg-gray-900/80 p-3 rounded-lg border border-indigo-900/40">
                  <p class="font-semibold text-indigo-300">You should say:</p>
                  <ul class="list-disc list-inside space-y-1">
                    ${(cueCard.bullet_points || []).map(b => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}

            ${part3.length ? `
              <!-- Part 3 -->
              <div class="p-4 bg-gray-950/70 rounded-xl border border-gray-800 space-y-2">
                <span class="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-800">
                  Part 3: Two-Way Analytical Discussion
                </span>
                <ul class="list-disc list-inside text-xs text-gray-200 space-y-1.5 pt-1">
                  ${part3.map(q => `<li class="leading-relaxed">${q}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${!part1.length && !cueCard && !part3.length ? `
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  💬 Tình huống & Câu hỏi phản xạ:
                </span>
                <p class="text-gray-200 text-sm font-medium leading-relaxed bg-gray-950/60 p-4 rounded-xl border border-gray-800 whitespace-pre-wrap">
                  ${current.prompt || 'Chưa có câu hỏi.'}
                </p>
              </div>
            ` : ''}

            ${targetExpr.length ? `
              <div class="pt-2">
                <span class="text-[11px] font-bold text-emerald-400 block mb-1.5">🎯 Cụm từ C1/C2 nên dùng (Target Expressions):</span>
                <div class="flex flex-wrap gap-1.5">
                  ${targetExpr.map(e => `<span class="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] rounded-lg">${e}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Practice / Speech Input -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-white">Câu trả lời / Luyện nói của bạn:</label>
              <button id="speaking-btn-mic" data-action="learning.toggleSpeechRecognition"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition">
                <span>🎙️</span> Bật Micro Nói
              </button>
            </div>
            <textarea id="speaking-user-submission" rows="5"
              placeholder="Nói qua micro (Voice-to-Text) hoặc nhập nội dung câu trả lời luyện nói tại đây..."
              class="w-full px-4 py-3 bg-gray-900 rounded-xl border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm leading-relaxed resize-none shadow-inner"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button id="speaking-btn-eval" data-action="learning.submitSpeakingEvaluation"
                class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2">
                <span>🤖</span> AI Coach Nhận Xét & Sửa Lỗi
              </button>
              ${sampleResponse ? `
                <button data-action="learning.toggleSpeakingSample"
                  class="px-4 py-2.5 bg-gray-750 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition flex items-center gap-1.5">
                  <span>💬</span> ${this.showSpeakingSample ? 'Ẩn Trả Lời Mẫu' : 'Xem Trả Lời Mẫu'}
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Sample Response Card -->
          ${this.showSpeakingSample && sampleResponse ? `
            <div class="p-4 bg-indigo-950/40 rounded-xl border border-indigo-700/60 space-y-2">
              <span class="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬</span> Câu Trả Lời Mẫu Band 8.5+ (Native Sample Transcript)
              </span>
              <p class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-950/60 p-3.5 rounded-lg border border-indigo-900/50 font-serif">
                ${sampleResponse}
              </p>
            </div>
          ` : ''}

          <!-- AI Evaluation Container -->
          <div id="speaking-feedback-area" class="hidden"></div>
        </div>
      </div>
    `;
  },

  toggleSpeakingSample() {
    this.showSpeakingSample = !this.showSpeakingSample;
    this.renderSpeakingWorkspace();
  },

  toggleSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể gõ trực tiếp vào ô văn bản!');
      return;
    }

    const micBtn = document.getElementById('speaking-btn-mic');
    const textarea = document.getElementById('speaking-user-submission');

    if (this.isRecordingSpeaking) {
      this.speechRecognitionInstance?.stop();
      this.isRecordingSpeaking = false;
      if (micBtn) {
        micBtn.classList.remove('bg-red-600', 'animate-pulse');
        micBtn.classList.add('bg-indigo-600');
        micBtn.innerHTML = '<span>🎙️</span> Bật Micro Nói';
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        this.isRecordingSpeaking = true;
        if (micBtn) {
          micBtn.classList.remove('bg-indigo-600');
          micBtn.classList.add('bg-red-600', 'animate-pulse');
          micBtn.innerHTML = '<span>⏹️</span> Đang thu âm... (Bấm để dừng)';
        }
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (textarea && transcript) {
          textarea.value = (textarea.value ? textarea.value + ' ' : '') + transcript;
        }
      };

      recognition.onerror = (err) => {
        console.error('Speech error:', err);
        this.isRecordingSpeaking = false;
        if (micBtn) {
          micBtn.classList.remove('bg-red-600', 'animate-pulse');
          micBtn.classList.add('bg-indigo-600');
          micBtn.innerHTML = '<span>🎙️</span> Bật Micro Nói';
        }
      };

      recognition.onend = () => {
        this.isRecordingSpeaking = false;
        if (micBtn) {
          micBtn.classList.remove('bg-red-600', 'animate-pulse');
          micBtn.classList.add('bg-indigo-600');
          micBtn.innerHTML = '<span>🎙️</span> Bật Micro Nói';
        }
      };

      this.speechRecognitionInstance = recognition;
      recognition.start();
    } catch (e) {
      alert('Không thể khởi động microphone: ' + e.message);
    }
  },

  async submitSpeakingEvaluation() {
    if (!this.activeSpeakingTopic) return;
    const textarea = document.getElementById('speaking-user-submission');
    const userSubmission = textarea?.value?.trim();
    if (!userSubmission) {
      alert('Vui lòng nói hoặc nhập câu trả lời trước khi nhận xét!');
      return;
    }

    const btn = document.getElementById('speaking-btn-eval');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> AI Coach đang lắng nghe và phân tích...';
    }

    try {
      const res = await evaluateLearningAI({
        item_id: this.activeSpeakingTopic.id,
        type: 'speaking',
        user_submission: userSubmission,
      });

      if (!res?.ok || !res.feedback) {
        alert(res?.error || 'Lỗi khi nhận xét');
        return;
      }

      this.renderSpeakingFeedback(res.feedback);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🤖</span> AI Coach Nhận Xét & Sửa Lỗi';
      }
    }
  },

  renderSpeakingFeedback(fb) {
    const area = document.getElementById('speaking-feedback-area');
    if (!area) return;
    area.classList.remove('hidden');

    const score = fb.score || fb.fluency_score || 0;
    const isGood = score >= 7;

    area.innerHTML = `
      <div class="p-5 rounded-2xl border ${isGood ? 'bg-purple-950/40 border-purple-700/60' : 'bg-amber-950/40 border-amber-700/60'} space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-700/60 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🗣️</span>
            <div>
              <h3 class="text-sm font-bold text-white">Nhận Xét Từ AI Speaking Coach</h3>
              <p class="text-[11px] text-gray-400">Độ trôi chảy, phản xạ & từ vựng bản xứ</p>
            </div>
          </div>
          <span class="text-2xl font-black ${isGood ? 'text-purple-400' : 'text-amber-400'} font-mono">${score} / 10</span>
        </div>

        <p class="text-xs text-gray-200 leading-relaxed font-medium bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          ${fb.summary || ''}
        </p>

        ${fb.strengths?.length ? `
          <div>
            <span class="font-bold text-emerald-400 text-xs block mb-1">✅ Điểm phản xạ tốt:</span>
            <ul class="list-disc list-inside text-gray-300 text-xs space-y-1 bg-gray-900/40 p-3 rounded-xl">
              ${fb.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fb.improvements?.length ? `
          <div>
            <span class="font-bold text-amber-400 text-xs block mb-1">⚠️ Gợi ý nâng cấp:</span>
            <ul class="list-disc list-inside text-gray-300 text-xs space-y-1 bg-gray-900/40 p-3 rounded-xl">
              ${fb.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fb.native_upgrades?.length ? `
          <div>
            <span class="font-bold text-indigo-300 text-xs block mb-2">💎 Cách diễn đạt tự nhiên hơn (Native Upgrades):</span>
            <div class="space-y-2">
              ${fb.native_upgrades.map(u => `
                <div class="p-3 bg-gray-900 rounded-xl border border-gray-700 text-xs space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">${u.original || ''}</span>
                    <span class="text-indigo-400">➔</span>
                    <span class="text-emerald-400 font-bold">${u.upgrade || ''}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },
};
