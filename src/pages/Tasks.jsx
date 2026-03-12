import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
const STORE = { store1: '第一家', store2: '新店' }

const STATUS_TABS = [
  { key: 'open', label: '待处理' },
  { key: 'following', label: '待回复' },
  { key: 'done', label: '已完成' },
  { key: 'all', label: '全部' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('open')
  const [catFilter, setCatFilter] = useState('全部')

  useEffect(() => { loadTasks() }, [status, catFilter])

  async function loadTasks() {
    setLoading(true)
    let q = supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (status !== 'all') q = q.eq('status', status)
    if (catFilter !== '全部') q = q.eq('category', catFilter)
    const { data } = await q
    setTasks(data || [])
    setLoading(false)
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
  }

  async function reopen(id) {
    await supabase.from('tasks').update({ status: 'open' }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'open' } : t))
  }

  async function del(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const cats = ['全部', ...Object.keys(CAT)]

  return (
    <div className="min-h-screen pb-28" style={{ background: '#000' }}>

      <div className="px-6 pt-14 pb-4">
        <h1 className="text-[32px] font-bold tracking-tight">事项</h1>
      </div>

      {/* 状态 Tab */}
      <div className="px-6 mb-3">
        <div className="flex p-1 rounded-xl" style={{ background: '#1C1C1E' }}>
          {STATUS_TABS.map(t => (
            <button key={t.key}
              onClick={() => setStatus(t.key)}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: status === t.key ? '#2C2C2E' : 'transparent',
                color: status === t.key ? '#fff' : 'rgba(235,235,245,0.4)',
                boxShadow: status === t.key ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 px-6 mb-5 overflow-x-auto no-scrollbar">
        {cats.map(c => (
          <button key={c}
            onClick={() => setCatFilter(c)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
            style={{
              background: catFilter === c ? 'rgba(255,107,53,0.18)' : '#1C1C1E',
              color: catFilter === c ? '#FF6B35' : 'rgba(235,235,245,0.45)',
              border: catFilter === c ? '1px solid rgba(255,107,53,0.4)' : '1px solid transparent',
            }}>
            {c !== '全部' && (CAT[c]?.icon + ' ')}{c}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="px-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: '#1C1C1E' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-[17px] font-semibold">这里没有事项</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const cat = CAT[task.category] || CAT['待办']
              const isDone = task.status === 'done'
              return (
                <div key={task.id} className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#1C1C1E',
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: isDone ? 0.5 : 1,
                  }}>
                  <div className="flex gap-3 p-4"
                    style={{ borderLeft: `3px solid ${PBORDER[task.priority] || '#FF9F0A'}` }}>
                    <span className="text-[18px] flex-shrink-0 mt-0.5">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-snug"
                        style={{
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'rgba(235,235,245,0.4)' : '#fff',
                        }}>
                        {task.content}
                      </p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(235,235,245,0.45)' }}>
                          {task.category || '待办'}
                        </span>
                        {task.store_id && (
                          <span className="text-[11px]" style={{ color: 'rgba(235,235,245,0.4)' }}>
                            🏠 {STORE[task.store_id]}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-[11px]" style={{ color: 'rgba(235,235,245,0.4)' }}>
                            📅 {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {!isDone ? (
                      <button onClick={() => markDone(task.id)}
                        className="flex-1 py-3 text-[13px] font-medium text-center active:opacity-50"
                        style={{ color: '#30D158', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        完成 ✓
                      </button>
                    ) : (
                      <button onClick={() => reopen(task.id)}
                        className="flex-1 py-3 text-[13px] font-medium text-center active:opacity-50"
                        style={{ color: 'rgba(235,235,245,0.45)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        重新打开
                      </button>
                    )}
                    <button onClick={() => del(task.id)}
                      className="px-6 py-3 text-[13px] font-medium active:opacity-50"
                      style={{ color: '#FF3B30' }}>
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
