<template>
  <aside 
    :class="[
      'bg-gray-800/95 border-r border-gray-700/80 flex flex-col h-full transition-all duration-300 z-40',
      collapsed ? 'w-16' : 'w-64',
      mobileOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0' : 'hidden md:flex'
    ]"
  >
    <!-- Brand / Header -->
    <div class="h-14 flex items-center justify-between px-3 border-b border-gray-700/80 shrink-0">
      <router-link to="/chat" class="flex items-center gap-2.5 overflow-hidden">
        <img src="/images/dan.png" alt="Đần AI" class="w-8 h-8 rounded-full ring-2 ring-indigo-500/50 shrink-0" />
        <div v-if="!collapsed" class="flex flex-col min-w-0">
          <span class="font-bold text-sm tracking-wide text-white truncate">Đần AI</span>
          <span class="text-[10px] text-indigo-400 font-mono">v2.1 (Vue 3)</span>
        </div>
      </router-link>
      <button 
        @click="toggleCollapse"
        type="button"
        class="hidden md:flex w-7 h-7 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-300 items-center justify-center text-xs transition"
        :title="collapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
      >
        {{ collapsed ? '»' : '«' }}
      </button>
    </div>

    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto py-3 px-2 space-y-1">
      <div v-if="!collapsed" class="px-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Không gian AI
      </div>
      
      <router-link 
        to="/chat" 
        class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
        :class="$route.path.startsWith('/chat') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
      >
        <span class="text-lg shrink-0">💬</span>
        <span v-if="!collapsed" class="truncate">Trò chuyện AI</span>
      </router-link>

      <!-- Learning Section -->
      <div class="pt-3">
        <div v-if="!collapsed" class="px-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Học tập & IELTS</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300">Studio</span>
        </div>
        
        <router-link 
          to="/learning/tech" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path.startsWith('/learning') ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">💻</span>
          <span v-if="!collapsed" class="truncate">Góc Học Tập</span>
        </router-link>
      </div>

      <!-- Admin Section -->
      <div v-if="authStore.isAdmin" class="pt-3">
        <div v-if="!collapsed" class="px-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Quản trị AI</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300">Admin</span>
        </div>

        <router-link 
          to="/config" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path.startsWith('/config') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">⚙️</span>
          <span v-if="!collapsed" class="truncate">Cấu hình Hệ thống</span>
        </router-link>

        <router-link 
          to="/openclaw" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path.startsWith('/openclaw') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">🕷️</span>
          <span v-if="!collapsed" class="truncate">OpenClaw Crawler</span>
        </router-link>

        <router-link 
          to="/users" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path === '/users' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">👥</span>
          <span v-if="!collapsed" class="truncate">Tài khoản Users</span>
        </router-link>

        <router-link 
          to="/history" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path === '/history' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">📜</span>
          <span v-if="!collapsed" class="truncate">Lịch sử Chat</span>
        </router-link>

        <router-link 
          to="/stats" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path === '/stats' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">📊</span>
          <span v-if="!collapsed" class="truncate">Thống kê Token</span>
        </router-link>

        <router-link 
          to="/logs" 
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition"
          :class="$route.path === '/logs' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'"
        >
          <span class="text-lg shrink-0">📋</span>
          <span v-if="!collapsed" class="truncate">Nhật ký Logs</span>
        </router-link>
      </div>
    </div>

    <!-- User Profile & Logout -->
    <div class="p-2 border-t border-gray-700/80 shrink-0">
      <div class="flex items-center gap-2.5 p-1.5 rounded-xl bg-gray-700/40">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {{ authStore.userInitial }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-white truncate">{{ authStore.username }}</p>
          <p class="text-[10px] text-gray-400 capitalize">{{ authStore.user?.role || 'user' }}</p>
        </div>
        <button 
          v-if="!collapsed"
          @click="authStore.logout"
          type="button"
          class="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          title="Đăng xuất"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const collapsed = ref(false);
const mobileOpen = ref(false);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

defineExpose({
  openMobile: () => { mobileOpen.value = true; },
  closeMobile: () => { mobileOpen.value = false; },
});
</script>
