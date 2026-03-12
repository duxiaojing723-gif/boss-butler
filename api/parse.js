import { chatCompletion } from './_llm.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { text } = req.body
    const today = new Date().toISOString().split('T')[0]

    const data = await chatCompletion([
      {
        role: 'system',
        content: `你是一位在美国经营两家中餐馆的老板的私人助手。今天是 ${today}。
从语音备注中提取任务，只返回 JSON：
{
  "content": "任务描述（中文，简洁清晰）",
  "category": "待办" | "待回复" | "新店" | "排班" | "进货" | "做账" | "异常",
  "store_id": "store1" | "store2" | null,
  "priority": "high" | "medium" | "low",
  "due_date": "YYYY-MM-DD" | null,
  "follow_up_at": "YYYY-MM-DDTHH:MM:SS" | null,
  "needs_followup": true | false
}
分类规则：
- 待回复：需要打电话、回复、确认、跟进某人
- 新店：新地点/第二家店相关准备
- 排班：排班、员工上班、请假、换班
- 进货：进货、订货、供应商、食材采购
- 做账：账单、付款、收款、发票、财务
- 异常：问题、投诉、紧急、设备故障
- 待办：其他
优先级：紧急/asap/今天/马上 → high；需要回复/跟进 → needs_followup: true；提到时间则转为实际日期`,
      },
      { role: 'user', content: text },
    ], { response_format: { type: 'json_object' } })

    try {
      res.json(JSON.parse(data.choices[0].message.content))
    } catch {
      res.json({ content: text, category: '待办', store_id: null, priority: 'medium', due_date: null, follow_up_at: null, needs_followup: false })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
