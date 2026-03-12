import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const priorityBorder = { high: '#FF3B30', medium: '#FF9F0A', low: '#30D158' }
const storeLabel = { store1: 'Store 1', store2: 'New Location' }

export default function Today() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const todayStr = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks').select('*')
      .neq('status', 'done')
      .or(`due_date.lte.${todayStr},due_date.is.null`)
      .order('priority', { ascending: true })
      .limit(10)
    setTasks(data || [])
    setLoading(false)
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  async function snooze(id) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await supabase.from('tasks').update({ due_date: tomorrow.toISOString().split('T')[0] }).eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const openCount = tasks.filter(t => t.status === 'open').length
  const followCount = tasks.filter(t => t.status === 'following').length

  return (
    <div className="min-h-screen pb-36" style={{ background: '#000' }}>

      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <p className="text-[14px] font-medium" style={{ color: 'rgba(235,235,245,0.5)' }}>{today}</p>
        <h1 className="text-[32px] font-bold tracking-tight mt-0.5">{greeting}, Boss</h1>
      </div>

      {/* Stats */}
      <div className="px-6 mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: openCount, color: '#FF3B30' },
          { label: 'Following', count: followCount, color: '#FF9F0A' },
          { label: 'Total', count: tasks.length, color: 'rgba(235,235,245,0.6)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: '#1C1C1E' }}>
            <p className="text-[28px] font-bold leading-none" style={{ color: s.color }}>{s.count}</p>
            <p className="text-[12px] font-medium mt-1.5" style={{ color: 'rgba(235,235,245,0.4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="px-6 mt-8">
        <p className="text-[12px] font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(235,235,245,0.4)' }}>
          Today's Focus
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#1C1C1E' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-[17px] font-semibold">All clear</p>
            <p className="text-[14px] mt-1" style={{ color: 'rgba(235,235,245,0.4)' }}>Nothing on your plate today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Content */}
                <div className="flex gap-4 p-4" style={{ borderLeft: `3px solid ${priorityBorder[task.priority] || '#FF9F0A'}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium leading-snug">{task.content}</p>
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      {task.store_id && (
                        <span className="text-[12px]" style={{ color: 'rgba(235,235,245,0.4)' }}>
                          🏠 {storeLabel[task.store_id]}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[12px]" style={{ color: 'rgba(235,235,245,0.4)' }}>
                          📅 {task.due_date}
                        </span>
                      )}
                      {task.status === 'following' && (
                        <span className="text-[12px]" style={{ color: '#FF9F0A' }}>⏰ Follow up</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => markDone(task.id)}
                    className="flex-1 py-3 text-[15px] font-medium text-center transition-opacity active:opacity-50"
                    style={{ color: '#30D158', borderRight: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => snooze(task.id)}
                    className="flex-1 py-3 text-[15px] font-medium text-center transition-opacity active:opacity-50"
                    style={{ color: 'rgba(235,235,245,0.4)' }}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Say something CTA */}
      <div className="fixed left-0 right-0 z-40" style={{ bottom: '66px' }}>
        <div className="max-w-[430px] mx-auto px-6">
          <button
            onClick={() => navigate('/record')}
            className="w-full py-4 rounded-2xl text-[17px] font-semibold tracking-tight transition-transform active:scale-[0.97]"
            style={{
              background: '#FF6B35',
              boxShadow: '0 8px 32px rgba(255,107,53,0.35)',
            }}
          >
            🎙️ Say something
          </button>
        </div>
      </div>
    </div>
  )
}
