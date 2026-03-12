function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}超时，请重试`)), ms)
    ),
  ])
}

async function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })
}

// 语音 → 转录 + 解析，一次搞定
export async function processVoice(audioBlob, lang = 'zh') {
  const audio = await blobToBase64(audioBlob)
  const res = await withTimeout(
    fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio, lang }),
    }),
    40000, '语音处理'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `错误 ${res.status}`)
  return data // { text, parsed }
}

// 纯文字解析（打字输入用）
export async function parseTask(text) {
  const res = await withTimeout(
    fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }),
    20000, '任务解析'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `解析错误 ${res.status}`)
  return data
}

export async function translateText(text, fromLang, toLang) {
  const res = await withTimeout(
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromLang, toLang }),
    }),
    20000, '翻译'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `翻译错误 ${res.status}`)
  return data.translated || ''
}

// 翻译页录音用（只转录，不解析）
export async function transcribeAudio(audioBlob, lang = 'zh') {
  const audio = await blobToBase64(audioBlob)
  const res = await withTimeout(
    fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio, lang }),
    }),
    30000, '录音识别'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `识别错误 ${res.status}`)
  return data.text || ''
}
