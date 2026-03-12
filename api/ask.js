import { chatCompletion } from './_llm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { question } = req.body
    const today = new Date().toISOString().split('T')[0]

    const data = await chatCompletion([
      {
        role: 'system',
        content: `你是一位贴心的私人助手，服务对象是在美国经营两家中餐馆的老板。今天是 ${today}。
用简洁口语化中文回答。涉及餐馆运营、食材、员工、美国法规、中英文表达等问题要给出实用建议。
回答控制在150字以内，分点时用简短短句，不要废话。`,
      },
      { role: 'user', content: question },
    ])

    res.json({ answer: data.choices[0].message.content.trim() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
