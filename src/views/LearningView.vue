<template>
  <div class="learning-readable h-full min-w-0 overflow-y-auto bg-gray-900 text-gray-100">
    <div class="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-4 space-y-4">
      <details open class="group rounded-2xl border border-gray-700/80 bg-gray-800/70 shadow-lg">
        <summary class="cursor-pointer list-none px-3 py-2.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-lg">{{ tabMeta.icon }}</span>
            <div class="min-w-0">
              <h1 class="text-sm font-bold text-white truncate">{{ tabMeta.title }}</h1>
              <p class="text-[11px] text-gray-400 truncate">{{ tabMeta.description }}</p>
            </div>
          </div>
          <span class="text-indigo-300 transition group-open:rotate-180">⌄</span>
        </summary>
        <div class="border-t border-gray-700/70 p-2">
          <nav class="english-tabs-scroll flex items-center gap-1.5 overflow-x-auto rounded-xl bg-gray-900/70 p-1.5">
            <router-link v-for="item in tabs" :key="item.to" :to="item.to"
              class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5"
              :class="currentTab === item.key ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'">
              <span>{{ item.icon }}</span>{{ item.label }}
            </router-link>
          </nav>
        </div>
      </details>

      <div v-if="error" class="p-3 rounded-xl border border-red-800/70 bg-red-950/40 text-red-300 text-xs flex items-center justify-between gap-3">
        <span>{{ error }}</span><button class="font-bold hover:text-white" @click="loadCurrentTab">Thử lại</button>
      </div>

      <section v-if="currentTab === 'tech'" class="space-y-4">
        <details open class="relative">
          <summary class="mx-auto w-10 h-7 cursor-pointer text-indigo-300 text-center" title="Đóng/mở công cụ">⌄</summary>
          <div class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button v-for="stack in learningStore.techStacks" :key="stack.slug" @click="selectTechStack(stack.slug)"
                class="p-3 rounded-2xl border text-center transition shadow-md"
                :class="learningStore.activeTechSlug === stack.slug ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/30' : 'bg-gray-800/90 border-gray-700 hover:bg-gray-700'">
                <span class="text-2xl block">{{ stack.icon || '💻' }}</span>
                <span class="text-xs font-bold block mt-1">{{ stack.name }}</span>
                <span class="text-[10px] text-gray-400 font-mono">{{ stack.active_item_count || 0 }} câu</span>
              </button>
            </div>
            <div class="bg-gray-800/95 rounded-2xl border border-gray-600/80 p-2.5 shadow-lg flex items-center gap-2 overflow-x-auto">
              <input v-model="learningStore.searchQuery" @input="debouncedTechLoad" placeholder="Tìm câu hỏi, code, từ khóa..."
                class="h-10 min-w-[230px] flex-1 px-3 bg-gray-900 rounded-xl border border-gray-600 text-xs focus:outline-none focus:border-indigo-400" />
              <select v-model="learningStore.filterLevel" @change="learningStore.loadQuestions" class="h-10 px-3 bg-gray-900 rounded-xl border border-gray-600 text-xs">
                <option value="">Tất cả Level</option><option value="beginner">Beginner / Fresher</option><option value="junior">Junior</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced / Senior</option>
              </select>
              <button @click="toggleTechBookmark" class="h-10 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap" :class="learningStore.filterBookmark ? 'bg-amber-900/50 border-amber-600 text-amber-300' : 'bg-gray-900 border-gray-600 text-gray-300'">🔖 Yêu thích</button>
              <div class="h-10 flex items-center bg-gray-900 rounded-xl p-1 border border-gray-600 shrink-0">
                <button v-for="mode in techModes" :key="mode.key" @click="techMode = mode.key" class="h-8 px-3 rounded-lg text-xs font-semibold" :class="techMode === mode.key ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'">{{ mode.label }}</button>
              </div>
            </div>
          </div>
        </details>

        <div v-if="learningStore.loading" class="loading-card">⏳ Đang tải ngân hàng câu hỏi...</div>
        <div v-else-if="techMode === 'flashcard'" class="max-w-2xl mx-auto">
          <Flashcard3D v-if="activeTechQuestion" :question="normalizedTechQuestion" :index="learningStore.flashcardIndex" @bookmark="learningStore.toggleBookmark" />
          <div class="flex justify-center items-center gap-4 mt-4">
            <button class="nav-button" :disabled="learningStore.flashcardIndex <= 0" @click="moveTech(-1)">←</button>
            <span class="text-xs font-mono text-gray-400">{{ learningStore.flashcardIndex + 1 }} / {{ learningStore.techQuestions.length }}</span>
            <button class="nav-button" :disabled="learningStore.flashcardIndex >= learningStore.techQuestions.length - 1" @click="moveTech(1)">→</button>
          </div>
        </div>
        <div v-else-if="techMode === 'exam'" class="studio-card text-center space-y-4">
          <span class="text-4xl">📝</span><h2 class="font-bold">Thi thử Tech từ dữ liệu đã học</h2>
          <p class="text-xs text-gray-400">Tạo đề thích ứng từ ngân hàng {{ learningStore.activeTechSlug }}.</p>
          <button class="primary-button" @click="startTechExam">Bắt đầu đề 20 câu</button>
          <div v-if="techExam.length" class="text-left space-y-3 mt-5">
            <div v-for="(q, index) in techExam" :key="q.id" class="p-4 rounded-xl bg-gray-900 border border-gray-700">
              <p class="text-xs font-bold">Câu {{ index + 1 }}. {{ q.question || q.title }}</p>
              <div class="grid sm:grid-cols-2 gap-2 mt-3"><button v-for="option in q.options" :key="option.id || option" class="answer-button">{{ option.text || option }}</button></div>
            </div>
          </div>
        </div>
        <div v-else class="tech-study-layout">
          <div v-if="activeTechQuestion" class="studio-card space-y-4">
            <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-700">
              <div><span class="badge">{{ activeTechQuestion.level || 'junior' }}</span><span class="ml-2 text-xs text-gray-400">{{ activeTechQuestion.learning_name || learningStore.activeTechSlug }}</span></div>
              <button @click="learningStore.toggleBookmark(activeTechQuestion)" class="text-lg" :class="activeTechQuestion.is_bookmarked ? 'text-amber-400' : 'text-gray-500'">★</button>
            </div>
            <h2 class="text-lg font-bold text-white">{{ activeTechQuestion.title }}</h2>
            <p v-if="activeTechQuestion.prompt" class="text-sm text-gray-300 whitespace-pre-wrap">{{ activeTechQuestion.prompt }}</p>
            <div v-if="techContent.quick_answer" class="info-box"><h3>⚡ Trả lời nhanh</h3><p>{{ techContent.quick_answer }}</p></div>
            <div v-if="techContent.detailed_answer || techSample.detailed_answer" class="info-box"><h3>📚 Giải thích chi tiết</h3><p class="whitespace-pre-wrap">{{ techContent.detailed_answer || techSample.detailed_answer }}</p></div>
            <pre v-if="techContent.code || techContent.code_snippet" class="code-box"><code>{{ techContent.code || techContent.code_snippet }}</code></pre>
            <div v-if="techContent.interview_tips" class="tip-box">🎯 {{ techContent.interview_tips }}</div>
            <div v-if="techContent.practical_tips" class="tip-box">💡 {{ techContent.practical_tips }}</div>
            <div class="flex items-center gap-2 pt-3 border-t border-gray-700">
              <button class="nav-button flex-1" :disabled="techIndex <= 0" @click="moveTech(-1)">← Câu trước</button>
              <button class="nav-button flex-1" :disabled="techIndex >= learningStore.techQuestions.length - 1" @click="moveTech(1)">Câu sau →</button>
            </div>
          </div>
          <div v-else class="loading-card">📭 Chưa có câu hỏi phù hợp với bộ lọc hiện tại.</div>
        </div>
      </section>

      <section v-else-if="currentTab === 'vocab'" class="space-y-4">
        <div class="grid lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 studio-card space-y-3">
            <div class="flex items-center justify-between"><h2 class="font-bold text-sm">📚 Chọn Chủ Đề (50 Topics)</h2><b class="text-xs text-indigo-400">Topic {{ vocabTopicNo }}</b></div>
            <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 max-h-40 overflow-y-auto">
              <button v-for="topic in vocabTopics" :key="topic.id" @click="selectVocabTopic(topic.topic_no)" class="h-9 rounded-lg border text-xs font-bold" :class="Number(topic.topic_no) === vocabTopicNo ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'">{{ topic.topic_no }}</button>
            </div>
          </div>
          <div class="studio-card flex flex-col justify-center gap-2">
            <input v-model="vocabSearch" @input="debouncedVocabLoad" placeholder="Tìm từ vựng..." class="input-control" />
            <div class="flex gap-2"><button @click="vocabBookmarkOnly = !vocabBookmarkOnly; loadVocab()" class="secondary-button flex-1">🔖 Đã lưu</button><a :href="vocabExportUrl" class="secondary-button flex-1 text-center">📤 Export</a></div>
          </div>
        </div>
        <div v-if="loading" class="loading-card">⏳ Đang tải từ vựng...</div>
        <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <article v-for="word in vocabWords" :key="word.id" class="studio-card space-y-3">
            <div class="flex justify-between gap-3"><div><h3 class="text-lg font-black text-indigo-300">{{ word.title }}</h3><span class="text-xs font-mono text-gray-400">{{ word.content?.pronunciation || word.content?.ipa || '' }}</span></div><button @click="toggleVocabBookmark(word)" :class="word.is_bookmarked ? 'text-amber-400' : 'text-gray-500'">★</button></div>
            <p class="font-bold text-emerald-400">{{ word.content?.meaning || word.sample_solution?.meaning || word.prompt }}</p>
            <p v-if="word.content?.example || word.prompt" class="p-3 bg-gray-950/70 rounded-xl border border-gray-800 italic text-xs text-gray-300">“{{ word.content?.example || word.prompt }}”</p>
            <p v-if="word.content?.note" class="text-xs text-gray-400">💡 {{ word.content.note }}</p>
          </article>
          <div v-if="!vocabWords.length" class="loading-card sm:col-span-2 xl:col-span-3">Chưa có từ vựng trong Topic {{ vocabTopicNo }}.</div>
        </div>
      </section>

      <section v-else-if="currentTab === 'quiz'" class="space-y-4 max-w-4xl mx-auto">
        <div class="studio-card flex flex-wrap items-center gap-2">
          <select v-model.number="quizTopicNo" class="input-control w-auto"><option :value="0">Tất cả Topic</option><option v-for="n in 50" :key="n" :value="n">Topic {{ n }}</option></select>
          <select v-model.number="quizCount" class="input-control w-auto"><option :value="5">5 câu</option><option :value="10">10 câu</option><option :value="20">20 câu</option></select>
          <button v-for="mode in quizModes" :key="mode.key" @click="setQuizMode(mode.key)" class="secondary-button" :class="quizMode === mode.key ? '!bg-indigo-600 !text-white' : ''">{{ mode.label }}</button>
          <button v-if="quizMode !== 'leaderboard'" class="primary-button ml-auto" @click="startQuiz">▶ Bắt đầu làm bài</button>
        </div>
        <div v-if="quizLoading" class="loading-card">⏳ Đang tạo đề từ ngân hàng dữ liệu...</div>
        <div v-else-if="quizMode === 'leaderboard'" class="studio-card">
          <h2 class="font-bold mb-4">🏆 Bảng xếp hạng</h2><div class="space-y-2"><div v-for="(row, i) in leaderboard" :key="i" class="p-3 bg-gray-900 rounded-xl flex justify-between text-sm"><span>{{ i + 1 }}. {{ row.username }}</span><b class="text-indigo-300">{{ row.score }}/{{ row.total }}</b></div></div>
        </div>
        <div v-else-if="quizFinished" class="studio-card text-center space-y-4"><span class="text-5xl">🏆</span><h2 class="text-xl font-black">Hoàn Thành Bài Thi!</h2><p>Đúng <b class="text-emerald-400">{{ quizScore }}</b> / {{ quizQuestions.length }} câu</p><button class="primary-button" @click="startQuiz">Làm đề mới</button></div>
        <div v-else-if="activeQuizQuestion" class="studio-card space-y-5">
          <div class="flex justify-between text-xs text-gray-400"><span>Câu {{ quizIndex + 1 }} / {{ quizQuestions.length }}</span><span>🔥 {{ quizStreak }} · Điểm {{ quizScore }}</span></div>
          <div class="w-full bg-gray-700 h-1.5 rounded-full"><div class="bg-indigo-500 h-full rounded-full" :style="{ width: `${(quizIndex / quizQuestions.length) * 100}%` }"></div></div>
          <div class="text-center space-y-2 py-3"><h2 class="text-2xl font-black">{{ quizMode === 'spelling' ? activeQuizQuestion.correct_meaning : activeQuizQuestion.word }}</h2><p class="text-xs text-gray-400 italic">{{ activeQuizQuestion.example }}</p></div>
          <div v-if="quizMode === 'spelling'" class="max-w-md mx-auto space-y-3"><input v-model="spellingAnswer" @keyup.enter="answerSpelling" class="input-control text-center font-bold" placeholder="Nhập từ tiếng Anh..." /><button class="primary-button w-full" @click="answerSpelling">Kiểm tra đáp án</button></div>
          <div v-else class="grid sm:grid-cols-2 gap-3"><button v-for="option in activeQuizQuestion.options" :key="option" @click="answerQuiz(option)" :disabled="quizAnswered" class="answer-button" :class="quizOptionClass(option)">{{ option }}</button></div>
          <div v-if="quizAnswered" class="p-3 rounded-xl border" :class="lastQuizCorrect ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' : 'bg-red-950/40 border-red-700 text-red-300'">{{ lastQuizCorrect ? '🎉 Chính xác!' : `Đáp án đúng: ${quizCorrectText}` }} <button class="float-right font-bold text-white" @click="nextQuiz">Câu tiếp →</button></div>
        </div>
        <div v-else class="loading-card">Chọn chủ đề và bấm “Bắt đầu làm bài”.</div>
      </section>

      <section v-else-if="currentTab === 'writing'" class="grid lg:grid-cols-12 gap-4 min-h-[560px]">
        <aside class="lg:col-span-4 xl:col-span-3 studio-card !p-3 overflow-y-auto max-h-[70vh]">
          <h2 class="font-bold text-xs p-2 border-b border-gray-700">✍️ Đề Bài Luyện Viết ({{ writingTasks.length }})</h2>
          <button v-for="task in writingTasks" :key="task.id" @click="selectWriting(task)" class="w-full text-left p-3 border-b border-gray-700/60 hover:bg-gray-700/60" :class="activeWriting?.id === task.id ? 'bg-indigo-950/60 border-l-4 border-l-indigo-500' : ''"><span class="badge">{{ task.level }}</span><b class="block text-xs mt-2">{{ task.title }}</b><p class="text-[11px] text-gray-400 line-clamp-2 mt-1">{{ task.prompt }}</p></button>
        </aside>
        <div v-if="activeWriting" class="lg:col-span-8 xl:col-span-9 studio-card space-y-5 overflow-y-auto max-h-[75vh]">
          <div><span class="badge">✍️ {{ activeWriting.level }}</span><h2 class="text-lg font-bold mt-2">{{ activeWriting.title }}</h2></div>
          <div class="info-box"><h3>📝 Yêu Cầu Đề Bài</h3><p class="whitespace-pre-wrap">{{ activeWriting.prompt }}</p><p v-if="activeWriting.content?.instructions" class="tip-box mt-3">📋 {{ activeWriting.content.instructions }}</p></div>
          <div v-if="activeWriting.content?.key_vocabulary?.length"><h3 class="text-xs font-bold text-emerald-400 mb-2">🔑 Target Vocabulary</h3><div class="flex flex-wrap gap-2"><span v-for="word in activeWriting.content.key_vocabulary" :key="word" class="badge">{{ word }}</span></div></div>
          <div><div class="flex justify-between mb-2"><b class="text-xs">Bài viết của bạn:</b><span class="text-xs font-mono text-gray-400">{{ writingWordCount }} từ | {{ writingSubmission.length }} ký tự</span></div><textarea v-model="writingSubmission" rows="9" class="input-control leading-relaxed" placeholder="Bắt đầu viết bài luận, đoạn văn hoặc email..."></textarea></div>
          <div class="flex flex-wrap gap-2"><button class="primary-button" :disabled="evaluating" @click="evaluateWriting">🤖 {{ evaluating ? 'Đang chấm bài...' : 'Đần AI Chấm & Sửa Lỗi' }}</button><button v-if="writingModelAnswer" class="secondary-button" @click="showWritingSample = !showWritingSample">💡 {{ showWritingSample ? 'Ẩn' : 'Xem' }} Bài Mẫu</button></div>
          <div v-if="showWritingSample" class="info-box"><h3>💡 Model Essay</h3><p class="whitespace-pre-wrap font-serif">{{ writingModelAnswer }}</p></div>
          <FeedbackCard v-if="writingFeedback" :feedback="writingFeedback" title="Đánh Giá Kỹ Năng Viết" />
        </div>
        <div v-else class="lg:col-span-8 xl:col-span-9 loading-card">{{ loading ? '⏳ Đang tải đề luyện viết...' : 'Chưa có đề luyện viết trong ngân hàng.' }}</div>
      </section>

      <section v-else class="grid lg:grid-cols-12 gap-4 min-h-[560px]">
        <aside class="lg:col-span-4 studio-card !p-3 overflow-y-auto max-h-[70vh]"><h2 class="font-bold text-xs p-2 border-b border-gray-700">🗣️ Chủ đề luyện nói ({{ speakingTopics.length }})</h2><button v-for="topic in speakingTopics" :key="topic.id" @click="selectSpeaking(topic)" class="w-full text-left p-3 rounded-xl border mt-2" :class="activeSpeaking?.id === topic.id ? 'bg-indigo-950/70 border-indigo-500' : 'bg-gray-900/60 border-gray-700'"><b class="text-xs">{{ topic.title }}</b><p class="text-[11px] text-gray-400 line-clamp-2 mt-1">{{ topic.prompt }}</p></button></aside>
        <div v-if="activeSpeaking" class="lg:col-span-8 studio-card space-y-5 overflow-y-auto max-h-[75vh]">
          <div><span class="badge">🗣️ {{ activeSpeaking.level }}</span><h2 class="text-lg font-bold mt-2">{{ activeSpeaking.title }}</h2></div>
          <div class="info-box space-y-3">
            <div v-if="activeSpeaking.content?.part1_questions?.length"><h3>Part 1: Introduction</h3><ul class="list-disc list-inside text-xs space-y-1"><li v-for="q in activeSpeaking.content.part1_questions" :key="q">{{ q }}</li></ul></div>
            <div v-if="activeSpeaking.content?.part2_cue_card" class="tip-box"><h3>Part 2: Candidate Cue Card</h3><b>{{ activeSpeaking.content.part2_cue_card.topic }}</b><ul class="list-disc list-inside text-xs mt-2"><li v-for="q in activeSpeaking.content.part2_cue_card.bullet_points" :key="q">{{ q }}</li></ul></div>
            <div v-if="activeSpeaking.content?.part3_questions?.length"><h3>Part 3: Discussion</h3><ul class="list-disc list-inside text-xs space-y-1"><li v-for="q in activeSpeaking.content.part3_questions" :key="q">{{ q }}</li></ul></div>
            <p v-if="!hasSpeakingParts" class="whitespace-pre-wrap">{{ activeSpeaking.prompt }}</p>
          </div>
          <div v-if="activeSpeaking.content?.target_expressions?.length"><h3 class="text-xs font-bold text-emerald-400 mb-2">🎯 Target Expressions</h3><div class="flex flex-wrap gap-2"><span v-for="phrase in activeSpeaking.content.target_expressions" :key="phrase" class="badge">{{ phrase }}</span></div></div>
          <textarea v-model="speakingSubmission" rows="6" class="input-control" placeholder="Nói qua micro hoặc nhập câu trả lời tại đây..."></textarea>
          <div class="flex flex-wrap gap-2"><button class="secondary-button" :class="recording ? '!bg-red-600 animate-pulse' : ''" @click="toggleSpeech">{{ recording ? '⏹️ Dừng ghi âm' : '🎙️ Bật Micro Nói' }}</button><button class="primary-button" :disabled="evaluating" @click="evaluateSpeaking">🤖 AI Coach Nhận Xét</button><button v-if="speakingSample" class="secondary-button" @click="showSpeakingSample = !showSpeakingSample">💬 {{ showSpeakingSample ? 'Ẩn' : 'Xem' }} Trả Lời Mẫu</button></div>
          <div v-if="showSpeakingSample" class="info-box"><h3>💬 Sample Transcript</h3><p class="whitespace-pre-wrap font-serif">{{ speakingSample }}</p></div>
          <FeedbackCard v-if="speakingFeedback" :feedback="speakingFeedback" title="Đánh Giá Kỹ Năng Nói" />
        </div>
        <div v-else class="lg:col-span-8 loading-card">{{ loading ? '⏳ Đang tải chủ đề luyện nói...' : 'Chưa có chủ đề luyện nói.' }}</div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLearningStore } from '@/stores/learning';
import Flashcard3D from '@/components/learning/Flashcard3D.vue';
import {
  buildPracticeExam, buildQuiz, evaluateLearningAI, getLearningItems, getLearnings,
  getQuizLeaderboard, learningExportUrl, submitQuizResult, toggleBookmark,
} from '@/api/learning';

const route = useRoute();
const learningStore = useLearningStore();
const loading = ref(false);
const error = ref('');
const tabs = [
  { key: 'tech', to: '/tech', icon: '💻', label: 'Lập trình & Tech' },
  { key: 'vocab', to: '/vocab', icon: '📖', label: 'Vocabulary (50 Topics)' },
  { key: 'quiz', to: '/quiz', icon: '🧩', label: 'Quiz & Practice' },
  { key: 'writing', to: '/writing', icon: '✍️', label: 'Writing Studio' },
  { key: 'speaking', to: '/speaking', icon: '🗣️', label: 'Speaking Coach' },
];
const currentTab = computed(() => String(route.name || '').replace('learning-', '') || 'tech');
const tabMeta = computed(() => ({
  tech: { icon: '💻', title: 'Tech Learning', description: 'Ngân hàng phỏng vấn, flashcard và thi thử theo stack' },
  vocab: { icon: '📖', title: 'English Learning Hub', description: '50 chủ đề từ vựng, IPA và ví dụ thực tế' },
  quiz: { icon: '🧩', title: 'Quiz & Practice', description: 'Trắc nghiệm, spelling và bảng xếp hạng' },
  writing: { icon: '✍️', title: 'Writing Studio', description: 'Luyện viết với đề thật và AI evaluator' },
  speaking: { icon: '🗣️', title: 'Speaking Coach', description: 'IELTS 3 phần, voice-to-text và AI coach' },
}[currentTab.value]));

const parseObject = (value) => {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch (_) { return {}; }
};
const normalizeItems = (items = []) => items.map((item) => ({ ...item, content: parseObject(item.content), sample_solution: parseObject(item.sample_solution) }));
const reportError = (err) => { error.value = err?.message || 'Không thể tải dữ liệu Learning.'; };

const techModes = [{ key: 'split', label: '📚 Câu hỏi' }, { key: 'flashcard', label: '🎴 Flashcard' }, { key: 'exam', label: '📝 Thi thử' }];
const techMode = ref('split');
const techExam = ref([]);
const activeTechQuestion = computed(() => learningStore.activeQuestion);
const techIndex = computed(() => learningStore.techQuestions.findIndex((q) => q.id === activeTechQuestion.value?.id));
const techContent = computed(() => parseObject(activeTechQuestion.value?.content));
const techSample = computed(() => parseObject(activeTechQuestion.value?.sample_solution));
const normalizedTechQuestion = computed(() => ({ ...activeTechQuestion.value, answer: techContent.value.quick_answer || techContent.value.detailed_answer || techSample.value.detailed_answer }));
let techTimer;
const debouncedTechLoad = () => { clearTimeout(techTimer); techTimer = setTimeout(() => learningStore.loadQuestions(), 250); };
const selectTechStack = async (slug) => { learningStore.setTechSlug(slug); };
const toggleTechBookmark = () => { learningStore.filterBookmark = !learningStore.filterBookmark; learningStore.loadQuestions(); };
const moveTech = (offset) => { const index = Math.max(0, Math.min(learningStore.techQuestions.length - 1, techIndex.value + offset)); learningStore.flashcardIndex = index; learningStore.selectQuestion(learningStore.techQuestions[index]); };
const loadTech = async () => { await learningStore.loadTechStacks(); await learningStore.loadQuestions(); };
const startTechExam = async () => { const res = await buildPracticeExam({ category: 'tech', learnings: learningStore.activeTechSlug, count: 20 }); techExam.value = res.questions || []; };

const vocabTopics = ref([]); const vocabWords = ref([]); const vocabTopicNo = ref(1); const vocabSearch = ref(''); const vocabBookmarkOnly = ref(false);
const vocabExportUrl = computed(() => learningExportUrl(`vocab-topic-${vocabTopicNo.value}`));
let vocabTimer;
const debouncedVocabLoad = () => { clearTimeout(vocabTimer); vocabTimer = setTimeout(loadVocab, 250); };
const loadVocab = async () => { loading.value = true; try { if (!vocabTopics.value.length) { const topics = await getLearnings('english', 'vocabulary'); vocabTopics.value = topics.learnings || []; } const res = await getLearningItems({ category: 'english', type: 'vocabulary', topic_no: vocabTopicNo.value, search: vocabSearch.value, bookmarked: vocabBookmarkOnly.value ? 1 : '', limit: 200 }); vocabWords.value = normalizeItems(res.items); } catch (err) { reportError(err); } finally { loading.value = false; } };
const selectVocabTopic = (topicNo) => { vocabTopicNo.value = Number(topicNo); loadVocab(); };
const toggleVocabBookmark = async (word) => { const next = !word.is_bookmarked; word.is_bookmarked = next; try { await toggleBookmark(word.id, next); } catch (err) { word.is_bookmarked = !next; reportError(err); } };

const quizModes = [{ key: 'multiple_choice', label: '🔤 Trắc nghiệm' }, { key: 'spelling', label: '✍️ Spelling' }, { key: 'leaderboard', label: '🏆 Xếp hạng' }];
const quizMode = ref('multiple_choice'); const quizTopicNo = ref(0); const quizCount = ref(5); const quizQuestions = ref([]); const quizIndex = ref(0); const quizScore = ref(0); const quizStreak = ref(0); const quizAnswered = ref(false); const quizSelected = ref(''); const lastQuizCorrect = ref(false); const spellingAnswer = ref(''); const quizFinished = ref(false); const quizLoading = ref(false); const leaderboard = ref([]); const quizAttempts = ref([]);
const activeQuizQuestion = computed(() => quizQuestions.value[quizIndex.value]);
const quizCorrectText = computed(() => { const q = activeQuizQuestion.value; return q?.options?.find((option) => String(option).startsWith(q.correct_option)) || q?.word || ''; });
const startQuiz = async () => { quizLoading.value = true; quizFinished.value = false; try { const res = await buildQuiz({ topic_no: quizTopicNo.value || '', count: quizCount.value, mode: quizMode.value }); quizQuestions.value = res.questions || []; quizIndex.value = 0; quizScore.value = 0; quizStreak.value = 0; quizAttempts.value = []; resetQuizAnswer(); } catch (err) { reportError(err); } finally { quizLoading.value = false; } };
const resetQuizAnswer = () => { quizAnswered.value = false; quizSelected.value = ''; spellingAnswer.value = ''; lastQuizCorrect.value = false; };
const answerQuiz = (option) => { if (quizAnswered.value) return; quizSelected.value = option; const q = activeQuizQuestion.value; lastQuizCorrect.value = String(option).startsWith(q.correct_option); finishQuizAnswer(String(option)); };
const answerSpelling = () => { if (!spellingAnswer.value.trim() || quizAnswered.value) return; const q = activeQuizQuestion.value; lastQuizCorrect.value = spellingAnswer.value.trim().toLowerCase() === String(q.word).trim().toLowerCase(); finishQuizAnswer(spellingAnswer.value); };
const finishQuizAnswer = (selected) => { quizAnswered.value = true; if (lastQuizCorrect.value) { quizScore.value++; quizStreak.value++; } else quizStreak.value = 0; const q = activeQuizQuestion.value; quizAttempts.value.push({ item_id: q.id, is_correct: lastQuizCorrect.value, question: q.word, selected_answer: selected, correct_answer: quizCorrectText.value }); };
const quizOptionClass = (option) => { if (!quizAnswered.value) return ''; if (String(option).startsWith(activeQuizQuestion.value.correct_option)) return '!border-emerald-500 !bg-emerald-950/60 !text-emerald-300'; if (option === quizSelected.value) return '!border-red-500 !bg-red-950/60 !text-red-300'; return 'opacity-50'; };
const nextQuiz = async () => { if (quizIndex.value < quizQuestions.value.length - 1) { quizIndex.value++; resetQuizAnswer(); return; } quizFinished.value = true; try { await submitQuizResult({ score: quizScore.value, total: quizQuestions.value.length, details: { mode: quizMode.value, attempts: quizAttempts.value } }); } catch (_) {} };
const setQuizMode = async (mode) => { quizMode.value = mode; if (mode === 'leaderboard') { const res = await getQuizLeaderboard(20); leaderboard.value = res.leaderboard || []; } else { quizQuestions.value = []; quizFinished.value = false; } };

const writingTasks = ref([]); const activeWriting = ref(null); const writingSubmission = ref(''); const writingFeedback = ref(null); const showWritingSample = ref(false); const evaluating = ref(false);
const writingModelAnswer = computed(() => activeWriting.value?.sample_solution?.model_answer || activeWriting.value?.sample_solution?.sample_solution || activeWriting.value?.sample_solution?.detailed_answer || '');
const writingWordCount = computed(() => writingSubmission.value.trim() ? writingSubmission.value.trim().split(/\s+/).length : 0);
const loadWriting = async () => { loading.value = true; try { const res = await getLearningItems({ category: 'english', type: 'writing', limit: 100 }); writingTasks.value = normalizeItems(res.items); selectWriting(writingTasks.value[0] || null); } catch (err) { reportError(err); } finally { loading.value = false; } };
const selectWriting = (task) => { activeWriting.value = task; writingSubmission.value = ''; writingFeedback.value = null; showWritingSample.value = false; };
const evaluateWriting = async () => { if (!writingSubmission.value.trim()) { error.value = 'Vui lòng nhập bài viết trước khi chấm.'; return; } evaluating.value = true; try { const res = await evaluateLearningAI({ itemId: activeWriting.value.id, type: 'writing', submission: writingSubmission.value }); writingFeedback.value = res.feedback || res; } catch (err) { reportError(err); } finally { evaluating.value = false; } };

const speakingTopics = ref([]); const activeSpeaking = ref(null); const speakingSubmission = ref(''); const speakingFeedback = ref(null); const showSpeakingSample = ref(false); const recording = ref(false); let recognition;
const speakingSample = computed(() => activeSpeaking.value?.sample_solution?.sample_response || activeSpeaking.value?.sample_solution?.model_answer || '');
const hasSpeakingParts = computed(() => Boolean(activeSpeaking.value?.content?.part1_questions?.length || activeSpeaking.value?.content?.part2_cue_card || activeSpeaking.value?.content?.part3_questions?.length));
const loadSpeaking = async () => { loading.value = true; try { const res = await getLearningItems({ category: 'english', type: 'speaking', limit: 100 }); speakingTopics.value = normalizeItems(res.items); selectSpeaking(speakingTopics.value[0] || null); } catch (err) { reportError(err); } finally { loading.value = false; } };
const selectSpeaking = (topic) => { activeSpeaking.value = topic; speakingSubmission.value = ''; speakingFeedback.value = null; showSpeakingSample.value = false; };
const evaluateSpeaking = async () => { if (!speakingSubmission.value.trim()) { error.value = 'Vui lòng nói hoặc nhập câu trả lời trước khi đánh giá.'; return; } evaluating.value = true; try { const res = await evaluateLearningAI({ itemId: activeSpeaking.value.id, type: 'speaking', submission: speakingSubmission.value }); speakingFeedback.value = res.feedback || res; } catch (err) { reportError(err); } finally { evaluating.value = false; } };
const toggleSpeech = () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { error.value = 'Trình duyệt chưa hỗ trợ Web Speech API; bạn vẫn có thể nhập câu trả lời.'; return; } if (recording.value) { recognition?.stop(); return; } recognition = new SpeechRecognition(); recognition.lang = 'en-US'; recognition.continuous = true; recognition.interimResults = false; recognition.onstart = () => { recording.value = true; }; recognition.onresult = (event) => { for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) speakingSubmission.value += `${speakingSubmission.value ? ' ' : ''}${event.results[i][0].transcript}`; }; recognition.onend = () => { recording.value = false; }; recognition.onerror = () => { recording.value = false; error.value = 'Không thể dùng micro lúc này.'; }; recognition.start(); };

const FeedbackCard = defineComponent({ props: { feedback: Object, title: String }, setup(props) { return () => h('div', { class: 'p-5 bg-gray-900 rounded-2xl border border-purple-500/40 space-y-3' }, [h('h3', { class: 'text-xs font-bold text-purple-300 uppercase' }, `🤖 ${props.title}`), props.feedback.overall_band || props.feedback.score ? h('p', { class: 'text-2xl font-black text-emerald-400' }, `${props.feedback.overall_band || props.feedback.score}/9.0`) : null, h('p', { class: 'text-xs text-gray-200 whitespace-pre-wrap leading-relaxed' }, props.feedback.examiner_comment || props.feedback.summary || props.feedback.feedback || JSON.stringify(props.feedback, null, 2))]); } });

const loadCurrentTab = async () => { error.value = ''; try { if (currentTab.value === 'tech') await loadTech(); if (currentTab.value === 'vocab') await loadVocab(); if (currentTab.value === 'writing') await loadWriting(); if (currentTab.value === 'speaking') await loadSpeaking(); } catch (err) { reportError(err); } };
watch(currentTab, loadCurrentTab, { immediate: true });
onBeforeUnmount(() => { clearTimeout(techTimer); clearTimeout(vocabTimer); recognition?.stop(); });
</script>
