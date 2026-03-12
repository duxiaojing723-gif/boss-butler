import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CatIcon, EmptyBoxIcon, HouseIcon, CalendarIcon } from '../components/Icons'

const PBORDER = { high: '#ff3b30', medium: '#ff9500', low: '#34c759' }
const STORE = { store1: '第一家', store2: '新店' }

const STATUS_TABS = [
  { key: 'open', label: '待处理' },
  { key: 'following', label: '待回复' },
  { key: 'done', label: '已完成' },
  { key: 'all', label: '全部' },
]

const CATEGORIES = ['待办', '待回复', '新店', '排班', '进货', '做账', '异常']

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

  const cats = ['全部', ...CATEGORIES]

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f2f2f7' }}>

      <div className="px-6 pt-14 pb-4">
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: '#1c1c1e' }}>事项</h1>
      </div>

      {/* 状态 Tab */}
      <div className="px-6 mb-3">
        <div className="flex p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {STATUS_TABS.map(t => (
            <button key={t.key}
              onClick={() => setStatus(t.key)}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: status === t.key ? '#fff' : 'transparent',
                color: status === t.key ? '#1c1c1e' : '#8e8e93',
                boxShadow: status === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex items-center gap-1"
            style={{
              background: catFilter === c ? 'rgba(0,122,255,0.12)' : '#fff',
              color: catFilter === c ? '#007aff' : '#8e8e93',
              border: catFilter === c ? '1px solid rgba(0,122,255,0.3)' : '1px solid rgba(0,0,0,0.06)',
            }}>
            {c !== '全部' && <CatIcon category={c} size={13} color={catFilter === c ? '#007aff' : '#8e8e93'} />}
            {c}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="px-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-3">
              <EmptyBoxIcon size={48} color="#8e8e93" />
            </div>
            <p className="text-[17px] font-semibold" style={{ color: '#1c1c1e' }}>这里没有事项</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const isDone = task.status === 'done'
              return (
                <div key={task.id} className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    opacity: isDone ? 0.55 : 1,
                  }}>
                  <div className="flex gap-3 p-4"
                    style={{ borderLeft: `3px solid ${PBORDER[task.priority] || '#ff9500'}` }}>
                    <span className="flex-shrink-0 mt-0.5">
                      <CatIcon category={task.category} size={18} color={isDone ? '#8e8e93' : '#636366'} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-snug"
                        style={{
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? '#8e8e93' : '#1c1c1e',
                        }}>
                        {task.content}
                      </p>
                      <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: '#f2f2f7', color: '#636366' }}>
                          {task.category || '待办'}
                        </span>
                        {task.store_id && (
                          <span className="text-[11px] flex items-center gap-0.5" style={{ color: '#8e8e93' }}>
                            <HouseIcon size={12} color="#8e8e93" /> {STORE[task.store_id]}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-[11px] flex items-center gap-0.5" style={{ color: '#8e8e93' }}>
                            <CalendarIcon size={12} color="#8e8e93" /> {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    {!isDone ? (
                      <button onClick={() => markDone(task.id)}
                        className="flex-1 py-3 text-[13px] font-medium text-center active:opacity-50"
                        style={{ color: '#34c759', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                        完成
                      </button>
                    ) : (
                      <button onClick={() => reopen(task.id)}
                        className="flex-1 py-3 text-[13px] font-medium text-center active:opacity-50"
                        style={{ color: '#8e8e93', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                        重新打开
                      </button>
                    )}
                    <button onClick={() => del(task.id)}
                      className="px-6 py-3 text-[13px] font-medium active:opacity-50"
                      style={{ color: '#ff3b30' }}>
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
