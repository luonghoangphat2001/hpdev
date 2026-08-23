<template>
    <aside :class="['app-sidebar bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 flex flex-col border-r border-gray-200 dark:border-gray-700 shrink-0 transition-all duration-200 z-40', collapsed ? 'w-16' : 'w-56', mobileOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex' : 'hidden md:flex']">
        <!-- Header -->
        <div class="sidebar-header px-3 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1">
            <router-link to="/chat" class="flex items-center gap-2 overflow-hidden">
                <div class="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-500/40">
                    <img src="/images/dan.png" alt="Đần" class="w-full h-full object-cover rounded-full" />
                </div>
                <span v-if="!collapsed" class="sidebar-label font-bold text-gray-900 dark:text-white text-sm truncate">Đần AI</span>
            </router-link>
            <div class="flex items-center gap-1">
                <span v-if="!collapsed" class="sidebar-version text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold">v2.0.0</span>
                <button @click="closeMobile" type="button" class="md:hidden w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-600 hover:text-white text-gray-600 dark:text-gray-200 transition flex items-center justify-center text-xs">✕</button>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overscroll-contain">
            <router-link to="/chat" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path.startsWith('/chat') ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                <i class="fa-solid fa-comments w-4 text-center text-sm"></i>
                <span v-if="!collapsed" class="sidebar-label">Chat</span>
            </router-link>

            <!-- Learning link -->
            <a href="https://learning.hpdev.name.vn/" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white">
                <i class="fa-solid fa-graduation-cap w-4 text-center text-sm"></i>
                <span v-if="!collapsed" class="sidebar-label flex-1">Learning</span>
                <i v-if="!collapsed" class="fa-solid fa-arrow-up-right-from-square text-xs text-gray-400"></i>
            </a>

            <!-- Admin section -->
            <div v-if="authStore.isAdmin" class="pt-3 space-y-0.5">
                <div v-if="!collapsed" class="sidebar-section-label px-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>

                <router-link to="/schedule" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/schedule' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-calendar-days w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">Schedule</span>
                </router-link>

                <details class="sidebar-dropdown-menu" :open="$route.path.startsWith('/config')">
                    <summary class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5 cursor-pointer select-none" :class="$route.path.startsWith('/config') ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                        <i class="fa-solid fa-gear w-4 text-center text-sm"></i>
                        <span v-if="!collapsed" class="sidebar-label flex-1">Config</span>
                        <i v-if="!collapsed" class="fa-solid fa-chevron-down text-xs text-gray-400"></i>
                    </summary>
                    <div v-if="!collapsed" class="sidebar-dropdown-submenu ml-7 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-0.5 mt-0.5">
                        <router-link v-for="item in configItems" :key="item.key" :to="`/config/${item.key}`" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2" :class="$route.params.tab === item.key || (!$route.params.tab && item.key === 'models') ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                            <i :class="item.icon" class="w-3.5 text-center text-xs"></i>
                            <span>{{ item.label }}</span>
                        </router-link>
                    </div>
                </details>

                <router-link to="/history" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/history' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-clock-rotate-left w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">History</span>
                </router-link>

                <router-link to="/stats" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/stats' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-chart-pie w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">Stats</span>
                </router-link>

                <router-link to="/users" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/users' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-users w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">Users</span>
                </router-link>

                <router-link to="/openclaw" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/openclaw' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-robot w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">OpenClaw</span>
                </router-link>

                <router-link to="/logs" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/logs' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'">
                    <i class="fa-solid fa-list-check w-4 text-center text-sm"></i>
                    <span v-if="!collapsed" class="sidebar-label">Logs</span>
                </router-link>
            </div>
        </nav>

        <!-- User Profile & Theme Toggle -->
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
                <div v-if="!collapsed" class="sidebar-user-details flex-1 min-w-0">
                    <div class="text-xs font-bold truncate text-gray-900 dark:text-white">{{ authStore.username }}</div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{{ authStore.user?.role || "user" }}</div>
                </div>
                <button
                    @click="toggleCollapse"
                    type="button"
                    class="hidden md:flex w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-600 hover:text-white text-gray-500 dark:text-gray-300 transition items-center justify-center text-xs shrink-0"
                    :title="collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
                    <i :class="collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'" class="text-[10px]"></i>
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
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { useTheme } from "@/composables/useTheme"

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const collapsed = ref(false)
const mobileOpen = ref(false)
const configItems = [
    { key: "models", icon: "fa-solid fa-robot", label: "Models" },
    { key: "providers", icon: "fa-solid fa-key", label: "Providers" },
    { key: "openclaw", icon: "fa-solid fa-brain", label: "AI Agents" },
    { key: "prompts", icon: "fa-solid fa-file-lines", label: "Prompts" },
    { key: "logs", icon: "fa-solid fa-receipt", label: "Log Config" },
]

const toggleCollapse = () => {
    collapsed.value = !collapsed.value
}

const closeMobile = () => {
    mobileOpen.value = false
}

defineExpose({
    openMobile: () => {
        mobileOpen.value = true
    },
    closeMobile,
})
</script>
