import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchWeather } from '../lib/weather'
import { useNavigate } from 'react-router-dom'
import {
  CatIcon, CheckIcon, ListIcon, NoteIcon, GlobeIcon, SparkleIcon,
  MicIcon, ShirtIcon, UmbrellaIcon, MoonIcon, AlertIcon,
} from '../components/Icons'

const PBORDER = { high: '#ff3b30', medium: '#ff9500', low: '#34c759' }

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
    <div className="rounded-[14px] p-4"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none">{w.emoji}</span>
        <div>
          <p className="text-[22px] font-bold leading-tight text-[#1c1c1e]">
            {w.temp}°
            <span className="text-[14px] font-normal ml-2 text-[#8e8e93]">
              体感 {w.feels}°
            </span>
          </p>
          <p className="text-[13px] text-[#8e8e93]">{w.condition}{w.city ? ` · ${w.city}` : ''}</p>
        </div>
      </div>
      <p className="text-[13px] mt-3 text-[#636366] flex items-center gap-1.5">
        <ShirtIcon size={14} color="#636366" /> {w.cloth}
      </p>
      {w.rainAlert && (
        <p className="text-[13px] mt-1.5 text-[#ff9500] flex items-center gap-1.5">
          <UmbrellaIcon size={14} color="#ff9500" /> {w.rainAlert}
        </p>
      )}
      {w.eveningAlert && (
        <p className="text-[13px] mt-1.5 text-[#007aff] flex items-center gap-1.5">
          <MoonIcon size={14} color="#007aff" /> {w.eveningAlert}
        </p>
      )}
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
    <div className="min-h-screen pb-52" style={{ background: '#f2f2f7' }}>

      {/* Header */}
      <div className="px-4 pt-14 pb-0">
        <h1 className="text-[1.5rem] font-bold text-[#1c1c1e] tracking-tight mb-1">单单的小助理</h1>
        <p className="text-[13px] text-[#8e8e93]">{dateStr}</p>
      </div>

      {/* 摘要卡片 */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold text-[#007aff]">{openTasks.length}</p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">待办</p>
          </div>
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold text-[#007aff]">{followTasks.length}</p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">待回复</p>
          </div>
          <div className="bg-white rounded-[10px] py-3.5 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[1.5rem] font-bold text-[#007aff]">{anomaly.length}</p>
            <p className="text-[0.75rem] text-[#8e8e93] mt-1">异常</p>
          </div>
        </div>
      </div>

      {/* 语音输入卡 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-[14px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-sm bg-[#007aff]" />
            <span className="text-[0.9rem] font-semibold text-[#1c1c1e]">语音输入</span>
          </div>
          <button
            onClick={() => navigate('/record')}
            className="w-full flex items-center gap-3 rounded-[10px] px-4 py-3 active:scale-[0.98] transition-transform"
            style={{ background: '#f2f2f7', border: '1px solid #e8e8ed' }}>
            <span className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,122,255,0.12)' }}>
              <MicIcon size={24} color="#007aff" />
            </span>
            <span className="text-[0.9rem] text-[#8e8e93]">点击说话，或者输入文字...</span>
          </button>
        </div>
      </div>

      {/* 管家卡 */}
      <div className="px-4 mt-4">
        <div className="rounded-[14px] p-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '3px solid #007aff' }}>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1.5 text-[#007aff]">管家</p>
          <p className="text-[15px] leading-relaxed text-[#1c1c1e]">
            {loading ? '正在整理今天的安排...' : butlerMsg(hour, weather, tasks)}
          </p>
        </div>
      </div>

      {/* 天气卡 */}
      {weather && (
        <div className="px-4 mt-3">
          <WeatherCard w={weather} />
        </div>
      )}

      {/* 异常警报 */}
      {anomaly.length > 0 && (
        <div className="px-4 mt-3">
          <div className="rounded-[14px] p-4"
            style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-[#ff3b30] flex items-center gap-1.5">
              <AlertIcon size={14} color="#ff3b30" /> 需要关注
            </p>
            {anomaly.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <p className="text-[14px] flex-1 text-[#1c1c1e]">{t.content}</p>
                <button onClick={() => markDone(t.id)} className="text-[12px] px-3 py-1 rounded-full active:opacity-50"
                  style={{ background: 'rgba(52,199,89,0.12)', color: '#34c759' }}>完成</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="px-4 mt-6">
        <p className="text-[0.8rem] font-semibold text-[#636366] mb-3 pl-0.5">快捷操作</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/record')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(0,122,255,0.12)' }}>
              <CheckIcon size={20} color="#007aff" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">新建任务</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">记一笔待办，稍后处理</p>
          </button>
          <button onClick={() => navigate('/tasks')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(52,199,89,0.12)' }}>
              <ListIcon size={20} color="#34c759" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">查看事项</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">管理所有待办</p>
          </button>
          <button onClick={() => navigate('/record')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,149,0,0.12)' }}>
              <NoteIcon size={20} color="#ff9500" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">记一笔</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">快速记录想法</p>
          </button>
          <button onClick={() => navigate('/translate')}
            className="bg-white rounded-[14px] p-5 text-left active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,59,48,0.12)' }}>
              <GlobeIcon size={20} color="#ff3b30" />
            </div>
            <p className="text-[1rem] font-semibold text-[#1c1c1e]">翻译</p>
            <p className="text-[0.8rem] text-[#8e8e93] mt-1">中英 / 中西互翻</p>
          </button>
        </div>
      </div>

      {/* 最近待办 */}
      {top3.length > 0 && (
        <div className="px-4 mt-6">
          <div className="bg-white rounded-[14px] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <span className="text-[0.9rem] font-semibold text-[#1c1c1e]">最近待办</span>
              <button onClick={() => navigate('/tasks')} className="text-[0.8rem] font-medium text-[#007aff]">查看全部</button>
            </div>
            <ul>
              {top3.map((task, i) => (
                <li key={task.id} className="flex items-center gap-3 px-[18px] py-3.5 cursor-pointer active:bg-[#f8f8f8] transition-colors"
                  style={{ borderBottom: i < top3.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PBORDER[task.priority] || '#8e8e93' }} />
                  <span className="flex-1 text-[0.9rem] text-[#1c1c1e]">{task.content}</span>
                  <button onClick={() => markDone(task.id)}
                    className="text-[0.78rem] text-[#34c759] font-medium active:opacity-50">完成</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 等你回复 */}
      {followTasks.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-[14px] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-[18px] py-3.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <span className="text-[0.9rem] font-semibold text-[#1c1c1e]">等你回复</span>
            </div>
            <ul>
              {followTasks.slice(0, 3).map((task, i) => (
                <li key={task.id} className="flex items-center gap-3 px-[18px] py-3.5 active:bg-[#f8f8f8]"
                  style={{ borderBottom: i < Math.min(followTasks.length, 3) - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#ff9500]" />
                  <span className="flex-1 text-[0.9rem] text-[#1c1c1e]">{task.content}</span>
                  <button onClick={() => markDone(task.id)}
                    className="text-[0.78rem] text-[#34c759] font-medium active:opacity-50">完成</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && tasks.length === 0 && (
        <div className="text-center mt-16 px-6">
          <div className="flex justify-center mb-4">
            <SparkleIcon size={48} color="#007aff" />
          </div>
          <p className="text-[17px] font-semibold text-[#1c1c1e]">今天一件事都没有</p>
          <p className="text-[14px] mt-1 text-[#8e8e93]">说一件事加进来吧</p>
        </div>
      )}

      <p className="text-center text-[0.8rem] text-[#8e8e93] mt-8 pb-4">数据实时同步 · 单单的小助理</p>
    </div>
  )
}
