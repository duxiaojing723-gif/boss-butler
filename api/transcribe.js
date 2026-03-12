export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const WHISPER_LANG = { zh: 'zh', en: 'en', 'es-MX': 'es' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { audio, lang } = req.body

    // base64 → Buffer
    const base64 = audio.includes(',') ? audio.split(',')[1] : audio
    const buffer = Buffer.from(base64, 'base64')

    // Build FormData for Whisper
    const formData = new FormData()
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'recording.webm')
    formData.append('model', 'whisper-1')
    const wl = WHISPER_LANG[lang]
    if (wl) formData.append('language', wl)

    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    })

    const data = await upstream.json()
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'Whisper error' })
    res.json({ text: data.text || '' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
