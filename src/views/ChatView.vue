<template>
    <div id="page-chat" class="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- Model selector bar -->
        <div id="model-bar" class="flex items-center justify-center py-2.5 px-4 border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md relative shrink-0 shadow-sm">
            <ModelSelector />
        </div>

        <!-- Messages Window -->
        <div ref="chatContainer" id="chat-window" class="flex-1 overflow-y-auto py-5 sm:py-7 px-3 sm:px-6 space-y-4 sm:space-y-6 touch-scroll">
            <!-- Empty Welcome State -->
            <div v-if="chatStore.messages.length === 0" id="chat-empty" class="flex flex-col items-center justify-center h-full text-center px-4">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden mb-3.5 sm:mb-4 shadow-md ring-4 ring-indigo-500/10 shrink-0" style="width: 64px; height: 64px; min-width: 64px; min-height: 64px">
                    <img src="/images/dan.png" alt="Đần" width="64" height="64" class="w-full h-full object-cover rounded-2xl" style="width: 64px; height: 64px; aspect-ratio: 1/1" loading="eager" decoding="sync" />
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Xin chào! Tôi là Đần</h2>
                <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">AI được tạo bởi Hoàng Phát, kết hợp nhiều model AI. Hỏi tôi bất cứ điều gì!</p>
            </div>

            <!-- Message Bubbles -->
            <div v-for="msg in chatStore.messages" :key="msg.id" :class="['flex gap-3 max-w-3xl w-full', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto']">
                <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm" :class="msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'">
                    <span v-if="msg.role === 'user'">{{ authStore.userInitial }}</span>
                    <i v-else class="fa-solid fa-robot text-xs"></i>
                </div>

                <div :class="['p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] whitespace-pre-wrap break-words', msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : msg.isError ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200' : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none']">
                    <p>{{ msg.content }}</p>
                    <span class="block text-[10px] text-right mt-1.5 opacity-60 font-mono">{{ msg.time }}</span>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="chatStore.loading" class="flex items-center gap-3 mr-auto">
                <div class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <i class="fa-solid fa-robot text-xs"></i>
                </div>
                <div class="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span class="ml-1 font-mono font-semibold">Đần đang suy nghĩ và trả lời...</span>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="shrink-0 border-t border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4">
            <div class="max-w-3xl mx-auto">
                <form @submit.prevent="handleSend" class="flex items-end gap-2.5 sm:gap-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 px-3.5 sm:px-4 py-2.5 sm:py-3 transition shadow-sm">
                    <textarea v-model="inputText" @keydown.enter.exact.prevent="handleSend" rows="1" placeholder="Hỏi Đần điều gì đó… (Shift+Enter để xuống dòng)" class="flex-1 bg-transparent resize-none text-base sm:text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 max-h-36 sm:max-h-40 leading-relaxed"></textarea>
                    <button type="submit" :disabled="!inputText.trim() || chatStore.loading" class="shrink-0 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl sm:rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm shadow-indigo-600/30" aria-label="Gửi tin nhắn">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
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

const scrollToBottom = () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }
    })
}

watch(() => chatStore.messages.length, scrollToBottom)

const handleSend = async () => {
    const text = inputText.value.trim()
    if (!text || chatStore.loading) return
    inputText.value = ""
    await chatStore.sendMessage(text)
    scrollToBottom()
}
</script>
