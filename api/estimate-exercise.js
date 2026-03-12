const MET_VALUES = {
  '走路': 3.5,
  '跑步': 9.8,
  '骑车': 7.5,
  '力量训练': 6.0,
  '瑜伽': 3.0,
  '其他': 4.0,
}

const BODY_WEIGHT_KG = 65

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, duration_min } = req.body
  if (!type || !duration_min) {
    return res.status(400).json({ error: '缺少运动类型或时长' })
  }

  const met = MET_VALUES[type] || MET_VALUES['其他']
  const calories_burned = Math.round(met * BODY_WEIGHT_KG * (duration_min / 60))

  res.json({ calories_burned })
}
