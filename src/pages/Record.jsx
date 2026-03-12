import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { transcribeAudio, parseTask } from '../lib/openai'
import { supabase } from '../lib/supabase'
import {
  CatIcon, MicIcon, RecDotIcon, EarIcon, ListIcon, SearchIcon, ThinkIcon,
} from '../components/Icons'

const CATEGORIES = ['待办', '待回复', '新店', '排班', '进货', '做账', '异常']

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
  const parsePrefetchRef = useRef(null)
  const navigate = useNavigate()

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

  function handleTextChoice() {
    if (!textInput.trim()) return
    setTranscript(textInput)
    parsePrefetchRef.current = fetchParse(textInput)
    setMode('choice')
  }

  async function goRecord() {
    setMode('parsing')
    setError('')
    try {
      const result = await parsePrefetchRef.current
      setParsed(result)
      setMode('preview')
    } catch (e) {
      setError(e.message || '解析失败，请重试')
      setMode('choice')
    }
  }

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

  async function answerToTask() {
    const result = await fetchParse(transcript)
    setParsed(result)
    setMode('preview')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f2f2f7' }}>

      {/* 导航 */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 active:opacity-50 transition-opacity"
          style={{ color: '#007aff' }}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px]">返回</span>
        </button>
        <h1 className="text-[17px] font-semibold absolute left-1/2 -translate-x-1/2"
          style={{ color: '#1c1c1e' }}>
          {mode === 'answer' ? '问一下' : '说一件事'}
        </h1>
      </div>

      {/* IDLE */}
      {mode === 'idle' && (
        <div className="px-6 flex flex-col gap-6 pb-10">
          <div className="flex flex-col items-center py-8">
            <button onClick={toggleRecording}
              className="w-32 h-32 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #4da3ff, #007aff)',
                boxShadow: '0 0 0 16px rgba(0,122,255,0.08), 0 12px 40px rgba(0,122,255,0.3)',
              }}>
              <MicIcon size={40} color="#fff" />
            </button>
            <p className="text-[14px] mt-5" style={{ color: '#8e8e93' }}>
              点击说话，说完自己选：记录 or 问一下
            </p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <span className="text-[13px]" style={{ color: '#8e8e93' }}>或者打字</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
              placeholder="想记录什么，或者想问什么都行..."
              rows={4}
              className="w-full bg-transparent px-4 pt-4 pb-3 text-[15px] outline-none resize-none"
              style={{ color: '#1c1c1e' }} />
            {textInput.trim() && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={handleTextChoice}
                  className="w-full py-4 text-[15px] font-semibold active:opacity-60"
                  style={{ color: '#007aff' }}>
                  继续 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORDING */}
      {mode === 'recording' && (
        <div className="flex flex-col items-center justify-center py-20 gap-8">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-48 h-48 rounded-full animate-ping"
              style={{ background: 'rgba(255,59,48,0.06)' }} />
            <div className="absolute w-36 h-36 rounded-full animate-pulse"
              style={{ background: 'rgba(255,59,48,0.1)' }} />
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: '#ff3b30', boxShadow: '0 8px 32px rgba(255,59,48,0.35)' }}>
              <RecDotIcon size={28} color="#fff" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-semibold" style={{ color: '#1c1c1e' }}>正在录音...</p>
            <p className="text-[14px] mt-1" style={{ color: '#8e8e93' }}>说完了点停止</p>
          </div>
          <button onClick={toggleRecording}
            className="px-12 py-4 rounded-2xl text-[16px] font-semibold active:opacity-70"
            style={{ background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
            停止
          </button>
        </div>
      )}

      {/* TRANSCRIBING */}
      {mode === 'transcribing' && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-pulse">
            <EarIcon size={56} color="#007aff" />
          </div>
          <p className="text-[18px] font-semibold" style={{ color: '#1c1c1e' }}>正在识别...</p>
        </div>
      )}

      {/* CHOICE */}
      {mode === 'choice' && (
        <div className="px-6 flex flex-col gap-5 pb-10">
          <div className="rounded-2xl px-4 py-4"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: '#8e8e93' }}>你说的</p>
            <p className="text-[16px] leading-relaxed" style={{ color: '#1c1c1e' }}>{transcript}</p>
          </div>

          <p className="text-[13px] text-center" style={{ color: '#8e8e93' }}>
            这句话你想做什么？
          </p>

          <button onClick={goRecord}
            className="w-full py-5 rounded-2xl text-[17px] font-semibold active:scale-[0.97] transition-transform text-white flex items-center justify-center gap-2"
            style={{ background: '#007aff', boxShadow: '0 8px 28px rgba(0,122,255,0.3)' }}>
            <ListIcon size={20} color="#fff" /> 记录下来
          </button>

          <button onClick={goAsk}
            className="w-full py-5 rounded-2xl text-[17px] font-semibold active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', color: '#1c1c1e' }}>
            <SearchIcon size={20} color="#007aff" /> 问一下 AI
          </button>

          <button onClick={reset}
            className="w-full py-3 text-[14px] active:opacity-50"
            style={{ color: '#8e8e93' }}>
            重新说
          </button>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
          )}
        </div>
      )}

      {/* PARSING / ASKING */}
      {(mode === 'parsing' || mode === 'asking') && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-bounce">
            {mode === 'parsing'
              ? <ThinkIcon size={56} color="#007aff" />
              : <SearchIcon size={56} color="#007aff" />}
          </div>
          <p className="text-[18px] font-semibold" style={{ color: '#1c1c1e' }}>
            {mode === 'parsing' ? '整理中...' : 'AI 查询中...'}
          </p>
        </div>
      )}

      {/* PREVIEW */}
      {mode === 'preview' && parsed && (
        <div className="px-6 pb-10 space-y-4">
          <div className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
              style={{ color: '#007aff' }}>你说的</p>
            <p className="text-[14px] italic" style={{ color: '#636366' }}>
              "{transcript}"
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            <div className="px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: '#8e8e93' }}>任务内容</p>
              <input value={parsed.content}
                onChange={e => setParsed({ ...parsed, content: e.target.value })}
                className="w-full bg-transparent text-[15px] outline-none" style={{ color: '#1c1c1e' }} />
            </div>

            <div className="px-4 py-3"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2.5"
                style={{ color: '#8e8e93' }}>分类</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setParsed({ ...parsed, category: cat })}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1"
                    style={{
                      background: parsed.category === cat ? 'rgba(0,122,255,0.12)' : '#f2f2f7',
                      color: parsed.category === cat ? '#007aff' : '#636366',
                      border: parsed.category === cat ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                    }}>
                    <CatIcon category={cat} size={14} color={parsed.category === cat ? '#007aff' : '#636366'} /> {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="px-4 py-3"
                style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#8e8e93' }}>门店</p>
                <select value={parsed.store_id || ''}
                  onChange={e => setParsed({ ...parsed, store_id: e.target.value || null })}
                  className="w-full bg-transparent text-[14px] outline-none appearance-none"
                  style={{ color: '#1c1c1e' }}>
                  <option value="">两家都有</option>
                  <option value="store1">第一家</option>
                  <option value="store2">新店</option>
                </select>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#8e8e93' }}>紧急程度</p>
                <select value={parsed.priority || 'medium'}
                  onChange={e => setParsed({ ...parsed, priority: e.target.value })}
                  className="w-full bg-transparent text-[14px] outline-none appearance-none"
                  style={{ color: '#1c1c1e' }}>
                  <option value="high">紧急</option>
                  <option value="medium">普通</option>
                  <option value="low">不急</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[15px]" style={{ color: '#1c1c1e' }}>需要回复 / 跟进</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer"
                  checked={parsed.needs_followup || false}
                  onChange={e => setParsed({ ...parsed, needs_followup: e.target.checked })} />
                <div className="w-11 h-6 rounded-full transition-colors peer-checked:bg-accent relative"
                  style={{ background: 'rgba(0,0,0,0.1)' }}>
                  <div className="absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#fff', color: '#636366', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              重录
            </button>
            <button onClick={saveTask} disabled={saving}
              className="flex-[2] py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform text-white"
              style={{
                background: saving ? '#b0b0b0' : '#007aff',
                boxShadow: saving ? 'none' : '0 6px 24px rgba(0,122,255,0.3)',
              }}>
              {saving ? '保存中...' : '存进去'}
            </button>
          </div>
        </div>
      )}

      {/* ANSWER */}
      {mode === 'answer' && (
        <div className="px-6 pb-10 space-y-4">
          <div className="rounded-2xl px-4 py-3"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1"
              style={{ color: '#8e8e93' }}>你问的</p>
            <p className="text-[14px]" style={{ color: '#636366' }}>{transcript}</p>
          </div>

          <div className="rounded-2xl px-4 py-4"
            style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: '#007aff' }}>AI 回答</p>
            <p className="text-[15px] leading-relaxed" style={{ color: '#1c1c1e' }}>{answer}</p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
              style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#fff', color: '#636366', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              重新问
            </button>
            <button onClick={answerToTask}
              className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
              style={{ background: '#fff', color: '#34c759', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(52,199,89,0.25)' }}>
              存为任务
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
