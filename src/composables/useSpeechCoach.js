import { ref, onBeforeUnmount } from "vue"

/**
 * Speech Recognition composable applying Interface Segregation.
 * Manages audio recording and speech-to-text conversion.
 */
export function useSpeechCoach(onTranscript) {
    const isRecording = ref(false)
    const speechError = ref("")
    let recognition = null

    const toggleSpeech = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            speechError.value = "Trình duyệt chưa hỗ trợ Web Speech API; bạn vẫn có thể nhập câu trả lời."
            return
        }

        if (isRecording.value) {
            recognition?.stop()
            return
        }

        recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = false

        recognition.onstart = () => {
            isRecording.value = true
            speechError.value = ""
        }

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript
                    if (onTranscript) {
                        onTranscript(text)
                    }
                }
            }
        }

        recognition.onend = () => {
            isRecording.value = false
        }

        recognition.onerror = () => {
            isRecording.value = false
            speechError.value = "Không thể dùng micro lúc này."
        }

        recognition.start()
    }

    onBeforeUnmount(() => {
        recognition?.stop()
    })

    return {
        isRecording,
        speechError,
        toggleSpeech,
    }
}
