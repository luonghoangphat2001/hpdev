<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900">
    <div class="w-full max-w-md bg-gray-800/90 border border-gray-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
      <!-- Brand Logo -->
      <div class="text-center mb-8">
        <img src="/images/dan.png" alt="Đần AI" class="w-16 h-16 rounded-full mx-auto mb-3 ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20" />
        <h1 class="text-2xl font-black tracking-tight text-white">Đần AI Studio</h1>
        <p class="text-xs text-gray-400 mt-1">Hệ sinh thái AI & Không gian học tập thông minh</p>
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Tên đăng nhập</label>
          <input 
            v-model="username" 
            type="text" 
            required 
            autocomplete="username"
            placeholder="Nhập username" 
            class="w-full px-4 py-3 rounded-2xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Mật khẩu</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            autocomplete="current-password"
            placeholder="Nhập password" 
            class="w-full px-4 py-3 rounded-2xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-bold tracking-wide transition shadow-lg shadow-indigo-600/30 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
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
    error.value = err.message || 'Tài khoản hoặc mật khẩu không chính xác';
  } finally {
    loading.value = false;
  }
};
</script>
