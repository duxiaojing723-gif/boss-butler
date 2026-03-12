import { chatCompletion } from './_llm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: '缺少图片' })

    const data = await chatCompletion([
      {
        role: 'system',
        content: `你是一位营养师。分析用户拍摄的食物照片，估算营养信息。
只返回 JSON：
{
  "name": "食物名称（中文）",
  "portion": "大致份量描述",
  "calories": 数字（千卡）,
  "protein_g": 数字（克，一位小数）,
  "carbs_g": 数字（克，一位小数）,
  "fat_g": 数字（克，一位小数）
}
如果无法识别食物，calories 设为 0，name 设为"无法识别"。`,
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image, detail: 'low' } },
          { type: 'text', text: '请分析这张食物照片的营养成分。' },
        ],
      },
    ], { response_format: { type: 'json_object' } })

    try {
      res.json(JSON.parse(data.choices[0].message.content))
    } catch {
      res.status(500).json({ error: 'AI 返回格式异常，请重试' })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
