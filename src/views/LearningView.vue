<template>
  <div class="h-full flex flex-col min-w-0">
    <!-- Top Navigation Subtabs -->
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md flex items-center justify-between shrink-0 overflow-x-auto">
      <div class="flex items-center gap-2">
        <router-link 
          to="/learning/tech" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          :class="$route.name === 'learning-tech' || $route.path === '/learning' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          💻 Lập trình & Tech
        </router-link>

        <router-link 
          to="/learning/vocab" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          :class="$route.name === 'learning-vocab' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          📖 Từ vựng IELTS
        </router-link>

        <router-link 
          to="/learning/quiz" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          :class="$route.name === 'learning-quiz' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          ⚡ Trắc nghiệm Quiz
        </router-link>

        <router-link 
          to="/learning/writing" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          :class="$route.name === 'learning-writing' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          ✍️ Writing Studio
        </router-link>

        <router-link 
          to="/learning/speaking" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          :class="$route.name === 'learning-speaking' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          🎙️ Speaking Coach
        </router-link>
      </div>

      <!-- Action Buttons -->
      <button 
        @click="showGenerator = true"
        class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-90 transition"
      >
        <span>✨</span>
        <span>Tạo bài bằng AI</span>
      </button>
    </header>

    <!-- Content Subview Area -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
      <!-- 1. TECH STACK TAB -->
      <div v-if="currentTab === 'tech'" class="max-w-7xl mx-auto space-y-6">
        <!-- Tech Stack Pills -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button 
            v-for="s in learningStore.techStacks"
            :key="s.slug"
            @click="learningStore.setTechSlug(s.slug)"
            :class="[
              'p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center shadow-md',
              learningStore.activeTechSlug === s.slug 
                ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/40 text-white' 
                : 'bg-gray-800/80 border-gray-700/80 hover:bg-gray-700/80 text-gray-300'
            ]"
          >
            <span class="text-2xl mb-1">{{ s.icon || '💻' }}</span>
            <span class="text-xs font-bold truncate max-w-full">{{ s.name }}</span>
            <span class="text-[10px] text-gray-400 font-mono mt-0.5">{{ s.active_item_count || 0 }} câu</span>
          </button>
        </div>

        <!-- Filter & View Controls -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-800/70 p-3 rounded-2xl border border-gray-700/60">
          <div class="flex items-center gap-2 flex-1 min-w-[200px]">
            <input 
              v-model="learningStore.searchQuery" 
              @input="learningStore.loadQuestions"
              type="text" 
              placeholder="Tìm kiếm câu hỏi..." 
              class="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex items-center gap-2">
            <select 
              v-model="learningStore.filterLevel" 
              @change="learningStore.loadQuestions"
              class="px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-gray-300 focus:outline-none"
            >
              <option value="">Tất cả Level</option>
              <option value="Fresher">Fresher</option>
              <option value="Junior">Junior</option>
              <option value="Middle">Middle</option>
              <option value="Senior">Senior</option>
            </select>

            <button 
              @click="toggleBookmarkFilter"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1',
                learningStore.filterBookmark ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-gray-900 border-gray-700 text-gray-400'
              ]"
            >
              <span>★</span>
              <span>Đã lưu</span>
            </button>

            <!-- Mode Switcher -->
            <div class="flex rounded-xl bg-gray-900 p-0.5 border border-gray-700">
              <button 
                @click="learningStore.viewMode = 'split'"
                :class="learningStore.viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-gray-400'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
              >
                Split View
              </button>
              <button 
                @click="learningStore.viewMode = 'flashcard'"
                :class="learningStore.viewMode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-gray-400'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
              >
                Flashcard 3D
              </button>
            </div>
          </div>
        </div>

        <!-- Mode 1: Split View -->
        <div v-if="learningStore.viewMode === 'split'" class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Question List -->
          <div class="md:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <div 
              v-for="(q, idx) in learningStore.techQuestions"
              :key="q.id"
              @click="learningStore.selectQuestion(q)"
              :class="[
                'p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-2 shadow-sm',
                learningStore.activeQuestion?.id === q.id 
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/40' 
                  : 'bg-gray-800/80 border-gray-700/80 hover:bg-gray-700/60 text-gray-300'
              ]"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-700 text-gray-300">{{ q.level || 'Junior' }}</span>
                  <span class="text-[10px] text-gray-500 font-mono">#{{ idx + 1 }}</span>
                </div>
                <h4 class="text-xs font-bold truncate">{{ q.title || q.question }}</h4>
              </div>
              <button 
                @click.stop="learningStore.toggleBookmark(q)"
                class="text-gray-400 hover:text-amber-400 text-sm"
                :class="q.is_bookmarked ? 'text-amber-400' : ''"
              >
                ★
              </button>
            </div>
          </div>

          <!-- Answer Detail Panel -->
          <div class="md:col-span-7 bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div v-if="learningStore.activeQuestion">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-gray-700/80">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">{{ learningStore.activeQuestion.level || 'Junior' }}</span>
                <span class="text-xs text-gray-400">{{ learningStore.activeQuestion.category }}</span>
              </div>
              <h3 class="text-base font-bold text-white mb-4">{{ learningStore.activeQuestion.title || learningStore.activeQuestion.question }}</h3>
              <div class="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap max-h-[450px] overflow-y-auto pr-2">
                {{ learningStore.activeQuestion.answer || learningStore.activeQuestion.explanation || 'Chưa có lời giải chi tiết.' }}
              </div>
            </div>
            <div v-else class="h-64 flex items-center justify-center text-gray-500 text-sm">
              Chọn một câu hỏi ở danh sách bên trái để xem giải thích.
            </div>
          </div>
        </div>

        <!-- Mode 2: Flashcard 3D -->
        <div v-else class="py-4">
          <div v-if="learningStore.techQuestions.length > 0">
            <Flashcard3D 
              :question="learningStore.techQuestions[learningStore.flashcardIndex]"
              :index="learningStore.flashcardIndex"
              @bookmark="learningStore.toggleBookmark"
            />
            <div class="flex items-center justify-center gap-4 mt-6">
              <button 
                @click="prevFlashcard"
                :disabled="learningStore.flashcardIndex === 0"
                class="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 text-xs font-semibold disabled:opacity-40"
              >
                ← Câu trước
              </button>
              <span class="text-xs font-mono text-gray-400">
                {{ learningStore.flashcardIndex + 1 }} / {{ learningStore.techQuestions.length }}
              </span>
              <button 
                @click="nextFlashcard"
                :disabled="learningStore.flashcardIndex === learningStore.techQuestions.length - 1"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-40"
              >
                Câu tiếp theo →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. QUIZ TAB -->
      <div v-else-if="currentTab === 'quiz'">
        <QuizMode 
          :questions="learningStore.techQuestions"
          @restart="learningStore.loadQuestions"
        />
      </div>

      <!-- 3. VOCABULARY TAB -->
      <div v-else-if="currentTab === 'vocab'" class="max-w-4xl mx-auto space-y-4">
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-white">Kho Từ Vựng Tiếng Anh & IELTS</h3>
          <p class="text-xs text-gray-400 mt-1">Luyện tập từ vựng, tra cứu phiên âm IPA và ví dụ thực tế</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="item in vocabList" 
            :key="item.word"
            class="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-5 shadow-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-lg font-bold text-indigo-400">{{ item.word }}</h4>
              <span class="text-xs font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded">{{ item.ipa }}</span>
            </div>
            <p class="text-sm font-semibold text-gray-200 mb-2">{{ item.meaning }}</p>
            <p class="text-xs text-gray-400 italic">"{{ item.example }}"</p>
          </div>
        </div>
      </div>

      <!-- 4. WRITING STUDIO -->
      <div v-else-if="currentTab === 'writing'" class="max-w-4xl mx-auto bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-white mb-2">✍️ IELTS Writing Studio</h3>
        <p class="text-xs text-gray-400 mb-4">Nhập bài viết luận của bạn để AI chấm điểm tiêu chí Band Score & sửa lỗi ngữ pháp</p>
        
        <textarea 
          v-model="writingText" 
          rows="10" 
          placeholder="Type your essay here..."
          class="w-full p-4 rounded-2xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-4"
        ></textarea>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-mono">{{ wordCount }} từ</span>
          <button 
            @click="submitWriting"
            :disabled="!writingText.trim() || evaluatingWriting"
            class="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
          >
            {{ evaluatingWriting ? 'Đang chấm điểm...' : 'Chấm điểm bằng AI ✨' }}
          </button>
        </div>

        <div v-if="writingFeedback" class="mt-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
          <h4 class="text-xs font-bold text-indigo-300 uppercase mb-2">Nhận xét từ AI Evaluator:</h4>
          <p class="text-sm text-gray-200 whitespace-pre-wrap">{{ writingFeedback }}</p>
        </div>
      </div>

      <!-- 5. SPEAKING COACH -->
      <div v-else-if="currentTab === 'speaking'" class="max-w-2xl mx-auto bg-gray-800/90 border border-gray-700/80 rounded-3xl p-8 text-center shadow-xl">
        <span class="text-4xl block mb-3">🎙️</span>
        <h3 class="text-lg font-bold text-white mb-2">IELTS Speaking Coach</h3>
        <p class="text-xs text-gray-400 mb-6">Chủ đề: Describe a memorable journey you have ever taken.</p>
        
        <div class="p-6 rounded-3xl bg-gray-900 border border-gray-700 mb-6 flex flex-col items-center">
          <button 
            @click="toggleRecording"
            :class="[
              'w-20 h-20 rounded-full flex items-center justify-center text-2xl transition-all shadow-xl',
              isRecording ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40' : 'bg-indigo-600 text-white hover:bg-indigo-500'
            ]"
          >
            {{ isRecording ? '⏹' : '🎤' }}
          </button>
          <span class="text-xs text-gray-400 font-mono mt-4">{{ isRecording ? 'Đang ghi âm...' : 'Nhấn vào mic để bắt đầu luyện nói' }}</span>
        </div>
      </div>
    </div>

    <!-- AI Generator Modal -->
    <AIGeneratorModal 
      :is-open="showGenerator"
      @close="showGenerator = false"
      @generated="handleGenerated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLearningStore } from '@/stores/learning';
import Flashcard3D from '@/components/learning/Flashcard3D.vue';
import QuizMode from '@/components/learning/QuizMode.vue';
import AIGeneratorModal from '@/components/learning/AIGeneratorModal.vue';

const route = useRoute();
const learningStore = useLearningStore();

const showGenerator = ref(false);
const writingText = ref('');
const evaluatingWriting = ref(false);
const writingFeedback = ref('');
const isRecording = ref(false);

const currentTab = computed(() => {
  if (route.name === 'learning-quiz') return 'quiz';
  if (route.name === 'learning-vocab') return 'vocab';
  if (route.name === 'learning-writing') return 'writing';
  if (route.name === 'learning-speaking') return 'speaking';
  return 'tech';
});

const wordCount = computed(() => {
  return writingText.value.trim().split(/\s+/).filter(Boolean).length;
});

const vocabList = ref([
  { word: 'Ubiquitous', ipa: '/juːˈbɪk.wə.təs/', meaning: 'Có mặt ở khắp mọi nơi', example: 'Smartphones have become ubiquitous in daily life.' },
  { word: 'Pragmatic', ipa: '/præɡˈmæt.ɪk/', meaning: 'Thực dụng, thực tế', example: 'We need a pragmatic approach to solve this engineering issue.' },
  { word: 'Resilient', ipa: '/rɪˈzɪl.jənt/', meaning: 'Kiên cường, bền bỉ', example: 'The architecture is resilient against high traffic spikes.' },
  { word: 'Mitigate', ipa: '/ˈmɪt.ɪ.ɡeɪt/', meaning: 'Giảm nhẹ, giảm thiểu rủi ro', example: 'Proper caching mitigates database server overload.' },
]);

const toggleBookmarkFilter = () => {
  learningStore.filterBookmark = !learningStore.filterBookmark;
  learningStore.loadQuestions();
};

const prevFlashcard = () => {
  if (learningStore.flashcardIndex > 0) learningStore.flashcardIndex--;
};

const nextFlashcard = () => {
  if (learningStore.flashcardIndex < learningStore.techQuestions.length - 1) {
    learningStore.flashcardIndex++;
  }
};

const submitWriting = async () => {
  if (!writingText.value.trim()) return;
  evaluatingWriting.value = true;
  setTimeout(() => {
    writingFeedback.value = `⭐ Ước lượng Band Score: 6.5 - 7.0\n\n- Task Achievement: Đáp ứng đủ yêu cầu đề bài, luận điểm rõ ràng.\n- Coherence & Cohesion: Mạch lạc tốt, sử dụng từ nối tự nhiên.\n- Lexical Resource: Vốn từ phong phú, một số collocations dùng rất chuẩn xác.\n- Grammatical Accuracy: Chú ý chia động từ ở ngôi thứ 3 và sử dụng thì quá khứ hoàn thành.`;
    evaluatingWriting.value = false;
  }, 1200);
};

const toggleRecording = () => {
  isRecording.value = !isRecording.value;
};

const handleGenerated = (result) => {
  learningStore.loadQuestions();
};

onMounted(async () => {
  await learningStore.loadTechStacks();
  await learningStore.loadQuestions();
});
</script>
