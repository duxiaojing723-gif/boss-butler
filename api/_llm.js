// 共享 LLM 调用：主力千问 → 失败自动切 DeepSeek
export async function chatCompletion(messages, options = {}) {
  const providers = [
    {
      name: 'qwen',
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL,
    },
    {
      name: 'deepseek',
      baseURL: process.env.LLM_FALLBACK_BASE_URL,
      apiKey: process.env.LLM_FALLBACK_API_KEY,
      model: process.env.LLM_FALLBACK_MODEL,
    },
  ]

  let lastError = null

  for (const p of providers) {
    if (!p.apiKey) continue
    try {
      const res = await fetch(`${p.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${p.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: p.model,
          messages,
          ...options,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return data
      }

      // 4xx 客户端错误不重试（如 prompt 问题），5xx 才 fallback
      const status = res.status
      if (status >= 400 && status < 500) {
        const data = await res.json()
        throw new Error(data.error?.message || `${p.name} 返回 ${status}`)
      }

      lastError = new Error(`${p.name} 返回 ${status}`)
    } catch (e) {
      lastError = e
      // 继续尝试下一个 provider
    }
  }

  throw lastError || new Error('所有 LLM 服务不可用')
}
