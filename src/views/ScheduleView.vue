<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold">📅 Study Schedule</h1>
          <p class="text-sm text-gray-500 mt-1">Quản lý lịch nhắc Discord và Telegram.</p>
        </div>
        <button @click="load" class="text-sm text-indigo-400 hover:text-indigo-300">↻ Refresh</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form @submit.prevent="save" class="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 class="font-semibold text-gray-300">{{ editingId ? `Sửa lịch #${editingId}` : 'Thêm lịch học' }}</h2>
          <label class="block"><span class="field-label">User ID</span><input v-model.trim="form.user_id" required class="field" /></label>
          <label class="block"><span class="field-label">Username</span><input v-model.trim="form.username" class="field" /></label>
          <div class="grid grid-cols-2 gap-3">
            <label><span class="field-label">Platform</span><select v-model="form.platform" class="field"><option>discord</option><option>telegram</option></select></label>
            <label><span class="field-label">Repeat</span><select v-model="form.repeat_type" class="field"><option value="none">none</option><option value="daily">daily</option><option value="weekly">weekly</option></select></label>
          </div>
          <label class="block"><span class="field-label">Channel ID</span><input v-model.trim="form.channel_id" class="field" /></label>
          <label class="block"><span class="field-label">Tiêu đề</span><input v-model.trim="form.title" required class="field" /></label>
          <label class="block"><span class="field-label">Timeline</span><input v-model="form.remind_at" type="datetime-local" required class="field" /></label>
          <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.is_active" type="checkbox" class="accent-indigo-500" /> Active</label>
          <div class="flex gap-3">
            <button :disabled="saving" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm font-semibold">{{ editingId ? 'Update' : 'Add' }}</button>
            <button type="button" @click="clear" class="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Clear</button>
          </div>
          <p v-if="message" :class="ok ? 'text-green-400' : 'text-red-400'" class="text-sm">{{ message }}</p>
        </form>

        <section class="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 class="font-semibold text-gray-300">Danh sách lịch học</h2>
            <label class="text-xs text-gray-400 flex items-center gap-2"><input v-model="includeInactive" @change="load" type="checkbox" class="accent-indigo-500" /> Hiện inactive</label>
          </div>
          <div v-if="loading" class="p-6 text-sm text-gray-400">Đang tải…</div>
          <div v-else-if="!schedules.length" class="p-6 text-sm text-gray-400">Chưa có lịch nào.</div>
          <div v-else class="divide-y divide-gray-700">
            <article v-for="row in schedules" :key="row.id" class="px-4 py-3 flex items-center gap-3 hover:bg-gray-750">
              <div class="w-12 text-xs text-gray-500">#{{ row.id }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-200 truncate">{{ row.title }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ row.remind_at }} · {{ row.repeat_type }} · {{ row.platform }} · <span :class="Number(row.is_active) === 1 ? 'text-green-400' : 'text-gray-500'">{{ Number(row.is_active) === 1 ? 'active' : 'inactive' }}</span></div>
                <div class="text-xs text-gray-600 mt-1">user: {{ row.username || row.user_id }} · channel: {{ row.channel_id || 'default' }}</div>
              </div>
              <button @click="edit(row)" class="text-xs text-indigo-400 hover:text-indigo-300">Sửa</button>
              <button @click="remove(row.id)" class="text-xs text-red-400 hover:text-red-300">Xóa</button>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from '@/api/schedule';

const emptyForm = () => ({ user_id: '', username: '', platform: 'discord', channel_id: '', title: '', remind_at: '', repeat_type: 'none', is_active: true });
const schedules = ref([]);
const form = reactive(emptyForm());
const editingId = ref(null);
const includeInactive = ref(false);
const loading = ref(false);
const saving = ref(false);
const message = ref('');
const ok = ref(false);

const load = async () => {
  loading.value = true;
  try { schedules.value = (await getSchedules(includeInactive.value))?.schedules || []; }
  catch (error) { message.value = error.message; ok.value = false; }
  finally { loading.value = false; }
};
const payload = () => ({ ...form, remind_at: `${form.remind_at.replace('T', ' ')}:00`, is_active: form.is_active ? 1 : 0 });
const save = async () => {
  saving.value = true;
  try {
    const result = editingId.value ? await updateSchedule(editingId.value, payload()) : await createSchedule(payload());
    if (!result?.ok) throw new Error(result?.error || 'Không lưu được lịch.');
    message.value = '✓ Đã lưu lịch.'; ok.value = true; clear(); await load();
  } catch (error) { message.value = error.message; ok.value = false; }
  finally { saving.value = false; }
};
const edit = (row) => {
  editingId.value = row.id;
  Object.assign(form, { user_id: row.user_id || '', username: row.username || '', platform: row.platform || 'discord', channel_id: row.channel_id || '', title: row.title || '', remind_at: String(row.remind_at || '').replace(' ', 'T').slice(0, 16), repeat_type: row.repeat_type || 'none', is_active: Number(row.is_active) === 1 });
};
const clear = () => { editingId.value = null; Object.assign(form, emptyForm()); };
const remove = async (id) => { if (confirm(`Xóa lịch #${id}?`)) { await deleteSchedule(id); await load(); } };
onMounted(load);
</script>

<style scoped>
.field-label { @apply block text-xs text-gray-400 mb-1; }
.field { @apply w-full px-3 py-2.5 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm; }
</style>
