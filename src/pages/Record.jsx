import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { transcribeAudio, parseTask } from '../lib/openai'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['待办', '待回复', '新店', '排班', '进货', '做账', '异常']
const CAT_ICON = {
  '待办': '📌', '待回复': '📞', '新店': '🏗️',
  '排班': '👥', '进货': '📦', '做账': '💰', '异常': '⚠️',
}

export default function Record() {
  // idle | recording | transcribing | choice | parsing | asking | preview | answer
  const [mode, setMode] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [answer, setAnswer] = useState('')
  const [textInput, setTextInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const parsePrefetchRef = useRef(null) // 后台偷跑的解析 Promise
  const navigate = useNavigate()

  // ── 录音 ──
  async function toggleRecording() {
    if (mode === 'recording') { mediaRef.current?.stop(); return }
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setMode('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const text = await transcribeAudio(blob, 'zh')
          if (!text.trim()) { setError('没听清楚，再说一遍'); setMode('idle'); return }
          setTranscript(text)
          // 立即在后台开始解析（用户看文字时偷跑）
          parsePrefetchRef.current = fetchParse(text)
          setMode('choice')
        } catch (e) {
          setError(e.message || '识别失败，请重试')
          setMode('idle')
        }
      }
      mediaRef.current = recorder
      recorder.start()
      setMode('recording')
    } catch {
      setError('没有麦克风权限，请在浏览器设置中允许')
    }
  }

  async function fetchParse(text) {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }

  // ── 文字输入 ──
  function handleTextChoice() {
    if (!textInput.trim()) return
    setTranscript(textInput)
    parsePrefetchRef.current = fetchParse(textInput)
    setMode('choice')
  }

  // ── 选择：记录 ──
  async function goRecord() {
    setMode('parsing')
    setError('')
    try {
      const result = await parsePrefetchRef.current // 大概率已经跑完了
      setParsed(result)
      setMode('preview')
    } catch (e) {
      setError(e.message || '解析失败，请重试')
      setMode('choice')
    }
  }

  // ── 选择：问一下 ──
  async function goAsk() {
    setMode('asking')
    setError('')
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: transcript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnswer(data.answer)
      setMode('answer')
    } catch (e) {
      setError(e.message || '查询失败，请重试')
      setMode('choice')
    }
  }

  // ── 保存任务 ──
  async function saveTask() {
    if (!parsed || saving) return
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('tasks').insert({
      content: parsed.content,
      category: parsed.category || '待办',
      store_id: parsed.store_id || null,
      priority: parsed.priority || 'medium',
      due_date: parsed.due_date || null,
      follow_up_at: parsed.follow_up_at || null,
      status: parsed.needs_followup ? 'following' : 'open',
      source: 'voice',
      original_input: transcript || textInput,
    })
    if (dbError) { setError('保存失败：' + dbError.message); setSaving(false); return }
    navigate('/')
  }

  function reset() {
    setMode('idle'); setTranscript(''); setParsed(null)
    setAnswer(''); setTextInput(''); setError('')
    parsePrefetchRef.current = null
  }

  // ── 从答案追加为任务 ──
  async function answerToTask() {
    const result = await fetchParse(transcript)
    setParsed(result)
    setMode('preview')
  }

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>

      {/* 导航 */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 active:opacity-50 transition-opacity"
          style={{ color: '#FF6B35' }}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px]">返回</span>
        </button>
        <h1 className="text-[17px] font-semibold absolute left-1/2 -translate-x-1/2">
          {mode === 'answer' ? '问一下' : '说一件事'}
        </h1>
      </div>

      {/* ── IDLE ── */}
      {mode === 'idle' && (
        <div className="px-6 flex flex-col gap-6 pb-10">
          <div className="flex flex-col items-center py-8">
            <button onClick={toggleRecording}
              className="w-32 h-32 rounded-full flex items-center justify-center text-5xl active:scale-95 transition-transform"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ff9060, #FF6B35)',
                boxShadow: '0 0 0 16px rgba(255,107,53,0.1), 0 12px 40px rgba(255,107,53,0.45)',
              }}>
              🎙️
            </button>
            <p className="text-[14px] mt-5" style={{ color: 'rgba(235,235,245,0.4)' }}>
              点击说话，说完自己选：记录 or 问一下
            </p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>{error}</div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-[13px]" style={{ color: 'rgba(235,235,245,0.3)' }}>或者打字</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
              placeholder="想记录什么，或者想问什么都行..."
              rows={4}
              className="w-full bg-transparent px-4 pt-4 pb-3 text-[15px] outline-none resize-none"
              style={{ color: '#fff' }} />
            {textInput.trim() && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handleTextChoice}
                  className="w-full py-4 text-[15px] font-semibold active:opacity-60"
                  style={{ color: '#FF6B35' }}>
                  继续 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RECORDING ── */}
      {mode === 'recording' && (
        <div className="flex flex-col items-center justify-center py-20 gap-8">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-48 h-48 rounded-full animate-ping"
              style={{ background: 'rgba(255,59,48,0.1)' }} />
            <div className="absolute w-36 h-36 rounded-full animate-pulse"
              style={{ background: 'rgba(255,59,48,0.18)' }} />
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl"
              style={{ background: '#FF3B30', boxShadow: '0 8px 32px rgba(255,59,48,0.5)' }}>
              🔴
            </div>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-semibold">正在录音...</p>
            <p className="text-[14px] mt-1" style={{ color: 'rgba(235,235,245,0.4)' }}>说完了点停止</p>
          </div>
          <button onClick={toggleRecording}
            className="px-12 py-4 rounded-2xl text-[16px] font-semibold active:opacity-70"
            style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}>
            停止
          </button>
        </div>
      )}

      {/* ── TRANSCRIBING ── */}
      {mode === 'transcribing' && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-6xl animate-pulse">👂</div>
          <p className="text-[18px] font-semibold">正在识别...</p>
        </div>
      )}

      {/* ── CHOICE ── */}
      {mode === 'choice' && (
        <div className="px-6 flex flex-col gap-5 pb-10">
          {/* 你说的 */}
          <div className="rounded-2xl px-4 py-4"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: 'rgba(235,235,245,0.35)' }}>你说的</p>
            <p className="text-[16px] leading-relaxed">{transcript}</p>
          </div>

          {/* 选择操作 */}
          <p className="text-[13px] text-center" style={{ color: 'rgba(235,235,245,0.4)' }}>
            这句话你想做什么？
          </p>

          <button onClick={goRecord}
            className="w-full py-5 rounded-2xl text-[17px] font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#FF6B35', boxShadow: '0 8px 28px rgba(255,107,53,0.4)' }}>
            📋 记录下来
          </button>

          <button onClick={goAsk}
            className="w-full py-5 rounded-2xl text-[17px] font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            🔍 问一下 AI
          </button>

          <button onClick={reset}
            className="w-full py-3 text-[14px] active:opacity-50"
            style={{ color: 'rgba(235,235,245,0.35)' }}>
            重新说
          </button>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>{error}</div>
          )}
        </div>
      )}

      {/* ── PARSING / ASKING ── */}
      {(mode === 'parsing' || mode === 'asking') && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-6xl animate-bounce">
            {mode === 'parsing' ? '🤔' : '🔍'}
          </div>
          <p className="text-[18px] font-semibold">
            {mode === 'parsing' ? '整理中...' : 'AI 查询中...'}
          </p>
        </div>
      )}

      {/* ── PREVIEW（任务确认）── */}
      {mode === 'preview' && parsed && (
        <div className="px-6 pb-10 space-y-4">
          <div className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
              style={{ color: '#FF6B35' }}>你说的</p>
            <p className="text-[14px] italic" style={{ color: 'rgba(235,235,245,0.75)' }}>
              "{transcript}"
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>

            <div className="px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: 'rgba(235,235,245,0.35)' }}>任务内容</p>
              <input value={parsed.content}
                onChange={e => setParsed({ ...parsed, content: e.target.value })}
                className="w-full bg-transparent text-[15px] outline-none" style={{ color: '#fff' }} />
            </div>

            <div className="px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2.5"
                style={{ color: 'rgba(235,235,245,0.35)' }}>分类</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setParsed({ ...parsed, category: cat })}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      background: parsed.category === cat ? 'rgba(255,107,53,0.2)' : '#2C2C2E',
                      color: parsed.category === cat ? '#FF6B35' : 'rgba(235,235,245,0.5)',
                      border: parsed.category === cat ? '1px solid rgba(255,107,53,0.45)' : '1px solid transparent',
                    }}>
                    {CAT_ICON[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 py-3"
                style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(235,235,245,0.35)' }}>门店</p>
                <select value={parsed.store_id || ''}
                  onChange={e => setParsed({ ...parsed, store_id: e.target.value || null })}
                  className="w-full bg-transparent text-[14px] outline-none appearance-none"
                  style={{ color: '#fff' }}>
                  <option value="">两家都有</option>
                  <option value="store1">第一家</option>
                  <option value="store2">新店</option>
                </select>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(235,235,245,0.35)' }}>紧急程度</p>
                <select value={parsed.priority || 'medium'}
                  onChange={e => setParsed({ ...parsed, priority: e.target.value })}
                  className="w-full bg-transparent text-[14px] outline-none appearance-none"
                  style={{ color: '#fff' }}>
                  <option value="high">🔴 紧急</option>
                  <option value="medium">🟡 普通</option>
                  <option value="low">🟢 不急</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[15px]">需要回复 / 跟进</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer"
                  checked={parsed.needs_followup || false}
                  onChange={e => setParsed({ ...parsed, needs_followup: e.target.checked })} />
                <div className="w-11 h-6 rounded-full transition-colors peer-checked:bg-accent relative"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#1C1C1E', color: 'rgba(235,235,245,0.55)' }}>
              重录
            </button>
            <button onClick={saveTask} disabled={saving}
              className="flex-[2] py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform"
              style={{
                background: saving ? '#444' : '#FF6B35',
                boxShadow: saving ? 'none' : '0 6px 24px rgba(255,107,53,0.4)',
              }}>
              {saving ? '保存中...' : '存进去 ✓'}
            </button>
          </div>
        </div>
      )}

      {/* ── ANSWER（AI 回答）── */}
      {mode === 'answer' && (
        <div className="px-6 pb-10 space-y-4">
          {/* 问题 */}
          <div className="rounded-2xl px-4 py-3"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
              style={{ color: 'rgba(235,235,245,0.35)' }}>你问的</p>
            <p className="text-[14px]" style={{ color: 'rgba(235,235,245,0.7)' }}>{transcript}</p>
          </div>

          {/* 回答 */}
          <div className="rounded-2xl px-4 py-4"
            style={{ background: 'rgba(100,210,255,0.07)', border: '1px solid rgba(100,210,255,0.2)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: '#64D2FF' }}>AI 回答</p>
            <p className="text-[15px] leading-relaxed">{answer}</p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#1C1C1E', color: 'rgba(235,235,245,0.55)' }}>
              重新问
            </button>
            <button onClick={answerToTask}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#1C1C1E', color: '#30D158', border: '1px solid rgba(48,209,88,0.3)' }}>
              存为任务
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
