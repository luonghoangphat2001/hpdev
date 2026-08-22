export const PROVIDER_ORDER = ['claude', 'chatgpt', 'gemini', 'deepseek', 'vllm', 'kimi', 'ollama', 'nvidia', 'cloudflare'];

export const PROVIDER_META = {
  claude:   { icon: '✳️', label: 'Claude', display: 'Claude Sonnet' },
  chatgpt:  { icon: '🤖', label: 'ChatGPT', display: 'ChatGPT' },
  gemini:   { icon: '🌟', label: 'Gemini', display: 'Gemini 2.5 Flash' },
  deepseek: { icon: '🌊', label: 'DeepSeek', display: 'DeepSeek' },
  vllm:     { icon: '⚡', label: 'vLLM', display: 'vLLM' },
  kimi:     { icon: '🧠', label: 'Kimi', display: 'Kimi' },
  ollama:   { icon: '🦙', label: 'Ollama', display: 'Ollama' },
  nvidia:   { icon: '🟢', label: 'NVIDIA', display: 'NVIDIA NIM' },
  cloudflare: { icon: '☁️', label: 'Cloudflare', display: 'Cloudflare AI' },
};

export function getProviderMeta(key) {
  return PROVIDER_META[key] || { icon: '🤖', label: key, display: key };
}
