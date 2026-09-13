<template>
    <LearningLayout :error="error" @retry="loadTech">
        <section class="space-y-4">
            <!-- Collapsible Top Filter Toolbar -->
            <details open class="relative">
                <summary class="learning-tools-toggle sticky top-0 z-20 mx-auto w-10 h-7 cursor-pointer select-none text-indigo-300 hover:text-white flex items-center justify-center -mt-2 mb-0.5" aria-label="Đóng hoặc mở công cụ học Tech" title="Đóng/mở công cụ">
                    <svg class="learning-tools-chevron w-5 h-5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="learning-tools-content">
                    <div class="learning-tools-content-inner space-y-3 px-1 pb-3 pt-1">
                        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm dark:shadow-md flex items-center gap-2 overflow-x-auto">
                            <!-- Search -->
                            <div class="relative flex-1 min-w-[200px]">
                                <input v-model="learningStore.searchQuery" @input="debouncedTechLoad" placeholder="Tìm câu hỏi, code, từ khóa..." class="h-10 w-full pl-8 pr-7 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400" />
                                <button v-if="learningStore.searchQuery" @click="clearTechSearch" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                            </div>

                            <!-- Level Filter -->
                            <select v-model="learningStore.filterLevel" @change="learningStore.loadQuestions" class="h-10 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 font-semibold shrink-0">
                                <option value="">Tất cả Level</option>
                                <option value="student">Student / Sinh viên</option>
                                <option value="beginner">Beginner / Fresher</option>
                                <option value="junior">Junior</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced / Senior</option>
                            </select>

                            <!-- Status Filter -->
                            <select v-model="learningStore.filterStatus" @change="learningStore.loadQuestions" class="h-10 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 font-semibold shrink-0" aria-label="Lọc trạng thái câu hỏi">
                                <option value="">Tất cả trạng thái</option>
                                <option value="studying">Cần học lại (Sai)</option>
                                <option value="mastered">Đã thuộc (Đúng)</option>
                                <option value="unstudied">Chưa học</option>
                            </select>

                            <!-- Bookmark Filter -->
                            <button @click="toggleTechBookmark" class="h-10 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0" :class="learningStore.filterBookmark ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'">
                                <i class="fa-solid fa-bookmark text-xs"></i>
                                <span>Yêu thích</span>
                            </button>

                            <!-- Mode Switcher -->
                            <div class="h-10 flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-300 dark:border-gray-700 shrink-0">
                                <button
                                    v-for="mode in techModes"
                                    :key="mode.key"
                                    @click="switchTechMode(mode.key)"
                                    class="h-8 px-3 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                                    :class="techMode === mode.key ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
                                >
                                    <i v-if="mode.icon" :class="mode.icon" class="text-[11px]"></i>
                                    <span>{{ mode.label }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>

            <!-- Loading State -->
            <div v-if="learningStore.loading" class="loading-card flex items-center justify-center gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                <span>Đang tải ngân hàng câu hỏi...</span>
            </div>

            <!-- Flashcard Mode -->
            <div v-else-if="techMode === 'flashcard'" class="max-w-2xl mx-auto space-y-4">
                <Flashcard3D v-if="activeTechQuestion" :question="normalizedTechQuestion" :index="learningStore.flashcardIndex" @bookmark="learningStore.toggleBookmark" />
                <div class="flex justify-center items-center gap-4 bg-gray-800/80 p-3 rounded-2xl border border-gray-700/80 shadow-lg">
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="learningStore.flashcardIndex <= 0" @click="moveTech(-1)">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                        <span>Trước</span>
                    </button>
                    <button @click="questionDrawerOpen = true" class="text-xs font-mono font-bold text-indigo-300 bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition" title="Bấm để chọn câu hỏi">
                        {{ learningStore.flashcardIndex + 1 }} / {{ learningStore.techQuestions.length }}
                        <i class="fa-solid fa-caret-down text-[10px] ml-1"></i>
                    </button>
                    <button class="nav-button px-4 py-2 flex items-center gap-1.5" :disabled="learningStore.flashcardIndex >= learningStore.techQuestions.length - 1" @click="moveTech(1)">
                        <span>Sau</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Quiz Mode -->
            <div v-else-if="techMode === 'quiz'" class="max-w-2xl mx-auto space-y-4">
                <!-- Finished screen -->
                <div v-if="quizFinished" class="studio-card text-center space-y-5 py-8 px-6">
                    <div class="space-y-1">
                        <i class="fa-solid fa-trophy text-4xl text-amber-500 mb-2"></i>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Hoàn Thành Bài Quiz!</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Kết quả luyện tập chủ đề {{ String(learningStore.activeTechSlug || '').toUpperCase() }}:</p>
                    </div>
                    <div class="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <div>
                            <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Điểm số</span>
                            <b class="text-lg font-bold text-gray-900 dark:text-white font-mono">{{ quizScore }}/{{ learningStore.techQuestions.length }}</b>
                        </div>
                        <div class="border-x border-gray-200 dark:border-gray-700">
                            <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Chính xác</span>
                            <b class="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">{{ Math.round((quizScore / (learningStore.techQuestions.length || 1)) * 100) }}%</b>
                        </div>
                        <div>
                            <span class="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-medium">Streak tốt nhất</span>
                            <b class="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ maxQuizStreak }} 🔥</b>
                        </div>
                    </div>
                    <div class="flex items-center justify-center gap-3 pt-2">
                        <button @click="restartQuiz" class="primary-button">Làm lại từ đầu</button>
                        <button @click="techMode = 'exam'; startTechExam()" class="secondary-button">Chuyển sang Thi thử</button>
                    </div>
                </div>

                <!-- Active Question -->
                <div v-else-if="currentQuizQuestion" class="studio-card p-5 sm:p-6 space-y-5">
                    <!-- HUD -->
                    <div class="flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-gray-200 dark:border-gray-700">
                                Câu {{ quizIndex + 1 }} / {{ learningStore.techQuestions.length }}
                            </span>
                            <span v-if="quizStreak >= 2" class="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono text-xs border border-amber-300 dark:border-amber-700">
                                Streak: {{ quizStreak }} 🔥
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-gray-600 dark:text-gray-300 text-xs">
                                Điểm: <b class="text-gray-900 dark:text-white">{{ quizScore }}</b>
                            </span>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full bg-gray-200 dark:bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700/60">
                        <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" :style="{ width: `${((quizIndex + 1) / (learningStore.techQuestions.length || 1)) * 100}%` }"></div>
                    </div>

                    <!-- Question Prompt -->
                    <div class="space-y-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(currentQuizQuestion.level)]">
                                {{ currentQuizQuestion.level || 'student' }}
                            </span>
                            <span class="text-xs text-gray-500 font-mono">{{ currentQuizQuestion.title }}</span>
                        </div>
                        <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                            {{ currentQuizQuestion.prompt || currentQuizQuestion.title }}
                        </h3>
                        <div v-if="currentQuizContent.code_example && currentQuizContent.code_example !== currentQuizQuestion.prompt" class="pt-1">
                            <CodeSnippetBox :code="currentQuizContent.code_example" :language="learningStore.activeTechSlug" />
                        </div>
                    </div>

                    <!-- Answer Options -->
                    <div class="grid sm:grid-cols-2 gap-3 pt-2">
                        <button
                            v-for="(opt, oIdx) in currentQuizOptions"
                            :key="oIdx"
                            :disabled="quizAnswered"
                            @click="onQuizSelectOption(opt)"
                            :class="[
                                'text-left p-3.5 rounded-xl border text-xs font-medium transition flex items-start gap-2.5 shadow-sm',
                                getQuizOptionClass(opt)
                            ]"
                        >
                            <span class="font-mono font-bold shrink-0 mt-0.5">{{ String.fromCharCode(65 + oIdx) }}.</span>
                            <span class="flex-1 leading-relaxed">{{ opt.replace(/^[A-D]\.\s*/, '') }}</span>
                            <i v-if="quizAnswered && opt === currentQuizCorrectOption" class="fa-solid fa-check text-white text-sm ml-auto shrink-0"></i>
                            <i v-else-if="quizAnswered && opt === quizSelectedOption && opt !== currentQuizCorrectOption" class="fa-solid fa-xmark text-white text-sm ml-auto shrink-0"></i>
                        </button>
                    </div>

                    <!-- Instant Feedback & Next Button -->
                    <div v-if="quizAnswered" class="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div :class="['p-4 rounded-xl border text-xs leading-relaxed', quizSelectedOption === currentQuizCorrectOption ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200']">
                            <div class="font-bold mb-1 flex items-center gap-1.5 text-sm">
                                <i :class="quizSelectedOption === currentQuizCorrectOption ? 'fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-solid fa-circle-xmark text-rose-600 dark:text-rose-400'"></i>
                                <span>{{ quizSelectedOption === currentQuizCorrectOption ? 'Chính xác!' : 'Chưa chính xác (Đã lưu vào danh sách Cần học lại)!' }}</span>
                            </div>
                            <p class="font-medium text-xs">Đáp án đúng: <b class="font-bold">{{ currentQuizCorrectOption }}</b></p>
                            <p v-if="currentQuizContent.detailed_answer" class="mt-2 text-gray-700 dark:text-gray-300 text-[11px] whitespace-pre-line leading-relaxed">{{ currentQuizContent.detailed_answer }}</p>
                        </div>

                        <div class="flex items-center justify-between gap-3 flex-wrap">
                            <button
                                v-if="quizSelectedOption !== currentQuizCorrectOption"
                                @click="retryQuizQuestion"
                                class="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 text-xs font-bold transition flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 cursor-pointer"
                            >
                                <i class="fa-solid fa-rotate-left text-xs"></i>
                                <span>Học lại câu này</span>
                            </button>
                            <div class="ml-auto">
                                <button @click="nextQuizQuestion" class="primary-button flex items-center gap-1.5">
                                    <span>{{ quizIndex < learningStore.techQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả' }}</span>
                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="loading-card">
                    Chưa có câu hỏi cho chế độ Quiz. Hãy chọn một stack khác hoặc tải lại.
                </div>
            </div>

            <!-- Exam Mode -->
            <div v-else-if="techMode === 'exam'" class="space-y-4">
                <!-- Initial Exam Screen before generation -->
                <div v-if="!techExam.length && !examLoading" class="studio-card text-center space-y-4 py-8 px-4">
                    <i class="fa-solid fa-pen-to-square text-4xl text-indigo-600"></i>
                    <h2 class="font-bold text-slate-900 dark:text-white text-lg">Thi Thử Tech (Đề 20 câu ngẫu nhiên)</h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Hệ thống sẽ lấy ngẫu nhiên 20 câu hỏi từ ngân hàng {{ String(learningStore.activeTechSlug || '').toUpperCase() }} (ưu tiên trắc nghiệm sinh viên). Bạn có thể chọn đáp án, xem đồng hồ tính giờ và nộp bài để được chấm điểm tự động.
                    </p>
                    <button class="primary-button" @click="startTechExam">
                        <i class="fa-solid fa-play mr-1.5 text-xs"></i>
                        <span>Bắt đầu đề thi 20 câu</span>
                    </button>
                </div>

                <!-- Loading State -->
                <div v-else-if="examLoading" class="loading-card flex items-center justify-center gap-2 py-8">
                    <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                    <span>Đang tạo đề thi 20 câu...</span>
                </div>

                <!-- Active / Submitted Exam -->
                <div v-else class="space-y-4">
                    <!-- Top Exam Floating / Sticky Header -->
                    <div class="sticky top-2 z-30 bg-white/95 dark:bg-gray-850/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold font-mono text-xs border border-indigo-200 dark:border-indigo-800">
                                {{ String(learningStore.activeTechSlug || '').toUpperCase() }} EXAM
                            </span>
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-300 font-semibold">
                                Đã làm: <b class="text-indigo-600 dark:text-indigo-400">{{ answeredExamCount }}</b> / {{ techExam.length }} câu
                            </span>
                        </div>

                        <div class="flex items-center gap-2">
                            <span v-if="!examSubmitted" class="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700">
                                ⏱️ {{ formatTimer(examTimer) }}
                            </span>
                            <button
                                v-if="!examSubmitted"
                                @click="submitExam"
                                :disabled="examSubmitting"
                                class="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0"
                            >
                                <i :class="examSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
                                <span>{{ examSubmitting ? 'Đang chấm...' : 'Nộp bài thi' }}</span>
                            </button>
                            <button
                                v-else
                                @click="startTechExam"
                                class="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0"
                            >
                                <i class="fa-solid fa-rotate-right"></i>
                                <span>Làm đề mới</span>
                            </button>
                        </div>
                    </div>

                    <!-- Exam Results Banner if submitted -->
                    <div v-if="examSubmitted" class="studio-card p-5 sm:p-6 border-2 border-indigo-500/50 bg-gradient-to-r from-indigo-950/40 to-purple-950/30 space-y-3">
                        <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-700">
                            <div class="flex items-center gap-2.5">
                                <i class="fa-solid fa-award text-2xl text-amber-400"></i>
                                <div>
                                    <h3 class="font-bold text-white text-base">Kết Quả Bài Thi Thử</h3>
                                    <p class="text-xs text-gray-400">Đã lưu kết quả bài làm vào hồ sơ học tập của bạn.</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-black font-mono text-emerald-400">{{ examScore }} / {{ techExam.length }}</div>
                                <div class="text-[11px] font-mono text-gray-400">{{ Math.round((examScore / (techExam.length || 1)) * 100) }}% chính xác</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 pt-1 text-xs">
                            <span class="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600 text-emerald-300 font-bold">
                                ✅ Đúng: {{ examScore }}
                            </span>
                            <span class="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-600 text-rose-300 font-bold">
                                ❌ Sai / Chưa làm: {{ techExam.length - examScore }}
                            </span>
                        </div>
                    </div>

                    <!-- Questions List -->
                    <div class="space-y-4">
                        <article
                            v-for="(q, index) in techExam"
                            :key="q.id || index"
                            class="studio-card p-5 space-y-3"
                        >
                            <div class="flex items-center justify-between gap-2 pb-1 border-b border-gray-200 dark:border-gray-800">
                                <span class="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                                    Câu {{ index + 1 }}
                                </span>
                                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(q.level)]">
                                    {{ q.level || 'student' }}
                                </span>
                            </div>

                            <p class="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                                {{ q.prompt || q.title }}
                            </p>

                            <!-- Code example if present -->
                            <div v-if="parseJsonObject(q.content).code_example && parseJsonObject(q.content).code_example !== (q.prompt || q.title)" class="pt-1">
                                <CodeSnippetBox :code="parseJsonObject(q.content).code_example" :language="learningStore.activeTechSlug" />
                            </div>

                            <!-- Options -->
                            <div class="grid sm:grid-cols-2 gap-2.5 pt-2">
                                <button
                                    v-for="(opt, oIdx) in getQuestionOptions(q)"
                                    :key="oIdx"
                                    :disabled="examSubmitted"
                                    @click="selectExamAnswer(q.id, opt)"
                                    :class="[
                                        'p-3 rounded-xl border text-xs font-medium text-left transition flex items-start gap-2.5 shadow-sm',
                                        getExamOptionClass(q, opt)
                                    ]"
                                >
                                    <span class="font-mono font-bold shrink-0 mt-0.5">{{ String.fromCharCode(65 + oIdx) }}.</span>
                                    <span class="flex-1 leading-relaxed">{{ opt.replace(/^[A-D]\.\s*/, '') }}</span>
                                    <i v-if="examSubmitted && opt === getCorrectOption(q, getQuestionOptions(q))" class="fa-solid fa-check text-white text-sm ml-auto shrink-0"></i>
                                    <i v-else-if="examSubmitted && userAnswers[q.id] === opt && opt !== getCorrectOption(q, getQuestionOptions(q))" class="fa-solid fa-xmark text-white text-sm ml-auto shrink-0"></i>
                                </button>
                            </div>

                            <!-- Explanation Box after submission -->
                            <div v-if="examSubmitted" class="mt-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
                                <div class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <i class="fa-solid fa-lightbulb text-amber-500"></i>
                                    <span>Đáp án chính xác: <b class="text-emerald-600 dark:text-emerald-400">{{ getCorrectOption(q, getQuestionOptions(q)) }}</b></span>
                                </div>
                                <p v-if="parseJsonObject(q.content).detailed_answer" class="text-gray-600 dark:text-gray-300 text-[11px] whitespace-pre-line leading-relaxed">
                                    {{ parseJsonObject(q.content).detailed_answer }}
                                </p>
                            </div>
                        </article>
                    </div>

                    <!-- Bottom Submit Button -->
                    <div v-if="!examSubmitted" class="flex justify-center pt-4 pb-8">
                        <button @click="submitExam" :disabled="examSubmitting" class="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition flex items-center gap-2">
                            <i :class="examSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
                            <span>Nộp bài thi và chấm điểm</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Centered Question Studio Mode -->
            <div v-else class="tech-study-layout space-y-4">
                <div v-if="activeTechQuestion" class="studio-card space-y-4 sm:space-y-5">
                    <!-- Question Header -->
                    <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(activeTechQuestion.level)]">
                                {{ activeTechQuestion.level || "junior" }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {{ activeTechQuestion.learning_name || learningStore.activeTechSlug }}
                            </span>
                            <button @click="questionDrawerOpen = true" class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700/60 transition flex items-center gap-1.5 shadow-sm" title="Bấm để mở danh sách chọn câu hỏi">
                                <i class="fa-solid fa-list-check text-[11px]"></i>
                                <span>Câu {{ techIndex + 1 }} / {{ learningStore.techQuestions.length }}</span>
                                <i class="fa-solid fa-caret-down text-[10px]"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="switchTechMode('quiz')" class="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm" title="Luyện quiz câu này với các lựa chọn A, B, C, D">
                                <i class="fa-solid fa-circle-question text-xs"></i>
                                <span class="hidden sm:inline">Luyện Quiz</span>
                            </button>
                            <button @click="copyQuestionText" class="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1.5" title="Sao chép câu hỏi">
                                <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-copy'"></i>
                                <span class="hidden sm:inline">{{ clipboard.copied.value ? "Đã chép" : "Sao chép" }}</span>
                            </button>
                            <button @click="learningStore.toggleBookmark(activeTechQuestion)" class="text-lg transition" :class="activeTechQuestion.is_bookmarked ? 'text-amber-500' : 'text-gray-400'" title="Đánh dấu yêu thích">
                                <i :class="activeTechQuestion.is_bookmarked ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star text-gray-400'"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Question Title -->
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">{{ activeTechQuestion.title }}</h2>

                    <!-- Prompt / Scenario -->
                    <div v-if="activeTechQuestion.prompt" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                        <div class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-question text-xs"></i>
                            <span>Đề bài / Tình huống</span>
                        </div>
                        <p class="font-normal">{{ activeTechQuestion.prompt }}</p>
                    </div>

                    <!-- Correct Answer Section (Chỉ hiển thị đáp án đúng) -->
                    <div v-if="displayCorrectAnswer" class="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-2 shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-xs text-emerald-600 dark:text-emerald-400"></i>
                            <span>Đáp án đúng</span>
                        </h3>
                        <p class="text-base sm:text-lg text-emerald-950 dark:text-emerald-100 leading-relaxed font-bold pl-5">
                            {{ displayCorrectAnswer }}
                        </p>
                    </div>

                    <!-- Collapsible Reference for Multiple Choice Options (if available) -->
                    <details v-if="activeQuestionOptions.length" class="group rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 p-3 transition-colors">
                        <summary class="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center justify-between select-none">
                            <span class="flex items-center gap-1.5">
                                <i class="fa-solid fa-list-ul text-[11px]"></i>
                                <span>Xem các phương án lựa chọn (A, B, C, D)</span>
                            </span>
                            <span class="text-[10px] uppercase font-mono text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div class="grid sm:grid-cols-2 gap-2 pt-3">
                            <div
                                v-for="(opt, oIdx) in activeQuestionOptions"
                                :key="oIdx"
                                :class="[
                                    'p-2.5 rounded-lg border text-xs flex items-start gap-2',
                                    opt === activeCorrectOption
                                        ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                ]"
                            >
                                <span class="font-mono font-bold shrink-0 mt-0.5">{{ String.fromCharCode(65 + oIdx) }}.</span>
                                <span class="flex-1 leading-relaxed">{{ opt.replace(/^[A-D]\.\s*/, '') }}</span>
                                <i v-if="opt === activeCorrectOption" class="fa-solid fa-check text-emerald-600 dark:text-emerald-400 text-xs ml-auto shrink-0 mt-0.5"></i>
                            </div>
                        </div>
                    </details>

                    <!-- Quick Answer Section (if distinct) -->
                    <div v-if="showQuickAnswer" class="rounded-2xl border border-teal-200/90 dark:border-teal-800/60 bg-teal-50/70 dark:bg-teal-950/30 p-4 sm:p-5 space-y-2 shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt text-xs text-teal-600 dark:text-teal-400"></i>
                            <span>Trả lời nhanh</span>
                        </h3>
                        <p class="text-sm sm:text-base text-slate-950 dark:text-white leading-relaxed font-bold pl-5">{{ techContent.quick_answer }}</p>
                    </div>

                    <!-- Detailed Explanation Section -->
                    <div v-if="techContent.detailed_answer || techSample.detailed_answer" class="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-2 shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-book-open-reader text-xs text-indigo-600 dark:text-indigo-400"></i>
                            <span>Giải thích chi tiết</span>
                        </h3>
                        <div class="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-5 font-normal">{{ techContent.detailed_answer || techSample.detailed_answer }}</div>
                    </div>

                    <!-- Code Snippet IDE Box -->
                    <CodeSnippetBox v-if="activeCodeSnippet" :code="activeCodeSnippet" :language="learningStore.activeTechSlug" :title="`${String(learningStore.activeTechSlug || 'Code').toUpperCase()} Snippet`" />

                    <!-- Interview Tips Section -->
                    <div v-if="techContent.interview_tips" class="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-950 dark:text-amber-100 leading-relaxed shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                            <i class="fa-solid fa-bullseye text-xs text-amber-600 dark:text-amber-400"></i>
                            <span>Mẹo phỏng vấn</span>
                        </h3>
                        <div class="pl-5 font-medium leading-relaxed">{{ techContent.interview_tips }}</div>
                    </div>

                    <!-- Practical Tips Section -->
                    <div v-if="techContent.practical_tips" class="rounded-2xl border border-sky-200/90 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/30 p-4 text-sm text-sky-950 dark:text-sky-100 leading-relaxed shadow-sm">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400 flex items-center gap-1.5 mb-1.5">
                            <i class="fa-solid fa-lightbulb text-xs text-sky-600 dark:text-sky-400"></i>
                            <span>Ứng dụng thực tế</span>
                        </h3>
                        <div class="pl-5 font-medium leading-relaxed">{{ techContent.practical_tips }}</div>
                    </div>

                    <!-- Bottom Navigation Controls Component -->
                    <ItemNavControls
                        :current-index="techIndex"
                        :total-items="learningStore.techQuestions.length"
                        label="Câu"
                        drawer-icon="fa-solid fa-list-check"
                        @prev="moveTech(-1)"
                        @next="moveTech(1)"
                        @random="randomTechQuestion"
                        @open-drawer="questionDrawerOpen = true"
                    />
                </div>
                <div v-else class="loading-card flex items-center justify-center gap-2">
                    <i class="fa-solid fa-box-open text-gray-400"></i>
                    <span>Chưa có câu hỏi phù hợp với bộ lọc hiện tại.</span>
                </div>
            </div>

            <!-- Polymorphic Item Drawer Modal -->
            <ItemDrawerModal
                :is-open="questionDrawerOpen"
                :title="`Ngân Hàng Câu Hỏi ${String(learningStore.activeTechSlug || 'Tech').toUpperCase()}`"
                icon="fa-solid fa-list-check"
                :items="filteredDrawerQuestions"
                :active-index="techIndex"
                :search-query="drawerSearch"
                search-placeholder="Lọc câu hỏi trong danh sách..."
                badge-key="level"
                @close="questionDrawerOpen = false"
                @select="selectDrawerQuestion"
                @update:search-query="drawerSearch = $event"
            />
        </section>
    </LearningLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useLearningStore } from "@/stores/learning"
import LearningLayout from "@/layouts/LearningLayout.vue"
import Flashcard3D from "@/components/learning/Flashcard3D.vue"
import CodeSnippetBox from "@/components/learning/CodeSnippetBox.vue"
import ItemDrawerModal from "@/components/learning/ItemDrawerModal.vue"
import ItemNavControls from "@/components/learning/ItemNavControls.vue"
import { buildPracticeExam, submitPracticeExam } from "@/api/learning"
import { parseJsonObject, getLevelBadgeClass, getQuestionOptions, getCorrectOption } from "@/composables/useLearningHelper"
import { useClipboard } from "@/composables/useClipboard"

const route = useRoute()
const router = useRouter()
const learningStore = useLearningStore()
const clipboard = useClipboard()
const error = ref("")

// -------------------------------------------------------------
// Modes & Navigation
// -------------------------------------------------------------
const techModes = [
    { key: "split", label: "Học theo câu", icon: "fa-solid fa-book-open" },
    { key: "flashcard", label: "Flashcard", icon: "fa-solid fa-layer-group" },
    { key: "quiz", label: "Luyện Quiz", icon: "fa-solid fa-circle-question" },
    { key: "exam", label: "Thi thử (20 câu)", icon: "fa-solid fa-pen-to-square" },
]
const techMode = ref("split")

const switchTechMode = (key) => {
    if (!techModes.some((m) => m.key === key)) return
    if (key === "quiz" && techIndex.value >= 0) {
        quizIndex.value = techIndex.value
        quizSelectedOption.value = null
        quizAnswered.value = false
    }
    techMode.value = key
    router.replace({ query: { ...route.query, mode: key } })
    if (key === "exam" && !techExam.value.length && !examLoading.value) {
        startTechExam()
    }
}

// -------------------------------------------------------------
// Split Mode (Học theo câu) State
// -------------------------------------------------------------
const activeTechQuestion = computed(() => learningStore.activeQuestion)
const techIndex = computed(() => learningStore.techQuestions.findIndex((q) => q.id === activeTechQuestion.value?.id))
const techContent = computed(() => parseJsonObject(activeTechQuestion.value?.content))
const techSample = computed(() => parseJsonObject(activeTechQuestion.value?.sample_solution))
const normalizedTechQuestion = computed(() => ({
    ...activeTechQuestion.value,
    answer: techContent.value.quick_answer || techContent.value.detailed_answer || techSample.value.detailed_answer,
}))

const activeQuestionOptions = computed(() => getQuestionOptions(activeTechQuestion.value))
const activeCorrectOption = computed(() => getCorrectOption(activeTechQuestion.value, activeQuestionOptions.value))

const displayCorrectAnswer = computed(() => {
    if (activeCorrectOption.value) {
        return activeCorrectOption.value
    }
    const content = techContent.value || {}
    const sample = techSample.value || {}
    return (
        content.correct_answer ||
        sample.reference_answer ||
        content.quick_answer ||
        ""
    )
})

const showQuickAnswer = computed(() => {
    const qa = String(techContent.value?.quick_answer || "").trim()
    if (!qa) return false
    const ca = String(displayCorrectAnswer.value || "").trim()
    if (!ca) return true
    if (qa.toLowerCase() === ca.toLowerCase()) return false
    const cleanedQa = qa.replace(/^đáp án đúng là:?\s*/i, "").trim().toLowerCase()
    if (cleanedQa === ca.toLowerCase()) return false
    return true
})

const activeCodeSnippet = computed(() => {
    if (techContent.value?.code) return techContent.value.code
    if (techContent.value?.code_snippet) return techContent.value.code_snippet
    if (techContent.value?.code_example) {
        const ce = String(techContent.value.code_example).trim()
        if (ce && ce !== activeTechQuestion.value?.prompt && ce !== activeTechQuestion.value?.title) {
            return ce
        }
    }
    return null
})

// -------------------------------------------------------------
// Quiz Mode State & Handlers
// -------------------------------------------------------------
const quizIndex = ref(0)
const quizScore = ref(0)
const quizStreak = ref(0)
const maxQuizStreak = ref(0)
const quizSelectedOption = ref(null)
const quizAnswered = ref(false)
const quizFinished = ref(false)

const currentQuizQuestion = computed(() => learningStore.techQuestions[quizIndex.value] || null)
const currentQuizContent = computed(() => parseJsonObject(currentQuizQuestion.value?.content))
const currentQuizOptions = computed(() => getQuestionOptions(currentQuizQuestion.value))
const currentQuizCorrectOption = computed(() => getCorrectOption(currentQuizQuestion.value, currentQuizOptions.value))

const onQuizSelectOption = (opt) => {
    if (quizAnswered.value) return
    quizSelectedOption.value = opt
    quizAnswered.value = true

    if (opt === currentQuizCorrectOption.value) {
        quizScore.value++
        quizStreak.value++
        if (quizStreak.value > maxQuizStreak.value) {
            maxQuizStreak.value = quizStreak.value
        }
    } else {
        quizStreak.value = 0
    }
}

const nextQuizQuestion = () => {
    if (quizIndex.value < learningStore.techQuestions.length - 1) {
        quizIndex.value++
        quizSelectedOption.value = null
        quizAnswered.value = false
    } else {
        quizFinished.value = true
    }
}

const restartQuiz = () => {
    quizIndex.value = 0
    quizScore.value = 0
    quizStreak.value = 0
    quizSelectedOption.value = null
    quizAnswered.value = false
    quizFinished.value = false
}

const getQuizOptionClass = (opt) => {
    if (!quizAnswered.value) {
        return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
    }
    if (opt === currentQuizCorrectOption.value) {
        return "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-md"
    }
    if (opt === quizSelectedOption.value && opt !== currentQuizCorrectOption.value) {
        return "bg-rose-600 text-white border-rose-600 font-semibold shadow-md"
    }
    return "opacity-50 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-850 text-gray-400"
}

// -------------------------------------------------------------
// Exam Mode (Thi thử) State & Handlers
// -------------------------------------------------------------
const techExam = ref([])
const examLoading = ref(false)
const examSubmitting = ref(false)
const examSubmitted = ref(false)
const examScore = ref(0)
const userAnswers = ref({})
const examTimer = ref(1200)
let examInterval = null

const answeredExamCount = computed(() => Object.keys(userAnswers.value).length)

const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const startExamTimer = () => {
    clearInterval(examInterval)
    examTimer.value = 1200
    examInterval = setInterval(() => {
        if (examTimer.value > 0) {
            examTimer.value--
        } else {
            clearInterval(examInterval)
            if (!examSubmitted.value) {
                submitExam()
            }
        }
    }, 1000)
}

const startTechExam = async () => {
    examLoading.value = true
    error.value = ""
    userAnswers.value = {}
    examSubmitted.value = false
    examScore.value = 0
    try {
        const res = await buildPracticeExam({ category: "tech", learnings: learningStore.activeTechSlug, count: 20 })
        if (res?.questions && res.questions.length > 0) {
            techExam.value = res.questions
        } else if (learningStore.techQuestions.length > 0) {
            const shuffled = [...learningStore.techQuestions].sort(() => 0.5 - Math.random())
            techExam.value = shuffled.slice(0, Math.min(20, shuffled.length))
        } else {
            techExam.value = []
        }
        startExamTimer()
    } catch (err) {
        if (learningStore.techQuestions.length > 0) {
            const shuffled = [...learningStore.techQuestions].sort(() => 0.5 - Math.random())
            techExam.value = shuffled.slice(0, Math.min(20, shuffled.length))
            startExamTimer()
        } else {
            error.value = err?.message || "Không thể tạo đề thi Tech."
        }
    } finally {
        examLoading.value = false
    }
}

const selectExamAnswer = (qId, opt) => {
    if (examSubmitted.value) return
    userAnswers.value[qId] = opt
}

const getExamOptionClass = (q, opt) => {
    const qOptions = getQuestionOptions(q)
    const correct = getCorrectOption(q, qOptions)
    const selected = userAnswers.value[q.id]

    if (!examSubmitted.value) {
        return selected === opt
            ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-md"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-600"
    }
    if (opt === correct) {
        return "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-md"
    }
    if (selected === opt && opt !== correct) {
        return "bg-rose-600 text-white border-rose-600 font-semibold shadow-md"
    }
    return "opacity-50 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-850 text-gray-400"
}

const submitExam = async () => {
    if (examSubmitting.value || examSubmitted.value) return
    examSubmitting.value = true
    clearInterval(examInterval)

    let score = 0
    const attempts = []
    for (const q of techExam.value) {
        const opts = getQuestionOptions(q)
        const correct = getCorrectOption(q, opts)
        const chosen = userAnswers.value[q.id] || ""
        const isCorrect = chosen === correct
        if (isCorrect) score++
        attempts.push({
            item_id: q.id,
            user_answer: chosen,
            is_correct: isCorrect ? 1 : 0,
        })
    }

    examScore.value = score
    examSubmitted.value = true

    try {
        await submitPracticeExam(attempts)
    } catch (err) {
        console.warn("Non-fatal: could not save exam attempt history:", err?.message)
    } finally {
        examSubmitting.value = false
    }
}

// -------------------------------------------------------------
// Drawer & Navigation
// -------------------------------------------------------------
const questionDrawerOpen = ref(false)
const drawerSearch = ref("")

const filteredDrawerQuestions = computed(() => {
    if (!drawerSearch.value.trim()) return learningStore.techQuestions
    const q = drawerSearch.value.trim().toLowerCase()
    return learningStore.techQuestions.filter(
        (item) =>
            String(item.title || "")
                .toLowerCase()
                .includes(q) ||
            String(item.prompt || "")
                .toLowerCase()
                .includes(q),
    )
})

const selectDrawerQuestion = (question) => {
    const idx = learningStore.techQuestions.findIndex((q) => q.id === question.id)
    if (idx !== -1) {
        learningStore.flashcardIndex = idx
        learningStore.selectQuestion(question)
    }
    questionDrawerOpen.value = false
}

const copyQuestionText = () => {
    const q = activeTechQuestion.value
    if (!q) return
    const text = `${q.title}${q.prompt ? `\n\n${q.prompt}` : ""}`
    clipboard.copy(text)
}

let techTimer = null
const debouncedTechLoad = () => {
    clearTimeout(techTimer)
    techTimer = setTimeout(() => {
        learningStore.loadQuestions()
        restartQuiz()
    }, 250)
}

const clearTechSearch = () => {
    learningStore.searchQuery = ""
    learningStore.loadQuestions()
    restartQuiz()
}

const toggleTechBookmark = () => {
    learningStore.filterBookmark = !learningStore.filterBookmark
    learningStore.loadQuestions()
    restartQuiz()
}

const moveTech = (offset) => {
    const index = Math.max(0, Math.min(learningStore.techQuestions.length - 1, techIndex.value + offset))
    learningStore.flashcardIndex = index
    learningStore.selectQuestion(learningStore.techQuestions[index])
}

const randomTechQuestion = () => {
    if (learningStore.techQuestions.length <= 1) return
    let nextIdx
    do {
        nextIdx = Math.floor(Math.random() * learningStore.techQuestions.length)
    } while (nextIdx === techIndex.value)
    learningStore.flashcardIndex = nextIdx
    learningStore.selectQuestion(learningStore.techQuestions[nextIdx])
}

const loadTech = async () => {
    error.value = ""
    try {
        const requestedStack = String(route.params.stack || "").toLowerCase()
        if (requestedStack) {
            learningStore.activeTechSlug = requestedStack
        }
        await learningStore.loadTechStacks()
        await learningStore.loadQuestions()
        restartQuiz()
        if (techMode.value === "exam" && !techExam.value.length) {
            startTechExam()
        }
    } catch (err) {
        error.value = err?.message || "Không thể tải ngân hàng câu hỏi Tech."
    }
}

const handleKeydown = (event) => {
    if (questionDrawerOpen.value) {
        if (event.key === "Escape") {
            questionDrawerOpen.value = false
        }
        return
    }

    const target = event.target
    const tagName = target?.tagName?.toLowerCase()
    if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

    if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveTech(-1)
    } else if (event.key === "ArrowRight") {
        event.preventDefault()
        moveTech(1)
    } else if (event.key === "b" || event.key === "B") {
        event.preventDefault()
        if (activeTechQuestion.value) {
            learningStore.toggleBookmark(activeTechQuestion.value)
        }
    }
}

watch(
    () => route.params.stack,
    (slug) => {
        if (slug && slug !== learningStore.activeTechSlug) {
            learningStore.setTechSlug(String(slug))
            techExam.value = []
            restartQuiz()
            if (techMode.value === "exam") {
                startTechExam()
            }
        }
    },
)

watch(
    () => route.query.mode,
    (newMode) => {
        if (newMode && techModes.some((m) => m.key === newMode) && techMode.value !== newMode) {
            techMode.value = newMode
            if (newMode === "exam" && !techExam.value.length && !examLoading.value) {
                startTechExam()
            }
        }
    },
)

onMounted(() => {
    if (route.query.mode && techModes.some((m) => m.key === route.query.mode)) {
        techMode.value = route.query.mode
    }
    loadTech()
    document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
    clearTimeout(techTimer)
    clearInterval(examInterval)
    document.removeEventListener("keydown", handleKeydown)
})
</script>
