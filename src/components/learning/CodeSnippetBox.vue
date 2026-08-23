<template>
    <div v-if="code" class="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden shadow-lg">
        <div class="flex items-center justify-between px-3.5 py-2 bg-gray-900/90 border-b border-gray-800">
            <div class="flex items-center gap-2">
                <div class="flex gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <span class="ml-2 text-[10px] font-mono font-bold text-gray-400 uppercase">
                    {{ title || "Code Example" }}
                </span>
            </div>
            <button @click="clipboard.copy(code)" class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-[11px] font-mono font-semibold transition flex items-center gap-1.5" title="Sao chép code">
                <i :class="clipboard.copied.value ? 'fa-solid fa-check text-emerald-400' : 'fa-solid fa-copy'"></i>
                <span>{{ clipboard.copied.value ? "Đã sao chép!" : "Sao chép code" }}</span>
            </button>
        </div>
        <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-emerald-300 selection:bg-indigo-500 selection:text-white"><code>{{ code }}</code></pre>
    </div>
</template>

<script setup>
import { useClipboard } from "@/composables/useClipboard"

defineProps({
    code: {
        type: String,
        default: "",
    },
    title: {
        type: String,
        default: "Code Example",
    },
})

const clipboard = useClipboard()
</script>
