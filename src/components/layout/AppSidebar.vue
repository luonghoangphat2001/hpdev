<template>
    <aside :class="['app-sidebar bg-gray-800 flex flex-col border-r border-gray-700 shrink-0 transition-all duration-200 z-40', collapsed ? 'w-16' : 'w-60', mobileOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex' : 'hidden md:flex']">
        <div class="px-3 py-4 border-b border-gray-700 flex items-center justify-between gap-1">
            <router-link to="/tech" class="flex items-center gap-2 overflow-hidden">
                <img src="/images/dan.png" alt="Đần Learning" class="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0" />
                <div v-if="!collapsed" class="min-w-0">
                    <div class="font-bold text-white text-sm truncate">Đần Learning</div>
                    <div class="text-[10px] font-mono text-indigo-300">v2.0.0</div>
                </div>
            </router-link>

            <div class="flex items-center gap-1">
                <button @click="toggleCollapse" type="button" class="hidden md:flex w-6 h-6 rounded-md bg-gray-700 hover:bg-indigo-600 text-gray-200 transition items-center justify-center text-xs" :title="collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
                    {{ collapsed ? "»" : "«" }}
                </button>
                <button @click="closeMobile" type="button" class="md:hidden w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-600 text-gray-200 transition flex items-center justify-center text-xs">✕</button>
            </div>
        </div>

        <nav class="flex-1 px-2 py-3 space-y-1 overflow-y-auto overscroll-contain">
            <div v-if="!collapsed" class="px-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Learning</div>

            <router-link v-for="item in learningMenu" :key="item.to" :to="item.to" class="nav-item w-full px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2.5" :class="$route.path === item.to ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-300 hover:bg-gray-700 hover:text-white'">
                <span class="sidebar-icon text-base">{{ item.icon }}</span>
                <span v-if="!collapsed" class="sidebar-label truncate">{{ item.label }}</span>
            </router-link>
        </nav>

        <div class="border-t border-gray-700 px-3 py-3 flex items-center gap-2.5 shrink-0">
            <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {{ authStore.userInitial }}
            </div>
            <div v-if="!collapsed" class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate text-white">{{ authStore.username }}</div>
                <div class="text-xs text-gray-400 capitalize">{{ authStore.user?.role || "user" }}</div>
            </div>
            <button v-if="!collapsed" @click="authStore.logout" type="button" title="Đăng xuất" class="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-700">⇥</button>
        </div>
    </aside>
</template>

<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
const collapsed = ref(false)
const mobileOpen = ref(false)

const learningMenu = [
    { to: "/tech", icon: "💻", label: "Lập trình & Tech" },
    { to: "/vocab", icon: "📖", label: "Từ vựng IELTS" },
    { to: "/quiz", icon: "⚡", label: "Trắc nghiệm Quiz" },
    { to: "/writing", icon: "✍️", label: "Writing Studio" },
    { to: "/speaking", icon: "🎙️", label: "Speaking Coach" },
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
