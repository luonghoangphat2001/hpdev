<template>
  <div class="w-full max-w-2xl mx-auto perspective-1000 my-4">
    <div 
      @click="flipped = !flipped"
      :class="[
        'relative w-full min-h-[320px] rounded-3xl p-6 cursor-pointer transition-all duration-500 transform-style-3d shadow-2xl border',
        flipped ? 'rotate-y-180 bg-gray-800/95 border-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-gray-800/90 border-gray-700/80 hover:border-gray-600'
      ]"
    >
      <!-- Front Side (Question) -->
      <div v-if="!flipped" class="flex flex-col h-full justify-between backface-hidden">
        <div>
          <div class="flex items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {{ question?.level || 'Junior' }}
              </span>
              <span class="text-xs text-gray-400 font-mono">#{{ index + 1 }}</span>
            </div>
            <button 
              @click.stop="$emit('bookmark', question)"
              class="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 transition"
              :class="question?.is_bookmarked ? 'text-amber-400' : ''"
              title="Bookmark"
            >
              ★
            </button>
          </div>
          <h3 class="text-lg font-bold text-white leading-relaxed">{{ question?.title || question?.question }}</h3>
          <p v-if="question?.description" class="text-sm text-gray-300 mt-2">{{ question.description }}</p>
        </div>
        <div class="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
          <span>💡 Nhấn để xem câu trả lời</span>
          <span class="text-indigo-400 font-medium">Lật thẻ ↻</span>
        </div>
      </div>

      <!-- Back Side (Answer) -->
      <div v-else class="flex flex-col h-full justify-between rotate-y-180 backface-hidden">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Câu trả lời & Giải thích</span>
            <span class="text-xs text-gray-400 font-mono">#{{ index + 1 }}</span>
          </div>
          <div class="text-sm text-gray-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap pr-2">
            {{ question?.answer || question?.explanation || 'Chưa có lời giải chi tiết.' }}
          </div>
        </div>
        <div class="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
          <span>Nhấn để quay lại câu hỏi</span>
          <span class="text-indigo-400 font-medium">Lật lại ↺</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  question: Object,
  index: Number,
});

defineEmits(['bookmark']);

const flipped = ref(false);

watch(() => props.question, () => {
  flipped.value = false;
});
</script>
