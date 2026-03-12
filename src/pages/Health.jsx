import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodaySummary, getTodayLogs } from '../lib/health'
import { RunIcon, CameraIcon, FlameIcon } from '../components/Icons'

export default function Health() {
  const [summary, setSummary] = useState({ intake: 0, burned: 0, net: 0 })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    getTodaySummary().then(s => { if (!cancelled) setSummary(s) })
    getTodayLogs().then(l => { if (!cancelled) { setLogs(l); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const dateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long'
  })

  return (
    <div className="min-h-screen pb-32" style={{ background: '#f2f2f7' }}>

      {/* Header */}
      <div className="px-4 pt-14 pb-0">
        <h1 className="text-[1.5rem] font-bold text-[#1c1c1e] tracking-tight mb-1">健康助理</h1>
        <p className="text-[13px] text-[#8e8e93]">{dateStr}</p>
      </div>

      {/* 三格摘要 */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold text-[#ff9500]">{summary.intake}</p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">摄入 kcal</p>
          </div>
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold text-[#34c759]">{summary.burned}</p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">消耗 kcal</p>
          </div>
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold" style={{ color: summary.net > 0 ? '#ff3b30' : '#007aff' }}>
              {summary.net}
            </p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">净值 kcal</p>
          </div>
        </div>
      </div>

      {/* 两个大按钮 */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/health/exercise')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(52,199,89,0.12)' }}>
              <RunIcon size={20} color="#34c759" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">记运动</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">选择类型，输入时长</p>
          </button>
          <button onClick={() => navigate('/health/meal')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,149,0,0.12)' }}>
              <CameraIcon size={20} color="#ff9500" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">拍一餐</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">拍照识别，AI 估算</p>
          </button>
        </div>
      </div>

      {/* Apple Health 提示 */}
      <div className="px-4 mt-3">
        <div className="rounded-[10px] px-3 py-2.5"
          style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.12)' }}>
          <p className="text-[12px] text-[#007aff]">暂不支持自动同步 Apple Health，后续版本支持</p>
        </div>
      </div>

      {/* 今日记录 */}
      <div className="px-4 mt-6">
        <p className="text-[0.8rem] font-semibold text-[#636366] mb-3 pl-0.5">今日记录</p>

        {loading && (
          <p className="text-[14px] text-[#8e8e93] text-center py-8">加载中...</p>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-8">
            <FlameIcon size={40} color="#8e8e93" />
            <p className="text-[14px] text-[#8e8e93] mt-2">今天还没有记录</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="bg-white rounded-[14px] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {logs.map((log, i) => (
              <div key={log.id}
                className="flex items-center gap-3 px-[18px] py-3.5"
                style={{ borderBottom: i < logs.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: log._type === 'exercise' ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)' }}>
                  {log._type === 'exercise'
                    ? <RunIcon size={16} color="#34c759" />
                    : <CameraIcon size={16} color="#ff9500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9rem] text-[#1c1c1e] truncate">
                    {log._type === 'exercise' ? `${log.type} ${log.duration_min}分钟` : log.name}
                  </p>
                  <p className="text-[0.75rem] text-[#8e8e93]">
                    {new Date(log.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-[0.9rem] font-semibold flex-shrink-0"
                  style={{ color: log._type === 'exercise' ? '#34c759' : '#ff9500' }}>
                  {log._type === 'exercise' ? `-${log.calories_burned}` : `+${log.calories}`} kcal
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部标注 */}
      <p className="text-center text-[0.75rem] text-[#8e8e93] mt-6 pb-4">
        AI 估算，仅供参考
      </p>
    </div>
  )
}
