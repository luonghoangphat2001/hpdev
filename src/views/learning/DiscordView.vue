<template>
    <LearningLayout :error="error" @retry="loadDiscordConfig">
        <section class="max-w-2xl mx-auto space-y-4">
            <div class="studio-card p-6 space-y-5">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                            <i class="fa-brands fa-discord text-indigo-600 dark:text-indigo-400"></i>
                            <span>Cấu Hình Discord Bot</span>
                        </h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Thiết lập lịch tự động gửi từ vựng vào kênh Discord học tập.</p>
                    </div>
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono font-bold border border-emerald-200 dark:border-emerald-800"> Auto Daily </span>
                </div>

                <label class="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60">
                    <input v-model="vocabConfig.notify_vocab_enabled" type="checkbox" class="accent-indigo-600 w-4 h-4 rounded" />
                    <span class="font-semibold text-gray-900 dark:text-white">Bật gửi Từ vựng tự động qua Discord</span>
                </label>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label class="space-y-1.5">
                        <span class="crud-label">Giờ gửi mỗi ngày</span>
                        <input v-model="vocabConfig.vocab_daily_time" type="time" class="input-control" />
                    </label>
                    <label class="space-y-1.5">
                        <span class="crud-label">Số từ mỗi ngày</span>
                        <input v-model.number="vocabConfig.vocab_words_per_day" type="number" min="1" max="20" class="input-control" />
                    </label>
                </div>

                <label class="space-y-1.5 block">
                    <span class="crud-label">Discord Channel ID</span>
                    <input v-model.trim="vocabConfig.vocab_discord_channel_id" placeholder="Nhập ID kênh Discord..." class="input-control font-mono" />
                </label>

                <div class="pt-2 flex justify-end">
                    <button @click="saveConfig" class="primary-button px-6 py-2.5 text-xs font-semibold flex items-center gap-2">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>Lưu cấu hình</span>
                    </button>
                </div>
            </div>
        </section>
    </LearningLayout>
</template>

<script setup>
import { onMounted, ref } from "vue"
import LearningLayout from "@/layouts/LearningLayout.vue"
import { getLearningConfig, saveLearningConfig } from "@/api/learning"

const error = ref("")
const vocabConfig = ref({
    notify_vocab_enabled: true,
    vocab_daily_time: "08:00",
    vocab_words_per_day: 5,
    vocab_discord_channel_id: "",
})

const loadDiscordConfig = async () => {
    error.value = ""
    try {
        const config = await getLearningConfig()
        const c = config.config || config || {}
        vocabConfig.value = {
            notify_vocab_enabled: c.notify_vocab_enabled !== false,
            vocab_daily_time: c.vocab_daily_time || c.daily_time || "08:00",
            vocab_words_per_day: Number(c.vocab_words_per_day || c.words_per_day || 5),
            vocab_discord_channel_id: c.vocab_discord_channel_id || c.discord_channel_id || "",
        }
    } catch (err) {
        error.value = err?.message || "Không thể tải cấu hình Discord."
    }
}

const saveConfig = async () => {
    try {
        await saveLearningConfig(vocabConfig.value)
        window.alert("Đã lưu cấu hình thông báo Discord thành công!")
    } catch (err) {
        error.value = err?.message || "Không thể lưu cấu hình."
    }
}

onMounted(() => {
    loadDiscordConfig()
})
</script>
