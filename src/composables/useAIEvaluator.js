import { ref } from "vue"
import { evaluateLearningAI } from "@/api/learning"

/**
 * AI Evaluation Strategy Composable applying Open/Closed & Single Responsibility principles.
 */
export function useAIEvaluator(type) {
    const isEvaluating = ref(false)
    const feedback = ref(null)
    const evalError = ref("")

    const evaluate = async (itemId, submission) => {
        if (!submission || !String(submission).trim()) {
            evalError.value = "Vui lòng nhập hoặc nói câu trả lời trước khi gửi đánh giá."
            return null
        }

        if (!itemId) {
            evalError.value = "Không tìm thấy thông tin đề bài."
            return null
        }

        isEvaluating.value = true
        evalError.value = ""
        try {
            const res = await evaluateLearningAI({
                itemId,
                type,
                submission: String(submission).trim(),
            })
            feedback.value = res.feedback || res
            return feedback.value
        } catch (err) {
            evalError.value = err?.message || "Lỗi khi gọi AI chấm bài."
            throw err
        } finally {
            isEvaluating.value = false
        }
    }

    const resetEvaluation = () => {
        feedback.value = null
        evalError.value = ""
        isEvaluating.value = false
    }

    return {
        isEvaluating,
        feedback,
        evalError,
        evaluate,
        resetEvaluation,
    }
}
