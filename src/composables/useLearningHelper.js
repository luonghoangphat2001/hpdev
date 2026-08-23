/**
 * Helper utility functions for normalizing learning data models.
 * Clean, standard, minimalist styling.
 */

export const parseJsonObject = (value) => {
    if (value && typeof value === "object") return value
    try {
        return JSON.parse(value || "{}")
    } catch (_) {
        return {}
    }
}

export const normalizeLearningItems = (items = []) => {
    return items.map((item) => ({
        ...item,
        content: parseJsonObject(item.content),
        sample_solution: parseJsonObject(item.sample_solution),
    }))
}

export const getLevelBadgeClass = (level) => {
    const lvl = String(level || "").toLowerCase()
    if (lvl.includes("begin") || lvl.includes("fresh") || lvl === "a1" || lvl === "a2") {
        return "bg-gray-800 border-gray-700 text-emerald-400"
    }
    if (lvl.includes("junior") || lvl === "b1") {
        return "bg-gray-800 border-gray-700 text-sky-400"
    }
    if (lvl.includes("inter") || lvl === "b2") {
        return "bg-gray-800 border-gray-700 text-amber-400"
    }
    if (lvl.includes("adv") || lvl.includes("sen") || lvl === "c1" || lvl === "c2") {
        return "bg-gray-800 border-gray-700 text-indigo-300"
    }
    return "bg-gray-800 border-gray-700 text-gray-300"
}
