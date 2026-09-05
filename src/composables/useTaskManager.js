import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue"
import { normalizeLearningItems } from "@/composables/useLearningHelper"

/**
 * Reusable Task/Question Controller Composable.
 * Encapsulates State Machine, Filtering, Pagination, Drawer Selection & Keyboard Shortcuts.
 * Adheres to Single Responsibility & Open/Closed Principles.
 */
export function useTaskManager(options = {}) {
    const {
        fetchFn = null,
        initialParams = {},
        enableKeyboardNav = true,
        onIndexChange = null,
        searchFields = ["title", "prompt", "question"],
    } = options

    const items = ref([])
    const currentIndex = ref(0)
    const loading = ref(false)
    const error = ref("")
    const searchQuery = ref("")
    const filterLevel = ref("")
    const filterCategory = ref("")

    const drawerOpen = ref(false)
    const drawerSearch = ref("")

    // Filter items based on active criteria
    const filteredItems = computed(() => {
        return items.value.filter((item) => {
            const matchLevel = !filterLevel.value || String(item.level || "").toLowerCase() === filterLevel.value.toLowerCase()
            const matchCategory = !filterCategory.value || String(item.category || "").toLowerCase() === filterCategory.value.toLowerCase()

            if (!matchLevel || !matchCategory) return false
            if (!searchQuery.value.trim()) return true

            const q = searchQuery.value.trim().toLowerCase()
            return searchFields.some((field) => {
                const val = item[field] || item.content?.[field]
                return String(val || "").toLowerCase().includes(q)
            })
        })
    })

    // Active current item
    const activeItem = computed(() => filteredItems.value[currentIndex.value] || null)

    // Items list for drawer search
    const filteredDrawerItems = computed(() => {
        if (!drawerSearch.value.trim()) return filteredItems.value
        const q = drawerSearch.value.trim().toLowerCase()
        return filteredItems.value.filter((item) => {
            return searchFields.some((field) => {
                const val = item[field] || item.content?.[field]
                return String(val || "").toLowerCase().includes(q)
            })
        })
    })

    // Load data from API
    const loadTasks = async (customParams = {}) => {
        if (!fetchFn) return
        loading.value = true
        error.value = ""
        try {
            const params = { ...initialParams, ...customParams }
            const res = await fetchFn(params)
            const rawItems = res.items || res.questions || (Array.isArray(res) ? res : [])
            items.value = normalizeLearningItems(rawItems)
            currentIndex.value = 0
            if (onIndexChange) onIndexChange(activeItem.value, currentIndex.value)
        } catch (err) {
            error.value = err?.message || "Không thể tải dữ liệu."
        } finally {
            loading.value = false
        }
    }

    // Step navigation
    const moveIndex = (offset) => {
        if (!filteredItems.value.length) return
        const maxIdx = filteredItems.value.length - 1
        const newIdx = Math.max(0, Math.min(maxIdx, currentIndex.value + offset))
        if (newIdx !== currentIndex.value) {
            currentIndex.value = newIdx
            if (onIndexChange) onIndexChange(activeItem.value, newIdx)
        }
    }

    // Jump to random item
    const randomItem = () => {
        if (filteredItems.value.length <= 1) return
        let nextIdx
        do {
            nextIdx = Math.floor(Math.random() * filteredItems.value.length)
        } while (nextIdx === currentIndex.value)
        currentIndex.value = nextIdx
        if (onIndexChange) onIndexChange(activeItem.value, nextIdx)
    }

    // Drawer selection
    const selectDrawerItem = (item) => {
        const idx = filteredItems.value.findIndex((t) => t.id === item.id)
        if (idx !== -1) {
            currentIndex.value = idx
            if (onIndexChange) onIndexChange(activeItem.value, idx)
        }
        drawerOpen.value = false
    }

    // Keyboard listener for Left/Right arrows
    const handleKeydown = (event) => {
        if (!enableKeyboardNav) return
        const target = event.target
        const tagName = target?.tagName?.toLowerCase()
        if (target?.isContentEditable || ["input", "textarea", "select"].includes(tagName)) return

        if (event.key === "ArrowLeft") {
            event.preventDefault()
            moveIndex(-1)
        } else if (event.key === "ArrowRight") {
            event.preventDefault()
            moveIndex(1)
        }
    }

    watch([filterLevel, filterCategory], () => {
        currentIndex.value = 0
        if (onIndexChange) onIndexChange(activeItem.value, 0)
    })

    onMounted(() => {
        if (enableKeyboardNav) {
            document.addEventListener("keydown", handleKeydown)
        }
    })

    onBeforeUnmount(() => {
        if (enableKeyboardNav) {
            document.removeEventListener("keydown", handleKeydown)
        }
    })

    return {
        items,
        currentIndex,
        loading,
        error,
        searchQuery,
        filterLevel,
        filterCategory,
        drawerOpen,
        drawerSearch,
        filteredItems,
        activeItem,
        filteredDrawerItems,
        loadTasks,
        moveIndex,
        randomItem,
        selectDrawerItem,
    }
}
