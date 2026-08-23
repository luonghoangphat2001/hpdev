<template>
    <div class="studio-card p-4 sm:p-5 space-y-3.5 relative group hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all shadow-sm overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
        <!-- Top toolbar -->
        <div class="flex items-center justify-end gap-1.5 pb-2 border-b border-slate-200/80 dark:border-slate-800 relative z-10">
            <button @click="$emit('speak', word.title)" class="w-9 h-9 rounded-xl text-base text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center shadow-xs border border-indigo-200 dark:border-indigo-800 shrink-0" title="Phát âm tiếng Anh">
                <i class="fa-solid fa-volume-high"></i>
            </button>
            <button @click="$emit('send-discord', word)" class="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 text-xs shadow-xs" title="Gửi vào Discord">
                <i class="fa-solid fa-bell text-xs"></i>
            </button>
            <button @click="$emit('remove', word)" class="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 text-xs shadow-xs" title="Xóa từ vựng">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>

        <!-- Vocabulary focal core -->
        <div class="relative py-1 flex flex-col items-center gap-3">
            <!-- Central core: English word + IPA + Vietnamese meaning -->
            <div class="relative z-10 text-center px-5 py-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/90 dark:border-indigo-400 shadow-sm ring-4 ring-indigo-500/10 w-full transition-transform transform group-hover:scale-[1.01]">
                <!-- Word -->
                <div class="flex items-center justify-center">
                    <h3 class="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">{{ word.title }}</h3>
                </div>

                <!-- IPA pronunciation -->
                <div v-if="word.content?.pronunciation" class="mt-1.5">
                    <span class="text-xs sm:text-sm font-semibold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/80 px-3 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 inline-block">
                        /{{ word.content.pronunciation }}/
                    </span>
                </div>

                <!-- Vietnamese meaning directly in the focal core -->
                <div v-if="word.content?.meaning || word.prompt" class="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <p class="font-bold text-emerald-700 dark:text-emerald-400 text-base sm:text-lg leading-snug">
                        {{ word.content?.meaning || word.prompt }}
                    </p>
                </div>
            </div>

            <!-- Supporting full-width context example -->
            <div v-if="word.content?.example" class="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3.5 space-y-1.5 shadow-xs text-xs sm:text-sm">
                <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <i class="fa-solid fa-quote-left text-[11px]"></i>
                    <span>Ví dụ</span>
                </div>
                <p class="italic font-medium text-slate-800 dark:text-slate-200 leading-relaxed pl-1">
                    "{{ word.content.example }}"
                </p>

                <!-- Vietnamese translation of example -->
                <p v-if="word.content?.note" class="text-xs text-slate-500 dark:text-slate-400 pl-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 font-normal">
                    ↳ {{ word.content.note }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    word: {
        type: Object,
        required: true,
    },
})

defineEmits(["speak", "send-discord", "remove"])
</script>
