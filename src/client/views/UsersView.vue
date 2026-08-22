<template>
  <div class="h-full flex flex-col min-w-0">
    <header class="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">👥</span>
        <h2 class="text-sm font-bold text-white">Quản lý Tài khoản Người dùng</h2>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      <!-- Create User Card -->
      <div class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl">
        <h3 class="text-base font-bold text-white mb-4">Tạo Tài Khoản Mới</h3>
        <form @submit.prevent="handleCreateUser" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input 
            v-model="newUsername" 
            type="text" 
            placeholder="Username" 
            required 
            class="px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <input 
            v-model="newPassword" 
            type="password" 
            placeholder="Password" 
            required 
            class="px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button 
            type="submit" 
            class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30"
          >
            + Thêm người dùng
          </button>
        </form>
      </div>

      <!-- User List Table -->
      <div class="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 shadow-xl overflow-hidden">
        <h3 class="text-base font-bold text-white mb-4">Danh Sách Người Dùng</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="border-b border-gray-700 text-gray-400">
              <tr>
                <th class="pb-3 font-semibold">Username</th>
                <th class="pb-3 font-semibold">Vai trò</th>
                <th class="pb-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50 text-gray-200">
              <tr v-for="u in users" :key="u.username">
                <td class="py-3 font-mono font-medium">{{ u.username }}</td>
                <td class="py-3">
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                    :class="u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-700 text-gray-300'"
                  >
                    {{ u.role || 'user' }}
                  </span>
                </td>
                <td class="py-3 text-right">
                  <button 
                    @click="handleDelete(u.username)"
                    class="text-rose-400 hover:text-rose-300 hover:underline text-xs"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUsers, createUser, deleteUser } from '@/api/users';

const users = ref([]);
const newUsername = ref('');
const newPassword = ref('');

const loadUsers = async () => {
  try {
    const res = await getUsers();
    users.value = res?.users || [];
  } catch (_) {}
};

const handleCreateUser = async () => {
  if (!newUsername.value || !newPassword.value) return;
  try {
    await createUser({ username: newUsername.value, password: newPassword.value });
    newUsername.value = '';
    newPassword.value = '';
    await loadUsers();
  } catch (err) {
    alert(err.message);
  }
};

const handleDelete = async (username) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa user ${username}?`)) return;
  try {
    await deleteUser(username);
    await loadUsers();
  } catch (err) {
    alert(err.message);
  }
};

onMounted(() => {
  loadUsers();
});
</script>
