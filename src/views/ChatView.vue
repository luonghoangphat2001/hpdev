<template>
    <div class="h-full flex flex-col min-w-0">
        <!-- Top Header -->
        <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <span>💬</span>
                    <span>Trò chuyện AI</span>
                </h2>
                <ModelSelector />
            </div>

            <button v-if="chatStore.messages.length > 0" @click="chatStore.clearChat" class="text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-800 transition">Làm mới chat</button>
        </header>

        <!-- Message List -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
            <!-- Empty Welcome State -->
            <div v-if="chatStore.messages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-8">
                <img src="/images/dan.png" alt="Đần" class="w-16 h-16 rounded-full mb-4 ring-4 ring-indigo-500/20 shadow-xl" />
                <h3 class="text-lg font-bold text-white mb-1">Chào bạn, mình là Đần AI!</h3>
                <p class="text-xs text-gray-400 max-w-md">Hãy đặt câu hỏi về lập trình, tiếng Anh, hệ thống, hoặc yêu cầu giải thích bất kỳ kiến thức nào.</p>
            </div>

            <!-- Message Bubbles -->
            <div v-for="msg in chatStore.messages" :key="msg.id" :class="['flex gap-3 max-w-3xl w-full', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto']">
                <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md" :class="msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-indigo-400 border border-gray-700'">
                    {{ msg.role === "user" ? authStore.userInitial : "🤖" }}
                </div>

                <div :class="['p-4 rounded-3xl text-sm leading-relaxed max-w-[85%] shadow-md whitespace-pre-wrap break-words', msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : msg.isError ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-gray-800/90 border border-gray-700/80 text-gray-200 rounded-tl-none']">
                    <p>{{ msg.content }}</p>
                    <span class="block text-[10px] text-right mt-1.5 opacity-60 font-mono">{{ msg.time }}</span>
                </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="chatStore.loading" class="flex items-center gap-3 mr-auto">
                <div class="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-indigo-400">🤖</div>
                <div class="px-4 py-3 rounded-2xl bg-gray-800/80 border border-gray-700 text-xs text-indigo-300 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                    <span class="ml-1 font-mono">Đần AI đang suy nghĩ...</span>
                </div>
            </div>
        </div>

        <!-- Input Bar -->
        <div class="p-3 md:p-4 border-t border-gray-800 bg-gray-900/90 shrink-0">
            <form @submit.prevent="handleSend" class="max-w-4xl mx-auto flex items-end gap-2">
                <div class="flex-1 bg-gray-800/90 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                    <textarea v-model="inputText" @keydown.enter.exact.prevent="handleSend" rows="1" placeholder="Hỏi bất cứ điều gì... (Enter để gửi, Shift+Enter xuống dòng)" class="w-full px-4 py-3 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-32 min-h-[44px]"></textarea>
                </div>

                <button type="submit" :disabled="!inputText.trim() || chatStore.loading" class="h-[44px] px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue"
import { useAuthStore } from "../stores/auth"
import { useChatStore } from "../stores/chat"
import ModelSelector from "../components/common/ModelSelector.vue"

const authStore = useAuthStore()
const chatStore = useChatStore()

const inputText = ref("")
const chatContainer = ref(null)

const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

const handleSend = async () => {
    if (!inputText.value.trim() || chatStore.loading) return
    const text = inputText.value
    inputText.value = ""
    await chatStore.sendMessage(text)
    scrollToBottom()
}

watch(
    () => chatStore.messages.length,
    () => {
        scrollToBottom()
    },
)
</script>
