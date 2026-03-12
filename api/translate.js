import { chatCompletion } from './_llm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { text, fromLang, toLang } = req.body
    const names = { zh: '中文', en: '英语', 'es-MX': '西班牙语（墨西哥口语）' }
    const sys = `把${names[fromLang] || '输入语言'}翻译成${names[toLang]}。只返回翻译结果，不要解释。如果目标是西班牙语，请用墨西哥日常口语风格。`

    const data = await chatCompletion([
      { role: 'system', content: sys },
      { role: 'user', content: text },
    ])

    res.json({ translated: data.choices[0].message.content.trim() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
