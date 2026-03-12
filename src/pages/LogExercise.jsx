import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { estimateExercise } from '../lib/health'
import { supabase } from '../lib/supabase'
import { RunIcon } from '../components/Icons'

const TYPES = ['走路', '跑步', '骑车', '力量训练', '瑜伽', '其他']

// 本地 MET 估算（与后端一致，用于实时预览）
const MET = { '走路': 3.5, '跑步': 9.8, '骑车': 7.5, '力量训练': 6.0, '瑜伽': 3.0, '其他': 4.0 }
function localEstimate(type, min) {
  const met = MET[type] || 4.0
  return Math.round(met * 65 * (min / 60))
}

export default function LogExercise() {
  const [type, setType] = useState('走路')
  const [duration, setDuration] = useState(30)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const estimated = localEstimate(type, duration)

  async function save() {
    if (saving || duration <= 0) return
    setSaving(true)
    setError('')

    try {
      const { calories_burned } = await estimateExercise(type, duration)
      const { error: dbError } = await supabase.from('exercises').insert({
        type,
        duration_min: duration,
        calories_burned,
        note: note.trim() || null,
        source: 'manual',
      })
      if (dbError) throw new Error(dbError.message)
      navigate('/health')
    } catch (e) {
      setError(e.message || '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f2f2f7' }}>

      {/* 导航 */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <button onClick={() => navigate('/health')}
          className="flex items-center gap-1.5 active:opacity-50 transition-opacity"
          style={{ color: '#007aff' }}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px]">返回</span>
        </button>
        <h1 className="text-[17px] font-semibold absolute left-1/2 -translate-x-1/2"
          style={{ color: '#1c1c1e' }}>记运动</h1>
      </div>

      <div className="px-6 flex flex-col gap-5 pb-10">

        {/* 运动类型 */}
        <div className="rounded-2xl px-4 py-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#8e8e93' }}>运动类型</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className="px-4 py-2 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: type === t ? 'rgba(52,199,89,0.12)' : '#f2f2f7',
                  color: type === t ? '#34c759' : '#636366',
                  border: type === t ? '1px solid rgba(52,199,89,0.3)' : '1px solid transparent',
                }}>
                {type === t && <RunIcon size={14} color="#34c759" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 时长 */}
        <div className="rounded-2xl px-4 py-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#8e8e93' }}>运动时长（分钟）</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setDuration(d => Math.max(5, d - 5))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] font-bold active:opacity-50"
              style={{ background: '#f2f2f7', color: '#636366' }}>−</button>
            <input type="number" value={duration}
              onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 text-center text-[2rem] font-bold outline-none bg-transparent"
              style={{ color: '#1c1c1e' }} />
            <button onClick={() => setDuration(d => d + 5)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] font-bold active:opacity-50"
              style={{ background: '#f2f2f7', color: '#636366' }}>+</button>
          </div>
        </div>

        {/* 实时估算 */}
        <div className="rounded-2xl px-4 py-5 text-center"
          style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
          <p className="text-[2.5rem] font-bold" style={{ color: '#34c759' }}>{estimated}</p>
          <p className="text-[13px] mt-1" style={{ color: '#636366' }}>预计消耗 kcal</p>
        </div>

        {/* 备注 */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="备注（可选）"
            rows={2}
            className="w-full bg-transparent px-4 pt-3 pb-3 text-[15px] outline-none resize-none"
            style={{ color: '#1c1c1e' }} />
        </div>

        {/* 错误 */}
        {error && (
          <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
            style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
        )}

        {/* 保存 */}
        <button onClick={save} disabled={saving || duration <= 0}
          className="w-full py-4 rounded-2xl text-[16px] font-semibold active:scale-[0.98] transition-transform text-white"
          style={{
            background: saving ? '#b0b0b0' : '#34c759',
            boxShadow: saving ? 'none' : '0 6px 24px rgba(52,199,89,0.3)',
          }}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
