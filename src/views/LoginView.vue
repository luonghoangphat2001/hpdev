<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-gray-950">
    <div class="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
      <!-- Brand Logo -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-indigo-500/40 shadow-xl shadow-indigo-500/20">
          <img src="/images/dan.png" alt="Đần AI" class="w-full h-full object-cover rounded-full" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Đần AI Learning</h1>
        <p class="text-xs text-gray-400 mt-1">Không gian luyện Tech Stacks, Vocabulary & Quiz</p>
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
            placeholder="Username" 
            class="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Mật khẩu</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            autocomplete="current-password"
            placeholder="Password" 
            class="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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

      <!-- Quick Auto Fill Helper -->
      <div class="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
        <span>Tài khoản học viên:</span>
        <button 
          @click="autoFillAdmin" 
          type="button"
          class="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1.5"
        >
          <i class="fas fa-magic text-[10px]"></i>
          <span>Tự động điền</span>
        </button>
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

const autoFillAdmin = () => {
  username.value = 'admin';
  password.value = 'Luonghoangphat12001@';
};

const handleLogin = async () => {
  if (!username.value || !password.value || loading.value) return;
  loading.value = true;
  error.value = '';

  try {
    const user = await authStore.login(username.value, password.value);
    if (user) {
      router.push('/tech');
    }
  } catch (err) {
    error.value = err.message || 'Tài khoản hoặc mật khẩu không chính xác';
  } finally {
    loading.value = false;
  }
};
</script>
