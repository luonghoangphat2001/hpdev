import { ref } from "vue"

const currentTheme = ref(localStorage.getItem("dan_theme") || "dark")

export function useTheme() {
    const isDark = ref(currentTheme.value === "dark")

    const applyTheme = (theme) => {
        currentTheme.value = theme
        isDark.value = theme === "dark"
        localStorage.setItem("dan_theme", theme)
        if (theme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
        } else {
            document.documentElement.classList.remove("dark")
            document.documentElement.classList.add("light")
        }
    }

    const toggleTheme = () => {
        const next = currentTheme.value === "dark" ? "light" : "dark"
        applyTheme(next)
    }

    const initTheme = () => {
        const saved = localStorage.getItem("dan_theme") || "dark"
        applyTheme(saved)
    }

    return {
        theme: currentTheme,
        isDark,
        toggleTheme,
        initTheme,
    }
}
