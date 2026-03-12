import { chatCompletion } from './_llm.js'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const WHISPER_LANG = { zh: 'zh', en: 'en', 'es-MX': 'es' }

const PARSE_SYSTEM = (today) => `你是一位在美国经营两家中餐馆的老板的私人助手。今天是 ${today}。
从语音备注中提取任务，只返回 JSON：
{"content":"任务描述（中文简洁）","category":"待办"|"待回复"|"新店"|"排班"|"进货"|"做账"|"异常","store_id":"store1"|"store2"|null,"priority":"high"|"medium"|"low","due_date":"YYYY-MM-DD"|null,"follow_up_at":"YYYY-MM-DDTHH:MM:SS"|null,"needs_followup":true|false}
分类：待回复=打电话/回复/跟进，新店=第二家店，排班=员工班次，进货=采购，做账=财务，异常=问题紧急，待办=其他。
紧急/asap/今天→high；提到时间→转实际日期。`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.OPENAI_API_KEY
  const { audio, lang } = req.body

  try {
    // Step 1: Whisper 转录（保留 OpenAI）
    const base64 = audio.includes(',') ? audio.split(',')[1] : audio
    const buffer = Buffer.from(base64, 'base64')
    const formData = new FormData()
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'recording.webm')
    formData.append('model', 'whisper-1')
    const wl = WHISPER_LANG[lang]
    if (wl) formData.append('language', wl)

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: formData,
    })
    const whisperData = await whisperRes.json()
    if (!whisperRes.ok) return res.status(whisperRes.status).json({ error: whisperData.error?.message })

    const text = whisperData.text || ''
    if (!text.trim()) return res.json({ text: '', parsed: null })

    // Step 2: 解析任务（千问 → DeepSeek fallback）
    const today = new Date().toISOString().split('T')[0]
    const data = await chatCompletion([
      { role: 'system', content: PARSE_SYSTEM(today) },
      { role: 'user', content: text },
    ], { response_format: { type: 'json_object' } })

    let parsed
    try { parsed = JSON.parse(data.choices[0].message.content) }
    catch { parsed = { content: text, category: '待办', store_id: null, priority: 'medium', due_date: null, follow_up_at: null, needs_followup: false } }

    res.json({ text, parsed })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
