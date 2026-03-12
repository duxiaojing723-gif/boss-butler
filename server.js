import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

// API routes — 动态导入 Vercel 风格的 handler
const apiModules = {
  '/api/parse': () => import('./api/parse.js'),
  '/api/ask': () => import('./api/ask.js'),
  '/api/translate': () => import('./api/translate.js'),
  '/api/voice': () => import('./api/voice.js'),
  '/api/transcribe': () => import('./api/transcribe.js'),
}

for (const [path, loader] of Object.entries(apiModules)) {
  app.all(path, async (req, res) => {
    try {
      const mod = await loader()
      await mod.default(req, res)
    } catch (e) {
      console.error(`[${path}]`, e)
      res.status(500).json({ error: e.message })
    }
  })
}

// 静态文件（Vite 构建产物）
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`boss-butler running on port ${PORT}`)
})
