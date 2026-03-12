import { supabase } from './supabase'

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}超时，请重试`)), ms)
    ),
  ])
}

// 食物照片分析
export async function analyzeFood(base64) {
  const res = await withTimeout(
    fetch('/api/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    }),
    30000, '食物识别'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `识别错误 ${res.status}`)
  return data
}

// 运动热量估算
export async function estimateExercise(type, duration_min) {
  const res = await withTimeout(
    fetch('/api/estimate-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, duration_min }),
    }),
    5000, '热量计算'
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `计算错误 ${res.status}`)
  return data
}

// 今日摘要
export async function getTodaySummary() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: exercises }, { data: meals }] = await Promise.all([
    supabase.from('exercises').select('calories_burned').eq('logged_at', today),
    supabase.from('meals').select('calories').eq('logged_at', today),
  ])

  const burned = (exercises || []).reduce((s, e) => s + e.calories_burned, 0)
  const intake = (meals || []).reduce((s, m) => s + m.calories, 0)

  return { intake, burned, net: intake - burned }
}

// 今日记录列表（运动+饮食混排，按时间倒序）
export async function getTodayLogs() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: exercises }, { data: meals }] = await Promise.all([
    supabase.from('exercises').select('*').eq('logged_at', today).order('created_at', { ascending: false }),
    supabase.from('meals').select('*').eq('logged_at', today).order('created_at', { ascending: false }),
  ])

  const logs = [
    ...(exercises || []).map(e => ({ ...e, _type: 'exercise' })),
    ...(meals || []).map(m => ({ ...m, _type: 'meal' })),
  ]

  logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return logs
}

// 图片压缩（Canvas, max 800px, JPEG 0.7）
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 800
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}
