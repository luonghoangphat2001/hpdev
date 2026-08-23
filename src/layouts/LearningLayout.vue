<template>
    <div class="learning-readable h-full min-w-0 overflow-y-auto bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-4 space-y-4">
            <!-- Global Error Banner -->
            <div v-if="error" class="p-3 rounded-xl border border-red-800/70 bg-red-950/40 text-red-300 text-xs flex items-center justify-between gap-3 shadow-md">
                <span>{{ error }}</span>
                <button class="font-bold hover:text-white transition" @click="$emit('retry')">Thử lại</button>
            </div>

            <!-- Page / Tab Content -->
            <slot />
        </div>
    </div>
</template>

<script setup>
defineProps({
    error: {
        type: String,
        default: "",
    },
})

defineEmits(["retry"])
</script>
