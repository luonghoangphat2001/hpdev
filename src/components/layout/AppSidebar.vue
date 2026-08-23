<template>
    <aside :class="['app-sidebar bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 flex flex-col border-r border-gray-200 dark:border-gray-700 shrink-0 transition-all duration-200 z-40', collapsed ? 'w-16' : 'w-60', mobileOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex' : 'hidden md:flex']">
        <!-- Sidebar Brand Header -->
        <div class="px-3.5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1">
            <router-link to="/tech" class="flex items-center gap-2.5 overflow-hidden" @click="closeMobile">
                <img src="/images/dan.png" alt="Đần Learning" class="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0" />
                <div v-if="!collapsed" class="min-w-0">
                    <div class="font-bold text-gray-900 dark:text-white text-sm truncate">Đần Learning</div>
                    <div class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">v2.0.0</div>
                </div>
            </router-link>

            <div class="flex items-center gap-1">
                <button @click="closeMobile" type="button" class="md:hidden w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-600 hover:text-white text-gray-600 dark:text-gray-200 transition flex items-center justify-center text-xs">✕</button>
            </div>
        </div>

        <!-- Sidebar Navigation List -->
        <nav class="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overscroll-contain">
            <!-- 1. Tech Menu with Submenu -->
            <div class="space-y-1">
                <div class="w-full rounded-xl text-sm transition flex items-center" :class="[isTechActive ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white font-medium']">
                    <router-link to="/tech" class="min-w-0 flex-1 h-10 flex items-center gap-2.5" :class="collapsed ? 'px-3 justify-center' : 'pl-3'" :title="collapsed ? 'Tech' : undefined" @click="closeMobile">
                        <i class="fa-solid fa-laptop-code w-5 text-center text-sm shrink-0"></i>
                        <span v-if="!collapsed" class="truncate text-sm">Tech</span>
                    </router-link>
                    <button v-if="!collapsed" type="button" class="w-9 h-10 self-stretch shrink-0 grid place-items-center rounded-r-xl hover:bg-black/10 dark:hover:bg-black/20 transition" :title="techOpen ? 'Đóng menu con' : 'Mở menu con'" @click="techOpen = !techOpen">
                        <svg class="w-4 h-4 block transition-transform duration-200" :class="techOpen ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m5 7.5 5 5 5-5" />
                        </svg>
                    </button>
                </div>

                <!-- Tech Submenu -->
                <div v-if="techOpen && !collapsed" class="space-y-1 ml-3 pl-2.5 border-l border-gray-200 dark:border-gray-700/80 my-1">
                    <router-link v-for="stack in techStacks" :key="stack.slug" :to="`/tech/${stack.slug}`" class="w-full h-8 rounded-lg text-xs font-medium transition flex items-center gap-2 px-2.5" :class="[isTechStackActive(stack.slug) ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500/40 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white']" @click="closeMobile">
                        <span class="w-4 h-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                            <span v-if="normalizeTechSlug(stack.slug) === 'nextjs'" class="w-3.5 h-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-[9px] font-black leading-3 text-center">N</span>
                            <i v-else :class="[techIconClass(stack.slug), techIconColor(stack.slug), 'text-sm']"></i>
                        </span>
                        <span class="truncate flex-1 text-xs">{{ stack.name }}</span>
                        <span class="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0">{{ stack.active_item_count || 0 }}</span>
                    </router-link>
                </div>
            </div>

            <!-- 2. English Parent Menu with Submenu -->
            <div class="space-y-1 pt-0.5">
                <div class="w-full rounded-xl text-sm transition flex items-center" :class="[isEnglishActive ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white font-medium']">
                    <router-link to="/vocab" class="min-w-0 flex-1 h-10 flex items-center gap-2.5" :class="collapsed ? 'px-3 justify-center' : 'pl-3'" :title="collapsed ? 'English' : undefined" @click="closeMobile">
                        <i class="fa-solid fa-language w-5 text-center text-sm shrink-0"></i>
                        <span v-if="!collapsed" class="truncate text-sm font-semibold">English</span>
                    </router-link>
                    <button v-if="!collapsed" type="button" class="w-9 h-10 self-stretch shrink-0 grid place-items-center rounded-r-xl hover:bg-black/10 dark:hover:bg-black/20 transition" :title="englishOpen ? 'Đóng menu con' : 'Mở menu con'" @click="englishOpen = !englishOpen">
                        <svg class="w-4 h-4 block transition-transform duration-200" :class="englishOpen ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m5 7.5 5 5 5-5" />
                        </svg>
                    </button>
                </div>

                <!-- English Submenu items -->
                <div v-if="englishOpen && !collapsed" class="space-y-1 ml-3 pl-2.5 border-l border-gray-200 dark:border-gray-700/80 my-1">
                    <router-link
                        v-for="sub in englishSubItems"
                        :key="sub.to"
                        :to="sub.to"
                        class="w-full h-8 rounded-lg text-xs font-medium transition flex items-center gap-2 px-2.5"
                        :class="[isEnglishSubActive(sub.to) ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500/40 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white']"
                        @click="closeMobile"
                    >
                        <i :class="sub.icon" class="w-4 text-center text-xs shrink-0"></i>
                        <span class="truncate flex-1 text-xs">{{ sub.label }}</span>
                    </router-link>
                </div>
            </div>

            <!-- 3. Discord Bot Item -->
            <div class="pt-0.5">
                <router-link to="/discord" class="w-full h-10 rounded-xl text-sm transition flex items-center gap-2.5" :class="[collapsed ? 'px-3 justify-center' : 'px-3', isActive('/discord') ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white font-medium']" :title="collapsed ? 'Discord Bot' : undefined" @click="closeMobile">
                    <i class="fa-brands fa-discord w-5 text-center text-sm shrink-0"></i>
                    <span v-if="!collapsed" class="truncate text-sm">Discord Bot</span>
                </router-link>
            </div>
        </nav>

        <!-- Theme & User Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 space-y-2 shrink-0">
            <!-- Theme Toggle Button -->
            <button
                @click="toggleTheme"
                type="button"
                class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition"
                :class="collapsed ? 'justify-center' : ''"
                :title="isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'">
                <i :class="isDark ? 'fa-solid fa-moon text-indigo-400' : 'fa-solid fa-sun text-amber-500'" class="text-sm"></i>
                <span v-if="!collapsed" class="truncate">{{ isDark ? 'Giao diện Tối' : 'Giao diện Sáng' }}</span>
            </button>

            <!-- User Info Bar -->
            <div class="flex items-center gap-2.5 pt-1">
                <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {{ authStore.userInitial }}
                </div>
                <div v-if="!collapsed" class="flex-1 min-w-0">
                    <div class="text-xs font-bold truncate text-gray-900 dark:text-white">{{ authStore.username }}</div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{{ authStore.user?.role || "user" }}</div>
                </div>
                <button
                    @click="toggleCollapse"
                    type="button"
                    class="hidden md:flex w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-600 hover:text-white text-gray-500 dark:text-gray-300 transition items-center justify-center text-xs shrink-0"
                    :title="collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
                    {{ collapsed ? "»" : "«" }}
                </button>
                <button
                    v-if="!collapsed"
                    @click="authStore.logout"
                    type="button"
                    title="Đăng xuất"
                    class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-white transition p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </div>
    </aside>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useLearningStore } from "@/stores/learning"
import { useTheme } from "@/composables/useTheme"

const emit = defineEmits(["close-mobile"])
const authStore = useAuthStore()
const learningStore = useLearningStore()
const { isDark, toggleTheme } = useTheme()

const route = useRoute()
const collapsed = ref(false)
const mobileOpen = ref(false)

const isEnglishRoute = (path) => ["/english", "/vocab", "/quiz", "/reading", "/writing", "/speaking", "/ielts", "/exam"].some((p) => path.startsWith(p))

const techOpen = ref(route.path.startsWith("/tech"))
const englishOpen = ref(isEnglishRoute(route.path))

const isTechActive = computed(() => route.path.startsWith("/tech"))
const isEnglishActive = computed(() => isEnglishRoute(route.path))
const isActive = (path) => route.path === path

const englishSubItems = [
    { to: "/vocab", icon: "fa-solid fa-book-open", label: "Vocabulary / Flashcard" },
    { to: "/quiz", icon: "fa-solid fa-puzzle-piece", label: "Quiz & Practice" },
    { to: "/reading", icon: "fa-solid fa-book-open-reader", label: "Reading Comprehension" },
    { to: "/writing", icon: "fa-solid fa-pen-fancy", label: "Writing Studio" },
    { to: "/speaking", icon: "fa-solid fa-microphone-lines", label: "Speaking Coach" },
    { to: "/ielts", icon: "fa-solid fa-graduation-cap", label: "IELTS Prep" },
    { to: "/exam", icon: "fa-solid fa-file-signature", label: "Thi thử (50 câu)" },
]

const isEnglishSubActive = (path) => {
    if (path === "/quiz") return route.path.startsWith("/quiz")
    return route.path === path
}

const fallbackTechStacks = [
    { slug: "php", name: "PHP", active_item_count: 200 },
    { slug: "nextjs", name: "Next.js", active_item_count: 200 },
    { slug: "python", name: "Python", active_item_count: 200 },
    { slug: "reactjs", name: "React.js", active_item_count: 200 },
    { slug: "javascript", name: "JavaScript", active_item_count: 200 },
    { slug: "nodejs", name: "Node.js", active_item_count: 200 },
]

const techStacks = computed(() => (learningStore.techStacks.length ? learningStore.techStacks : fallbackTechStacks))

const normalizeTechSlug = (slug) =>
    String(slug || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "")

const techIconClass = (slug) =>
    ({
        php: "fa-brands fa-php",
        python: "fa-brands fa-python",
        react: "fa-brands fa-react",
        reactjs: "fa-brands fa-react",
        javascript: "fa-brands fa-js",
        js: "fa-brands fa-js",
        node: "fa-brands fa-node-js",
        nodejs: "fa-brands fa-node-js",
    })[normalizeTechSlug(slug)] || "fa-solid fa-code"

const techIconColor = (slug) =>
    ({
        php: "text-indigo-600 dark:text-indigo-300",
        python: "text-sky-600 dark:text-sky-400",
        react: "text-cyan-600 dark:text-cyan-400",
        reactjs: "text-cyan-600 dark:text-cyan-400",
        javascript: "text-amber-600 dark:text-yellow-400",
        js: "text-amber-600 dark:text-yellow-400",
        node: "text-emerald-600 dark:text-green-400",
        nodejs: "text-emerald-600 dark:text-green-400",
    })[normalizeTechSlug(slug)] || "text-gray-600 dark:text-gray-300"

const isTechStackActive = (slug) => route.path.startsWith("/tech") && String(route.params.stack || learningStore.activeTechSlug || "php") === slug

onMounted(() => {
    if (!learningStore.techStacks.length) learningStore.loadTechStacks()
})

watch(
    () => route.path,
    (path) => {
        if (path.startsWith("/tech")) techOpen.value = true
        if (isEnglishRoute(path)) englishOpen.value = true
    },
)

const toggleCollapse = () => {
    collapsed.value = !collapsed.value
}

const closeMobile = () => {
    if (!mobileOpen.value) return
    mobileOpen.value = false
    emit("close-mobile")
}

defineExpose({
    openMobile: () => {
        mobileOpen.value = true
    },
    closeMobile,
})
</script>
