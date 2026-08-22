<template>
  <header class="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-gray-800/95 border-b border-gray-700/80 backdrop-blur-md shrink-0 z-30">
    <button 
      @click="$emit('toggle-sidebar')"
      type="button" 
      class="w-9 h-9 rounded-lg bg-gray-700/80 hover:bg-gray-700 text-gray-200 flex items-center justify-center transition active:scale-95"
      aria-label="Mở menu"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <div class="flex items-center gap-2">
      <img src="/images/dan.png" alt="Đần" class="w-6 h-6 rounded-full" />
      <span class="font-bold text-white text-sm">Đần AI</span>
      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-700/80 text-indigo-300 font-semibold">Vue 3</span>
    </div>

    <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
      {{ authStore.userInitial }}
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
defineEmits(['toggle-sidebar']);
</script>
