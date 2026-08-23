<template>
    <div id="page-config" class="flex-1 overflow-y-auto bg-gray-900 text-gray-100 touch-scroll h-full">
        <div class="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 safe-area-pb">
            <!-- Header Section -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-800">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 sm:gap-3">
                        <span class="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-base sm:text-lg">⚙️</span>
                        Cấu hình Hệ thống
                    </h1>
                    <p class="text-[11px] sm:text-xs text-gray-400 mt-1">Quản trị mô hình AI đa nền tảng, OpenClaw, Providers và Prompts</p>
                </div>
                <div class="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <span v-if="savedMsg" class="text-xs text-emerald-400 font-medium px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-1.5 shadow-sm"> <span>✓</span> Đã lưu! </span>
                    <button @click="saveConfig" :disabled="saving" class="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 sm:gap-2 active:scale-95 disabled:opacity-50"><span>💾</span> {{ saving ? "Đang lưu..." : "Lưu cấu hình" }}</button>
                </div>
            </div>

            <!-- Tab Navigation (Slug-based) -->
            <div class="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
                <router-link v-for="t in tabs" :key="t.id" :to="'/config/' + t.id" :class="['px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap', currentTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
                    <span>{{ t.icon }}</span>
                    <span>{{ t.label }}</span>
                </router-link>
            </div>

            <!-- Tab Panels Container -->
            <div class="pt-1 sm:pt-2">
                <!-- Panel 1: Multi-Platform Models -->
                <div v-show="currentTab === 'models'" class="space-y-6">
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <!-- Discord Bot Model -->
                        <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/60 shadow-xl space-y-4">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h2 class="font-bold text-base text-gray-100 flex items-center gap-2.5">
                                        <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-lg">🤖</span>
                                        Discord Bot — Model Mặc Định
                                    </h2>
                                    <p class="text-xs text-gray-400 mt-1">Mô hình AI xử lý tin nhắn trực tiếp và lệnh trong server Discord</p>
                                </div>
                            </div>
                            <input v-model="form.discord_active_model" placeholder="gemini" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
                        </div>

                        <!-- Telegram Bot Model -->
                        <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/60 shadow-xl space-y-4">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h2 class="font-bold text-base text-gray-100 flex items-center gap-2.5">
                                        <span class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-lg">📱</span>
                                        Telegram Bot — Model Mặc Định
                                    </h2>
                                    <p class="text-xs text-gray-400 mt-1">Mô hình AI xử lý tin nhắn chat và lệnh trong bot Telegram</p>
                                </div>
                            </div>
                            <input v-model="form.telegram_active_model" placeholder="gemini" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
                        </div>

                        <!-- Learning Hub Model -->
                        <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/60 shadow-xl space-y-4">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h2 class="font-bold text-base text-gray-100 flex items-center gap-2.5">
                                        <span class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-lg">🎓</span>
                                        Learning Hub — Model Mặc Định
                                    </h2>
                                    <p class="text-xs text-gray-400 mt-1">Dùng để sinh bài tập Tech, Vocab, Quiz và chấm điểm AI</p>
                                </div>
                            </div>
                            <input v-model="form.learning_active_model" placeholder="gemini" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
                        </div>

                        <!-- Web Chat Model -->
                        <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/60 shadow-xl space-y-4">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h2 class="font-bold text-base text-gray-100 flex items-center gap-2.5">
                                        <span class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-lg">💻</span>
                                        Web Chat — Model Mặc Định
                                    </h2>
                                    <p class="text-xs text-gray-400 mt-1">Mô hình AI mặc định cho giao diện Web Dashboard Chat</p>
                                </div>
                            </div>
                            <input v-model="form.active_model" placeholder="gemini" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                </div>

                <!-- Panel 2: Providers -->
                <div v-show="currentTab === 'providers'" class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg">
                            <h2 class="font-semibold mb-1 text-gray-200 flex items-center gap-2"><span>🌟</span> Gemini Model</h2>
                            <p class="text-xs text-gray-400 mb-4">Chọn phiên bản Google Gemini</p>
                            <select v-model="form.gemini_model" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <option value="models/gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng)</option>
                                <option value="models/gemini-2.0-flash">gemini-2.0-flash</option>
                                <option value="models/gemini-1.5-pro">gemini-1.5-pro</option>
                                <option value="models/gemini-1.5-flash">gemini-1.5-flash</option>
                            </select>
                        </div>

                        <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg">
                            <h2 class="font-semibold mb-1 text-gray-200 flex items-center gap-2"><span>🤖</span> ChatGPT Model</h2>
                            <p class="text-xs text-gray-400 mb-4">Chọn phiên bản OpenAI GPT</p>
                            <select v-model="form.chatgpt_model" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <option value="gpt-4o">gpt-4o (Khuyên dùng)</option>
                                <option value="gpt-4o-mini">gpt-4o-mini</option>
                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                            </select>
                        </div>
                    </div>

                    <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg">
                        <h2 class="font-semibold mb-1 text-gray-200 flex items-center gap-2"><span>✳️</span> Claude Model & Base URL</h2>
                        <p class="text-xs text-gray-400 mb-4">Cấu hình phiên bản Anthropic Claude và Proxy Endpoint.</p>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Phiên bản Claude</label>
                                <select v-model="form.claude_model" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500">
                                    <optgroup label="Claude 4.6">
                                        <option value="claude-sonnet-4-6">Sonnet 4.6 (Khuyên dùng)</option>
                                        <option value="claude-opus-4-6">Opus 4.6</option>
                                    </optgroup>
                                    <optgroup label="Claude 4.5">
                                        <option value="claude-sonnet-4-5">Sonnet 4.5</option>
                                        <option value="claude-opus-4-5">Opus 4.5</option>
                                        <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Claude Base URL (Proxy)</label>
                                <input v-model="form.claude_base_url" type="url" placeholder="https://your-claude-proxy.example.com/" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel 3: OpenClaw -->
                <div v-show="currentTab === 'openclaw'" class="space-y-6">
                    <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg space-y-4">
                        <h2 class="font-semibold text-gray-200 flex items-center gap-2"><span>🦅</span> OpenClaw Autonomous Agents</h2>
                        <p class="text-xs text-gray-400">Cấu hình kết nối hệ thống Multi-Agent OpenClaw Crawler & Task Workers</p>
                        <label class="flex items-center gap-3 text-sm text-gray-300"><input v-model="form.openclaw_enabled" type="checkbox" class="w-4 h-4 accent-indigo-500" /> Bật tích hợp OpenClaw</label>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">OpenClaw Base URL</label>
                                <input v-model="form.openclaw_url" type="text" placeholder="http://openclaw:4000" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Google Custom Search Engine ID (CX)</label>
                                <input v-model="form.google_cx" type="text" placeholder="xxxxxxxxxxxxxxx:xxxxxxxxxx" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel 4: Prompts -->
                <div v-show="currentTab === 'prompts'" class="space-y-6">
                    <!-- System Persona Prompt -->
                    <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg">
                        <h2 class="font-semibold mb-1 text-gray-200 flex items-center gap-2"><span>📝</span> System Persona Prompt</h2>
                        <p class="text-xs text-gray-400 mb-4">Định hình tính cách, phong cách trả lời và ngữ cảnh hoạt động của bot.</p>
                        <textarea v-model="form.system_prompt" rows="5" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none resize-y text-sm font-sans text-white"></textarea>
                    </div>

                    <!-- 🎓 Learning Hub System Prompts Configuration -->
                    <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg space-y-4">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h2 class="font-semibold mb-1 text-gray-200 flex items-center gap-2"><span>🎓</span> Learning Hub — Tuỳ biến System Prompts AI</h2>
                                <p class="text-xs text-gray-400" v-pre>
                                    Tuỳ chỉnh System Prompt cho các chức năng sinh bài & chấm điểm (để trống nếu muốn dùng mặc định). Hỗ trợ biến: <code class="text-indigo-300">{{ stackName }}</code
                                    >, <code class="text-indigo-300">{{ topicName }}</code
                                    >, <code class="text-indigo-300">{{ level }}</code
                                    >, <code class="text-indigo-300">{{ count }}</code
                                    >, <code class="text-indigo-300">{{ existingWords }}</code>
                                </p>
                            </div>
                            <button @click="fillAllPromptTemplates" type="button" class="px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-700 transition flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto">📋 Nhập tất cả mẫu</button>
                        </div>

                        <div class="space-y-4">
                            <div v-for="p in promptList" :key="p.key">
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block text-xs font-semibold text-indigo-400">{{ p.label }}</label>
                                    <div class="flex gap-2">
                                        <button @click="fillPromptTemplate(p.key)" type="button" class="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium">📋 Nhập mẫu</button>
                                        <button @click="form[p.key] = ''" type="button" class="text-xs text-gray-500 hover:text-gray-400">Xóa</button>
                                    </div>
                                </div>
                                <textarea v-model="form[p.key]" rows="3" :placeholder="p.placeholder" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-xs font-mono text-white"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel 5: Logs -->
                <div v-show="currentTab === 'logs'" class="space-y-6">
                    <div class="bg-gray-800/90 rounded-xl p-6 border border-gray-700/60 shadow-lg space-y-4">
                        <h2 class="font-semibold text-gray-200 flex items-center gap-2"><span>🪵</span> Cấu hình Nhật ký Logs & Lưu trữ</h2>
                        <p class="text-xs text-gray-400">Thời gian tự động dọn dẹp log cũ và giới hạn dung lượng</p>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Thời gian lưu log (ngày)</label>
                                <input v-model="form.log_retention_days" type="number" placeholder="14" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 text-sm text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Save Action Bar -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 pb-8 border-t border-gray-800">
                <p class="text-xs text-gray-500 text-center sm:text-left">Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi lưu.</p>
                <button @click="saveConfig" :disabled="saving" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"><span>💾</span> {{ saving ? "Đang lưu..." : "Lưu toàn bộ cấu hình" }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useConfigStore } from "@/stores/config"

const route = useRoute()
const configStore = useConfigStore()
const saving = ref(false)
const savedMsg = ref(false)

const tabs = [
    { id: "models", label: "Models", icon: "🤖" },
    { id: "providers", label: "Providers", icon: "🔑" },
    { id: "openclaw", label: "AI Agents", icon: "🦅" },
    { id: "prompts", label: "Prompts", icon: "📝" },
    { id: "logs", label: "Log Config", icon: "🪵" },
]

const currentTab = computed(() => {
    const tabParam = route.params.tab || route.query.tab
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
        return tabParam
    }
    return "models"
})

const promptTemplates = {
    learning_prompt_tech: "Bạn là Senior Technical Architect và Lead Interviewer. Tạo {{count}} câu hỏi thực chiến cho {{stackName}}, cấp độ {{level}}. Chỉ trả JSON ARRAY đúng schema Learning, không đánh số title, nội dung ngắn gọn và không thêm văn bản ngoài JSON.",
    learning_prompt_vocab: "Bạn là giảng viên ngôn ngữ Anh. Tạo {{count}} từ vựng cho {{topicName}}, cấp độ {{level}}. Không lặp từ trong {{existingWords}}. Chỉ trả JSON ARRAY đúng schema Learning.",
    learning_prompt_quiz: "Bạn là Quiz Master. Tạo {{count}} câu hỏi trắc nghiệm cho {{topicName}}, cấp độ {{level}}, mỗi câu có 4 lựa chọn và đáp án đúng. Chỉ trả JSON ARRAY.",
    learning_prompt_reading: 'Bạn là Giám khảo IELTS Academic Reading. Tạo {{count}} bài Đọc hiểu chuẩn Cambridge cho "{{topicName}}", cấp độ {{level}}. Bài đọc tiếng Anh 250-400 từ chia đoạn rõ ràng [Paragraph A], [Paragraph B], [Paragraph C]..., kèm 4-6 câu hỏi gồm trắc nghiệm Multiple Choice (4 lựa chọn A, B, C, D) và True/False/Not Given, có đáp án đúng, trích dẫn đoạn văn (paragraph_ref) và lời giải thích chi tiết. Chỉ trả JSON ARRAY đúng schema Learning.',
    learning_prompt_writing: 'Bạn là Giám khảo IELTS Academic Writing. Tạo {{count}} đề thi Viết chuẩn Cambridge (Task 1 hoặc Task 2) cho "{{topicName}}", Target Band: {{level}}. Đề bài chuẩn rubric Cambridge ("You should spend about 40 minutes... Write at least 250 words"), kèm dạng bài task_type, 5-8 từ vựng học thuật C1/C2 kèm nghĩa tiếng Việt, dàn ý 4 đoạn, bài luận mẫu Band 9.0 (280-330 từ) và lời phê của giám khảo (examiner_notes). Chỉ trả JSON ARRAY đúng schema Learning.',
    learning_prompt_speaking: 'Bạn là Giám khảo IELTS Speaking Cambridge. Tạo {{count}} đề thi Nói mô phỏng 3 phần chuẩn Cambridge cho "{{topicName}}", Target Band: {{level}}. Bao gồm Part 1 (3-4 câu hỏi phỏng vấn), Part 2 Cue Card (thẻ chủ đề với 4 gợi ý và thời gian chuẩn bị 1 phút), Part 3 (3-4 câu hỏi thảo luận chuyên sâu), 5-8 thành ngữ/collocations bản xứ C1/C2 kèm nghĩa tiếng Việt và bài mẫu câu trả lời Band 8.5+ hoàn chỉnh cho cả 3 phần. Chỉ trả JSON ARRAY đúng schema Learning.',
    learning_prompt_ielts: 'Bạn là Giám khảo IELTS Quốc tế chấm thi chính thức của Cambridge. Tạo {{count}} đề thi IELTS Academic/General chuẩn Cambridge cho "{{topicName}}", Target Band: {{level}}. Đề bài chuẩn rubric Cambridge ("You should spend about 40 minutes on this task... Write at least 250 words" cho Task 2 hoặc "You should spend about 20 minutes... Write at least 150 words" cho Task 1), kèm dạng bài task_type, 5-8 từ vựng học thuật C1/C2 kèm nghĩa tiếng Việt, dàn ý 4 đoạn gợi ý, bài luận mẫu Band 9.0 (280-340 từ) và lời phê chi tiết của giám khảo (examiner_notes) theo 4 tiêu chí TR, CC, LR, GRA. Chỉ trả JSON ARRAY đúng schema Learning.',
    learning_prompt_eval_tech: "Bạn là Senior Technical Architect phỏng vấn ứng viên. Chấm câu trả lời dựa trên đề bài {{title}} và câu trả lời {{submission}}, trả JSON có score (thang 10), summary, strengths, improvements và follow_up_trap.",
    learning_prompt_eval_reading: "Bạn là Giảng viên Tiếng Anh học thuật Cambridge chấm bài đọc hiểu. Đánh giá câu trả lời của học viên dựa trên bài đọc {{title}}, đoạn văn và câu hỏi cho bài làm {{submission}}, trả JSON có score (thang 10), summary, strengths, improvements và detailed_corrections.",
    learning_prompt_eval_writing: "Bạn là Giám khảo IELTS Writing Quốc tế. Đánh giá bài viết dựa trên đề bài {{title}} và bài làm {{submission}} theo đúng 4 tiêu chí Band Descriptors (TR, CC, LR, GRA từ 0.0 - 9.0), trả JSON có overall_band, criteria_scores, examiner_comment, strengths, improvements và detailed_corrections.",
    learning_prompt_eval_speaking: "Bạn là Giám khảo IELTS Speaking Cambridge. Đánh giá bài nói dựa trên đề bài {{title}} và bài làm/transcript {{submission}} theo đúng 4 tiêu chí Speaking Descriptors (FC, LR, GRA, PR từ 0.0 - 9.0), trả JSON có overall_band, criteria_scores, summary, examiner_comment, strengths, improvements và native_upgrades.",
    learning_prompt_eval_ielts: "Bạn là Giám khảo IELTS Quốc tế chấm thi chính thức. Đánh giá bài làm cho đề {{title}} dựa trên bài nộp {{submission}} theo đúng 4 tiêu chí Band Descriptors (TR, CC, LR, GRA), trả JSON có overall_band, criteria_scores, examiner_comment, strengths, improvements và detailed_corrections.",
}

const promptList = [
    { key: "learning_prompt_tech", label: "💻 Tech Questions Prompt (Sinh câu hỏi 6 Stacks)", placeholder: "System prompt mặc định cho Tech Question..." },
    { key: "learning_prompt_vocab", label: "📖 Vocabulary Prompt (Sinh từ vựng 50 Topics)", placeholder: "System prompt mặc định cho Vocabulary..." },
    { key: "learning_prompt_quiz", label: "🧩 Quiz Prompt (Soạn đề trắc nghiệm)", placeholder: "System prompt mặc định cho Quiz..." },
    { key: "learning_prompt_reading", label: "📖 Reading Comprehension Prompt (Soạn bài đọc hiểu)", placeholder: "System prompt mặc định cho Reading Comprehension..." },
    { key: "learning_prompt_writing", label: "✍️ Writing Studio Prompt (Soạn đề bài luyện viết)", placeholder: "System prompt mặc định cho Writing Studio..." },
    { key: "learning_prompt_speaking", label: "🗣️ Speaking Prompt (Kịch bản luyện nói)", placeholder: "System prompt mặc định cho Speaking..." },
    { key: "learning_prompt_ielts", label: "🎯 IELTS Prep Prompt (Đề thi IELTS)", placeholder: "System prompt mặc định cho IELTS..." },
    { key: "learning_prompt_eval_tech", label: "🤖 Tech Mock Interview Evaluator (AI Chấm điểm Tech)", placeholder: "System prompt mặc định cho Mock Interview..." },
    { key: "learning_prompt_eval_reading", label: "📖 Reading Evaluator (AI Chấm câu trả lời Đọc hiểu)", placeholder: "System prompt mặc định cho chấm Đọc hiểu..." },
    { key: "learning_prompt_eval_writing", label: "✍️ Writing Evaluator (AI Chấm & Sửa bài Viết)", placeholder: "System prompt mặc định cho chấm bài Viết..." },
    { key: "learning_prompt_eval_speaking", label: "🗣️ Speaking Evaluator (AI Chấm & Sửa bài Nói chuẩn IELTS)", placeholder: "System prompt mặc định cho chấm bài Nói..." },
    { key: "learning_prompt_eval_ielts", label: "🎯 IELTS Evaluator (AI Chấm điểm IELTS Band 0-9.0)", placeholder: "System prompt mặc định cho IELTS Examiner..." },
]

const form = reactive({
    active_model: "gemini",
    learning_active_model: "gemini",
    discord_active_model: "claude",
    telegram_active_model: "gemini",
    gemini_model: "models/gemini-2.5-flash",
    chatgpt_model: "gpt-4o",
    claude_model: "claude-sonnet-4-6",
    claude_base_url: "",
    openclaw_url: "http://openclaw:4000",
    openclaw_enabled: true,
    google_cx: "",
    system_prompt: "",
    log_retention_days: 14,
    learning_prompt_tech: "",
    learning_prompt_vocab: "",
    learning_prompt_quiz: "",
    learning_prompt_reading: "",
    learning_prompt_writing: "",
    learning_prompt_speaking: "",
    learning_prompt_ielts: "",
    learning_prompt_eval_tech: "",
    learning_prompt_eval_reading: "",
    learning_prompt_eval_writing: "",
    learning_prompt_eval_speaking: "",
    learning_prompt_eval_ielts: "",
})

const fillPromptTemplate = (key) => {
    if (promptTemplates[key]) {
        form[key] = promptTemplates[key]
    }
}

const fillAllPromptTemplates = () => {
    Object.keys(promptTemplates).forEach((key) => {
        form[key] = promptTemplates[key]
    })
}

const loadConfig = async () => {
    try {
        const data = await configStore.fetchConfig()
        if (data && typeof data === "object") {
            Object.keys(data).forEach((key) => {
                if (key in form) {
                    form[key] = key === "openclaw_enabled" ? String(data[key]) === "true" : data[key]
                }
            })
        }
    } catch (err) {
        console.error("Failed to load config", err)
    }
}

const saveConfig = async () => {
    saving.value = true
    savedMsg.value = false
    try {
        await configStore.saveConfig({ ...form, openclaw_enabled: form.openclaw_enabled ? "true" : "false" })
        savedMsg.value = true
        setTimeout(() => {
            savedMsg.value = false
        }, 3000)
    } catch (err) {
        alert(err.message || "Lỗi khi lưu cấu hình")
    } finally {
        saving.value = false
    }
}

onMounted(loadConfig)
</script>
