<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div @click="$emit('close')" class="absolute inset-0 bg-gray-950/70 backdrop-blur-xs transition-opacity"></div>

        <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col">
                <!-- Drawer Header -->
                <div class="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-850">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <i :class="icon || 'fa-solid fa-list-check'" class="text-sm"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ title || "Danh sách bài tập" }}</h3>
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{{ items.length }} mục có sẵn</p>
                        </div>
                    </div>
                    <button @click="$emit('close')" class="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition border border-gray-300 dark:border-gray-700" title="Đóng danh sách">
                        ✕
                    </button>
                </div>

                <!-- Drawer Search -->
                <div class="p-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input
                            :value="searchQuery"
                            @input="$emit('update:searchQuery', $event.target.value)"
                            :placeholder="searchPlaceholder || 'Tìm theo tiêu đề, nội dung...'"
                            class="w-full pl-8 pr-7 py-2 bg-gray-50 dark:bg-gray-800/90 rounded-xl border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button v-if="searchQuery" @click="$emit('update:searchQuery', '')" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                            ✕
                        </button>
                    </div>
                </div>

                <!-- Drawer Items List -->
                <div class="flex-1 overflow-y-auto p-3.5 space-y-2 divide-y divide-transparent">
                    <button
                        v-for="(item, idx) in items"
                        :key="item.id || idx"
                        @click="$emit('select', item)"
                        :class="[
                            'w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-1.5 shadow-xs',
                            activeIndex === idx
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/80 ring-2 ring-indigo-500/30'
                                : 'bg-white dark:bg-gray-850/80 border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 text-gray-700 dark:text-gray-300'
                        ]"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-mono font-bold text-[11px]" :class="activeIndex === idx ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'">
                                #{{ idx + 1 }}
                            </span>
                            <span v-if="item[badgeKey] || item.level || item.category" :class="['px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border', getLevelBadgeClass(item[badgeKey] || item.level)]">
                                {{ item[badgeKey] || item.level || item.category }}
                            </span>
                        </div>
                        <p class="font-semibold text-xs leading-snug line-clamp-2" :class="activeIndex === idx ? 'text-indigo-900 dark:text-white font-bold' : 'text-gray-900 dark:text-gray-100'">
                            {{ item.title || item.question || item.word || item.prompt }}
                        </p>
                        <p v-if="item.prompt && item.prompt !== item.title" class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                            {{ item.prompt }}
                        </p>
                    </button>

                    <div v-if="!items.length" class="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
                        <i class="fa-solid fa-box-open text-2xl mb-2 block"></i>
                        <span>Không tìm thấy mục phù hợp.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { getLevelBadgeClass } from "@/composables/useLearningHelper"

defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: "Danh sách bài tập",
    },
    icon: {
        type: String,
        default: "fa-solid fa-list-check",
    },
    items: {
        type: Array,
        default: () => [],
    },
    activeIndex: {
        type: Number,
        default: 0,
    },
    searchQuery: {
        type: String,
        default: "",
    },
    searchPlaceholder: {
        type: String,
        default: "Tìm theo tiêu đề, nội dung...",
    },
    badgeKey: {
        type: String,
        default: "level",
    },
})

defineEmits(["close", "select", "update:searchQuery"])
</script>
