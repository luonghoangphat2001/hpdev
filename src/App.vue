<template>
    <div class="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
        <!-- Sidebar -->
        <AppSidebar v-if="authStore.isAuthenticated" ref="sidebarRef" />

        <!-- Mobile Backdrop -->
        <div v-if="mobileSidebarOpen" @click="closeMobileSidebar" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"></div>

        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            <!-- Mobile Top Bar -->
            <MobileHeader v-if="authStore.isAuthenticated" @toggle-sidebar="toggleMobileSidebar" />

            <!-- Router View for Pages -->
            <div class="flex-1 overflow-y-auto min-w-0">
                <router-view />
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useAuthStore } from "./stores/auth"
import AppSidebar from "./components/layout/AppSidebar.vue"
import MobileHeader from "./components/layout/MobileHeader.vue"

const authStore = useAuthStore()
const sidebarRef = ref(null)
const mobileSidebarOpen = ref(false)

const toggleMobileSidebar = () => {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    if (mobileSidebarOpen.value) {
        sidebarRef.value?.openMobile()
    } else {
        sidebarRef.value?.closeMobile()
    }
}

const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
    sidebarRef.value?.closeMobile()
}

onMounted(() => {
    authStore.fetchUser()
})
</script>
