<template>
    <header class="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700/80 backdrop-blur-md shrink-0 z-30">
        <button @click="$emit('toggle-sidebar')" type="button" class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition" aria-label="Mở menu">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <div class="flex items-center gap-2">
            <img src="/images/dan.png" alt="Đần" class="w-6 h-6 rounded-full" />
            <span class="font-bold text-gray-900 dark:text-white text-sm">Đần Learning</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-semibold">v2.0.0</span>
        </div>

        <div class="flex items-center gap-2">
            <button
                @click="toggleTheme"
                type="button"
                class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm"
                :title="isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'">
                {{ isDark ? '🌙' : '☀️' }}
            </button>
            <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {{ authStore.userInitial }}
            </div>
        </div>
    </header>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth"
import { useTheme } from "@/composables/useTheme"

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
defineEmits(["toggle-sidebar"])
</script>
