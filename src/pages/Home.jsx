import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchWeather } from '../lib/weather'
import { useNavigate } from 'react-router-dom'

const CAT = {
  '待办':  { icon: '📌' },
  '待回复': { icon: '📞' },
  '新店':  { icon: '🏗️' },
  '排班':  { icon: '👥' },
  '进货':  { icon: '📦' },
  '做账':  { icon: '💰' },
  '异常':  { icon: '⚠️' },
}

const PBORDER = { high: '#FF3B30', medium: '#FF9F0A', low: '#30D158' }

function butlerMsg(hour, w, tasks) {
  const urgent = tasks.filter(t => t.priority === 'high').length
  const total = tasks.length
  const wp = w ? `今天${w.condition}，${w.cloth}。` : ''

  if (hour < 6)  return `还没睡？早点休息，明天还有 ${total} 件事要盯。`
  if (hour < 10) return urgent > 0
    ? `早。${wp}今天有 ${urgent} 件急事，先看一眼。`
    : `早。${wp}今天安排还算轻松，稳着来。`
  if (hour < 13) return `该吃饭了，别忘了。今天还剩 ${total} 件事，吃完再说。`
  if (hour < 17) return urgent > 0
    ? `下午好。有 ${urgent} 件急事还挂着，趁现在跟进一下。`
    : `下午好。今天进展不错，继续保持。`
  if (hour < 21) {
    const safe = w?.eveningAlert || '开车注意安全'
    return `快收摊了。${safe}。今天剩 ${total} 件，明天继续。`
  }
  return `今天辛苦了。剩 ${total} 件没完成，明天再说，早点歇着。`
}

function WeatherCard({ w }) {
  return (
    <div className="mx-6 mt-3 rounded-2xl p-4"
      style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none">{w.emoji}</span>
        <div>
          <p className="text-[22px] font-bold leading-tight">
            {w.temp}°
            <span className="text-[14px] font-normal ml-2" style={{ color: 'rgba(235,235,245,0.45)' }}>
              体感 {w.feels}°
            </span>
          </p>
          <p className="text-[13px]" style={{ color: 'rgba(235,235,245,0.45)' }}>{w.condition}</p>
        </div>
      </div>
      <p className="text-[13px] mt-3" style={{ color: 'rgba(235,235,245,0.75)' }}>
        👔 {w.cloth}
      </p>
      {w.rainAlert && (
        <p className="text-[13px] mt-1.5" style={{ color: '#FF9F0A' }}>☂️ {w.rainAlert}</p>
      )}
      {w.eveningAlert && (
        <p className="text-[13px] mt-1.5" style={{ color: '#64D2FF' }}>🌙 {w.eveningAlert}</p>
      )}
    </div>
  )
}

function TaskRow({ task, onDone }) {
  const cat = CAT[task.category] || CAT['待办']
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{
        background: '#1C1C1E',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${PBORDER[task.priority] || '#FF9F0A'}`,
      }}>
      <span className="text-[20px] flex-shrink-0">{cat.icon}</span>
      <p className="flex-1 text-[14px] leading-snug min-w-0" style={{
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {task.content}
      </p>
      <button
        onClick={() => onDone(task.id)}
        className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full active:opacity-50 transition-opacity ml-2"
        style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158' }}
      >
        完成
      </button>
    </div>
  )
}

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long'
  })

  useEffect(() => {
    loadTasks()
    fetchWeather().then(setWeather).catch(() => {})
  }, [])

  async function loadTasks() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks').select('*')
      .neq('status', 'done')
      .or(`due_date.lte.${today},due_date.is.null`)
      .order('priority', { ascending: true })
      .limit(20)
    setTasks(data || [])
    setLoading(false)
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const openTasks = tasks.filter(t => t.status === 'open')
  const followTasks = tasks.filter(t => t.status === 'following')
  const top3 = openTasks.slice(0, 3)
  const anomaly = tasks.filter(t => t.category === '异常')

  return (
    <div className="min-h-screen pb-52" style={{ background: '#000' }}>

      {/* Date */}
      <div className="px-6 pt-14 pb-0">
        <p className="text-[13px]" style={{ color: 'rgba(235,235,245,0.35)' }}>{dateStr}</p>
      </div>

      {/* 管家卡 */}
      <div className="mx-6 mt-3 rounded-2xl p-4"
        style={{ background: '#1C1C1E', borderLeft: '3px solid #FF6B35' }}>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-1.5"
          style={{ color: '#FF6B35' }}>管家</p>
        <p className="text-[15px] leading-relaxed">
          {loading ? '正在整理今天的安排...' : butlerMsg(hour, weather, tasks)}
        </p>
      </div>

      {/* 天气卡 */}
      {weather && <WeatherCard w={weather} />}

      {/* 异常警报 */}
      {anomaly.length > 0 && (
        <div className="mx-6 mt-3 rounded-2xl p-4"
          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)' }}>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: '#FF3B30' }}>⚠️ 需要关注</p>
          {anomaly.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <p className="text-[14px] flex-1">{t.content}</p>
              <button onClick={() => markDone(t.id)} className="text-[12px] px-3 py-1 rounded-full active:opacity-50"
                style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>完成</button>
            </div>
          ))}
        </div>
      )}

      {/* 今天先盯这3件 */}
      {top3.length > 0 && (
        <div className="mt-6 px-6">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(235,235,245,0.35)' }}>
            今天先盯这 {top3.length} 件
          </p>
          <div className="space-y-2">
            {top3.map(task => (
              <TaskRow key={task.id} task={task} onDone={markDone} />
            ))}
          </div>
          {openTasks.length > 3 && (
            <button onClick={() => navigate('/tasks')}
              className="mt-3 w-full py-3 rounded-2xl text-[13px] active:opacity-60"
              style={{ background: '#1C1C1E', color: 'rgba(235,235,245,0.4)' }}>
              还有 {openTasks.length - 3} 件 →
            </button>
          )}
        </div>
      )}

      {/* 等你回复 */}
      {followTasks.length > 0 && (
        <div className="mt-6 px-6">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(235,235,245,0.35)' }}>等你回复</p>
          <div className="space-y-2">
            {followTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255,159,10,0.2)',
                  borderLeft: '3px solid #FF9F0A',
                }}>
                <span className="text-[20px]">📞</span>
                <p className="flex-1 text-[14px] leading-snug min-w-0" style={{
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {task.content}
                </p>
                <button onClick={() => markDone(task.id)}
                  className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full active:opacity-50 ml-2"
                  style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>
                  完成
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && tasks.length === 0 && (
        <div className="text-center mt-16 px-6">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-[17px] font-semibold">今天一件事都没有</p>
          <p className="text-[14px] mt-1" style={{ color: 'rgba(235,235,245,0.4)' }}>
            说一件事加进来吧
          </p>
        </div>
      )}

      {/* 底部固定按钮 */}
      <div className="fixed left-0 right-0 z-40" style={{ bottom: '66px' }}>
        <div className="max-w-[430px] mx-auto px-5 space-y-2.5">
          <button
            onClick={() => navigate('/record')}
            className="w-full py-4 rounded-2xl text-[17px] font-semibold tracking-tight active:scale-[0.97] transition-transform"
            style={{
              background: '#FF6B35',
              boxShadow: '0 8px 32px rgba(255,107,53,0.45)',
            }}
          >
            🎙️ 说一件事
          </button>
          <button
            onClick={() => navigate('/translate')}
            className="w-full py-3 rounded-2xl text-[15px] font-medium active:opacity-60"
            style={{ background: '#1C1C1E', color: 'rgba(235,235,245,0.55)' }}
          >
            翻译一下
          </button>
        </div>
      </div>
    </div>
  )
}
