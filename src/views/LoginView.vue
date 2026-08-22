<template>
  <div class="bg-gray-900 min-h-screen flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-sm">
      <!-- Avatar + branding -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mx-auto mb-3 sm:mb-4 ring-4 ring-indigo-500/40 shadow-xl" style="width: 64px; height: 64px; min-width: 64px; min-height: 64px;">
          <img src="/images/dan.png" alt="Đần" width="64" height="64" class="w-full h-full object-cover rounded-full" style="width: 64px; height: 64px; aspect-ratio: 1/1;" loading="eager" decoding="sync" />
        </div>
        <div class="flex items-center justify-center gap-2">
          <h1 class="text-2xl sm:text-3xl font-bold text-white">Xin chào! Tôi là Đần</h1>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 font-semibold">v2.1.0</span>
        </div>
        <p class="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-xs mx-auto">
          Một AI agent được tạo bởi <span class="text-indigo-400 font-medium">Phát</span>,
          tổng hợp nhiều model —
          <span class="text-yellow-400">Gemini</span>,
          <span class="text-purple-400">Claude</span>,
          <span class="text-green-400">GPT</span> —
          để tương tác cá nhân.
        </p>
      </div>

      <!-- Login card -->
      <div class="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700/60">
        <p class="text-gray-400 text-xs sm:text-sm text-center mb-4 sm:mb-5">Đăng nhập để tiếp tục</p>

        <!-- Error notification -->
        <div v-if="error" class="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700/60 text-red-300 text-xs font-semibold text-center">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-3.5 sm:space-y-4">
          <input 
            v-model="username" 
            type="text" 
            required 
            autofocus 
            autocomplete="username" 
            placeholder="Username" 
            class="w-full px-4 py-3 rounded-xl bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none text-base sm:text-sm" 
          />
          <input 
            v-model="password" 
            type="password" 
            required 
            autocomplete="current-password" 
            placeholder="Password" 
            class="w-full px-4 py-3 rounded-xl bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500 focus:outline-none text-base sm:text-sm" 
          />
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('admin');
const password = ref('Luonghoangphat12001@');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value || loading.value) return;
  loading.value = true;
  error.value = '';

  try {
    const user = await authStore.login(username.value, password.value);
    if (user) {
      router.push('/chat');
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Sai username hoặc password. Thử lại.';
  } finally {
    loading.value = false;
  }
};
</script>
