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
    if (lvl.includes("student")) {
        return "bg-purple-900/60 border-purple-600 text-purple-300"
    }
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

/**
 * Extracts multiple choice options from a question item.
 * Supports array in content.options or text parsing from prompt/title.
 */
export const getQuestionOptions = (question) => {
    if (!question) return []
    const content = parseJsonObject(question.content)
    let rawOptions = []

    if (Array.isArray(content.options) && content.options.length) {
        rawOptions = content.options
    } else {
        const fullText = `${question.prompt || ""}\n${question.title || ""}`
        const matches = fullText.match(/[A-D]\.\s*[^A-D\n\r]+/g)
        if (matches && matches.length >= 2) {
            rawOptions = matches
        }
    }

    return rawOptions
        .map((opt) => String(opt || "").split("\n")[0].trim())
        .filter(Boolean)
}

/**
 * Resolves the correct option string for a question against its options list.
 */
export const getCorrectOption = (question, options = []) => {
    if (!question) return ""
    const content = parseJsonObject(question.content)
    const sample = parseJsonObject(question.sample_solution)
    const rawTarget = String(
        content.correct_answer ||
        sample.reference_answer ||
        content.quick_answer ||
        ""
    ).trim()

    if (!options || !options.length) return rawTarget

    // 1. Direct equality check
    const exact = options.find((opt) => opt.trim().toLowerCase() === rawTarget.toLowerCase())
    if (exact) return exact

    // 2. Extract leading letter A, B, C, D
    const letterMatch = rawTarget.match(/^([A-D])(\.|\b)/i)
    if (letterMatch) {
        const letter = letterMatch[1].toUpperCase()
        const byLetter = options.find((opt, idx) => {
            const optLetter = opt.match(/^([A-D])\./i)?.[1]?.toUpperCase() || String.fromCharCode(65 + idx)
            return optLetter === letter
        })
        if (byLetter) return byLetter
    }

    // 3. Substring match
    for (const opt of options) {
        const cleanOpt = opt.replace(/^[A-D]\.\s*/i, "").trim().toLowerCase()
        if (cleanOpt.length > 2 && rawTarget.toLowerCase().includes(cleanOpt)) {
            return opt
        }
    }

    return options[0] || rawTarget
}

