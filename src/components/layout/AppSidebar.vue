<template>
    <aside :class="['app-sidebar bg-gray-800 flex flex-col border-r border-gray-700 shrink-0 transition-all duration-200 z-40', collapsed ? 'w-16' : 'w-56', mobileOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex' : 'hidden md:flex']">
        <!-- Header -->
        <div class="sidebar-header px-3 py-4 border-b border-gray-700 flex items-center justify-between gap-1">
            <router-link to="/chat" class="flex items-center gap-2 overflow-hidden">
                <div class="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-500/40">
                    <img src="/images/dan.png" alt="Đần" class="w-full h-full object-cover rounded-full" />
                </div>
                <span v-if="!collapsed" class="sidebar-label font-bold text-white text-sm truncate">Đần AI</span>
            </router-link>
            <div class="flex items-center gap-1">
                <span v-if="!collapsed" class="sidebar-version text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-700/80 text-gray-400 font-semibold">v2.1.0</span>
                <button @click="toggleCollapse" type="button" class="hidden md:flex w-6 h-6 rounded-md bg-gray-700 hover:bg-indigo-600 text-gray-200 transition items-center justify-center text-xs" :title="collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
                    {{ collapsed ? "»" : "«" }}
                </button>
                <button @click="closeMobile" type="button" class="md:hidden w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-600 text-gray-200 transition flex items-center justify-center text-xs">✕</button>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overscroll-contain">
            <router-link to="/chat" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path.startsWith('/chat') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'">
                <span class="sidebar-icon">💬</span>
                <span v-if="!collapsed" class="sidebar-label">Chat</span>
            </router-link>

            <!-- Learning Menu -->
            <div>
                <button @click="learningOpen = !learningOpen" type="button" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-between gap-2.5 select-none" :class="$route.path.startsWith('/learning') || $route.path.startsWith('/tech') || $route.path.startsWith('/vocab') ? 'bg-indigo-600/30 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="sidebar-icon">🎓</span>
                        <span v-if="!collapsed" class="sidebar-label flex-1 truncate">Learning</span>
                    </div>
                    <span v-if="!collapsed" class="text-xs text-gray-400 transition-transform" :class="{ 'rotate-180': learningOpen }">⌄</span>
                </button>
                <div v-if="learningOpen && !collapsed" class="sidebar-dropdown-submenu ml-7 pl-2 border-l border-gray-700 space-y-0.5 mt-0.5">
                    <router-link to="/learning/tech" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2" :class="$route.path.includes('/tech') ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">💻</span><span class="sidebar-label">Tech</span> </router-link>
                    <router-link to="/learning/vocab" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2" :class="$route.path.includes('/vocab') ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">🇬🇧</span><span class="sidebar-label">English</span> </router-link>
                </div>
            </div>

            <!-- Admin section -->
            <div v-if="authStore.isAdmin" class="pt-3 space-y-0.5">
                <div v-if="!collapsed" class="sidebar-section-label px-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>

                <!-- Config Menu -->
                <div>
                    <button @click="configOpen = !configOpen" type="button" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-between gap-2.5 select-none" :class="$route.path.startsWith('/config') ? 'bg-indigo-600/30 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <span class="sidebar-icon">⚙️</span>
                            <span v-if="!collapsed" class="sidebar-label flex-1 truncate">Config</span>
                        </div>
                        <span v-if="!collapsed" class="text-xs text-gray-400 transition-transform" :class="{ 'rotate-180': configOpen }">⌄</span>
                    </button>
                    <div v-if="configOpen && !collapsed" class="sidebar-dropdown-submenu ml-7 pl-2 border-l border-gray-700 space-y-0.5 mt-0.5">
                        <router-link to="/config" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2" :class="$route.path === '/config' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">🤖</span><span class="sidebar-label">Models</span> </router-link>
                        <router-link to="/config?tab=providers" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 text-gray-400 hover:bg-gray-700 hover:text-white"> <span class="sidebar-icon">🔑</span><span class="sidebar-label">Providers</span> </router-link>
                        <router-link to="/config?tab=openclaw" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 text-gray-400 hover:bg-gray-700 hover:text-white"> <span class="sidebar-icon">🦅</span><span class="sidebar-label">AI Agents</span> </router-link>
                        <router-link to="/config?tab=prompts" class="nav-item w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 text-gray-400 hover:bg-gray-700 hover:text-white"> <span class="sidebar-icon">📝</span><span class="sidebar-label">Prompts</span> </router-link>
                    </div>
                </div>

                <router-link to="/history" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/history' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">📜</span><span v-if="!collapsed" class="sidebar-label">History</span> </router-link>

                <router-link to="/stats" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/stats' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">📊</span><span v-if="!collapsed" class="sidebar-label">Stats</span> </router-link>

                <router-link to="/users" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/users' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">👥</span><span v-if="!collapsed" class="sidebar-label">Users</span> </router-link>

                <router-link to="/openclaw" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/openclaw' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">🦞</span><span v-if="!collapsed" class="sidebar-label">OpenClaw</span> </router-link>

                <router-link to="/logs" class="nav-item w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === '/logs' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'"> <span class="sidebar-icon">📋</span><span v-if="!collapsed" class="sidebar-label">Logs</span> </router-link>
            </div>
        </nav>

        <!-- User Profile & Logout -->
        <div class="border-t border-gray-700 px-3 py-3 flex items-center gap-2.5 shrink-0">
            <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {{ authStore.userInitial }}
            </div>
            <div v-if="!collapsed" class="sidebar-user-details flex-1 min-w-0">
                <div class="text-sm font-medium truncate text-white">{{ authStore.username }}</div>
                <div class="text-xs text-gray-400 capitalize">{{ authStore.user?.role || "user" }}</div>
            </div>
            <button @click="authStore.logout" type="button" title="Logout" class="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-700 ml-auto">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
const collapsed = ref(false)
const mobileOpen = ref(false)
const learningOpen = ref(true)
const configOpen = ref(false)

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
