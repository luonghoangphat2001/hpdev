<template>
    <div class="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
            @click="$emit('prev')"
            :disabled="currentIndex <= 0"
            class="nav-button flex items-center gap-1.5"
            title="Bài trước (←)"
        >
            <i class="fa-solid fa-arrow-left text-xs"></i>
            <span class="hidden sm:inline">Bài trước</span>
        </button>

        <div class="flex items-center gap-2">
            <button
                @click="$emit('open-drawer')"
                class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white font-mono font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                :title="`Bấm để mở danh sách chọn ${label || 'bài'}`"
            >
                <i :class="drawerIcon || 'fa-solid fa-list-check'" class="text-xs"></i>
                <span>{{ label || "Bài" }} {{ currentIndex + 1 }} / {{ totalItems }}</span>
                <i class="fa-solid fa-caret-down text-[10px]"></i>
            </button>

            <button
                @click="$emit('random')"
                class="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition shadow-xs"
                title="Chọn ngẫu nhiên"
            >
                <i class="fa-solid fa-shuffle text-xs"></i>
            </button>
        </div>

        <button
            @click="$emit('next')"
            :disabled="currentIndex >= totalItems - 1"
            class="nav-button flex items-center gap-1.5"
            title="Bài sau (→)"
        >
            <span class="hidden sm:inline">Bài sau</span>
            <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
    </div>
</template>

<script setup>
defineProps({
    currentIndex: {
        type: Number,
        default: 0,
    },
    totalItems: {
        type: Number,
        default: 0,
    },
    label: {
        type: String,
        default: "Bài",
    },
    drawerIcon: {
        type: String,
        default: "fa-solid fa-list-check",
    },
})

defineEmits(["prev", "next", "random", "open-drawer"])
</script>
