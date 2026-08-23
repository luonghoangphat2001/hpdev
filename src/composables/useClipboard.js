import { ref, onBeforeUnmount } from "vue"

/**
 * Composable for clipboard copy operations with reactive feedback.
 * Adheres to Single Responsibility Principle (SRP).
 */
export function useClipboard(defaultTimeout = 2000) {
    const copied = ref(false)
    let timer = null

    const copy = async (text, timeout = defaultTimeout) => {
        if (!text) return false
        try {
            await navigator.clipboard.writeText(String(text))
            copied.value = true
            clearTimeout(timer)
            timer = setTimeout(() => {
                copied.value = false
            }, timeout)
            return true
        } catch (_) {
            return false
        }
    }

    onBeforeUnmount(() => {
        clearTimeout(timer)
    })

    return {
        copied,
        copy,
    }
}
