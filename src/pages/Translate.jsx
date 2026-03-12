import { useState, useRef } from 'react'
import { transcribeAudio, translateText, parseTask } from '../lib/openai'
import { supabase } from '../lib/supabase'
import { MicIcon, RecDotIcon, ThinkIcon } from '../components/Icons'

const LISTEN_LANGS = [
  { key: 'en', label: 'EN', name: '英语', sub: '含口音也能识别' },
  { key: 'es-MX', label: 'ES', name: '西语', sub: '墨西哥口音' },
]
const SPEAK_LANGS = [
  { key: 'en', label: 'EN', name: '英语' },
  { key: 'es-MX', label: 'ES', name: '西语' },
]

export default function Translate() {
  const [mode, setMode] = useState('listen')
  const [listenLang, setListenLang] = useState('en')
  const [speakLang, setSpeakLang] = useState('en')
  const [recState, setRecState] = useState('idle')
  const [result, setResult] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [taskAdded, setTaskAdded] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  async function toggleRec() {
    if (recState === 'recording') {
      mediaRef.current?.stop()
      return
    }
    setResult(null)
    setTaskAdded(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecState('processing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const fromLang = mode === 'listen' ? listenLang : 'zh'
          const toLang = mode === 'listen' ? 'zh' : speakLang
          const text = await transcribeAudio(blob, fromLang)
          const translated = await translateText(text, fromLang, toLang)
          setResult({ original: text, translated, fromLang, toLang })
        } catch (e) {
          alert(e.message || '翻译失败，请重试')
        } finally {
          setRecState('idle')
        }
      }
      mediaRef.current = recorder
      recorder.start()
      setRecState('recording')
    } catch {
      alert('无法访问麦克风，请检查权限')
    }
  }

  async function translateTyped() {
    if (!textInput.trim()) return
    setRecState('processing')
    setResult(null)
    setTaskAdded(false)
    try {
      const fromLang = mode === 'listen' ? listenLang : 'zh'
      const toLang = mode === 'listen' ? 'zh' : speakLang
      const translated = await translateText(textInput, fromLang, toLang)
      setResult({ original: textInput, translated, fromLang, toLang })
    } catch (e) {
      alert(e.message)
    } finally {
      setRecState('idle')
    }
  }

  async function addAsTask() {
    if (!result || taskAdded) return
    const content = mode === 'listen' ? result.translated : result.original
    try {
      const p = await parseTask(content)
      await supabase.from('tasks').insert({
        content: p.content || content,
        category: p.category || '待办',
        store_id: p.store_id || null,
        priority: p.priority || 'medium',
        status: 'open',
        source: 'text',
        original_input: result.original,
      })
      setTaskAdded(true)
    } catch (e) {
      alert('加入失败：' + e.message)
    }
  }

  const isProcessing = recState === 'processing'
  const isRecording = recState === 'recording'

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f2f2f7' }}>

      <div className="px-6 pt-14 pb-5">
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: '#1c1c1e' }}>翻译</h1>
      </div>

      {/* 模式切换 */}
      <div className="px-6 mb-5">
        <div className="flex p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {[
            { key: 'listen', label: '听懂对方' },
            { key: 'speak', label: '我来表达' },
          ].map(m => (
            <button key={m.key}
              onClick={() => { setMode(m.key); setResult(null) }}
              className="flex-1 py-2 rounded-lg text-[14px] font-medium transition-all"
              style={{
                background: mode === m.key ? '#007aff' : 'transparent',
                color: mode === m.key ? '#fff' : '#8e8e93',
                boxShadow: mode === m.key ? '0 2px 8px rgba(0,122,255,0.3)' : 'none',
              }}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-center mt-2" style={{ color: '#8e8e93' }}>
          {mode === 'listen'
            ? (listenLang === 'en' ? '对方说英语（含口音）→ 你看中文意思' : '对方说西班牙语（墨西哥）→ 你看中文意思')
            : '你说中文，翻译给对方看'}
        </p>
      </div>

      {/* 语言选择 */}
      <div className="px-6 mb-6">
        {mode === 'listen' ? (
          <div className="flex gap-3">
            {LISTEN_LANGS.map(l => (
              <button key={l.key}
                onClick={() => { setListenLang(l.key); setResult(null) }}
                className="flex-1 py-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all"
                style={{
                  background: listenLang === l.key ? '#fff' : 'transparent',
                  border: listenLang === l.key
                    ? '1.5px solid rgba(0,122,255,0.4)'
                    : '1.5px solid rgba(0,0,0,0.08)',
                  boxShadow: listenLang === l.key ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
                  color: listenLang === l.key ? '#1c1c1e' : '#8e8e93',
                }}>
                <span className="text-[18px] font-bold" style={{ color: listenLang === l.key ? '#007aff' : '#8e8e93' }}>{l.label}</span>
                <span className="text-[14px] font-medium">{l.name}</span>
                <span className="text-[11px]" style={{ color: '#8e8e93' }}>{l.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3">
            {SPEAK_LANGS.map(l => (
              <button key={l.key}
                onClick={() => { setSpeakLang(l.key); setResult(null) }}
                className="flex-1 py-3.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all"
                style={{
                  background: speakLang === l.key ? '#fff' : 'transparent',
                  border: speakLang === l.key
                    ? '1.5px solid rgba(0,122,255,0.4)'
                    : '1.5px solid rgba(0,0,0,0.08)',
                  boxShadow: speakLang === l.key ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
                  color: speakLang === l.key ? '#1c1c1e' : '#8e8e93',
                }}>
                <span className="text-[18px] font-bold" style={{ color: speakLang === l.key ? '#007aff' : '#8e8e93' }}>{l.label}</span>
                <span className="text-[14px] font-medium">翻成{l.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 麦克风 */}
      <div className="flex flex-col items-center py-4">
        {isProcessing ? (
          <>
            <div className="w-24 h-24 rounded-full flex items-center justify-center animate-bounce"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <ThinkIcon size={40} color="#007aff" />
            </div>
            <p className="text-[14px] mt-4" style={{ color: '#8e8e93' }}>翻译中...</p>
          </>
        ) : isRecording ? (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full animate-ping"
                style={{ background: 'rgba(255,59,48,0.06)' }} />
              <div className="absolute w-32 h-32 rounded-full animate-pulse"
                style={{ background: 'rgba(255,59,48,0.1)' }} />
              <button onClick={toggleRec}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: '#ff3b30', boxShadow: '0 8px 32px rgba(255,59,48,0.35)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>
            <p className="text-[14px] mt-6" style={{ color: '#8e8e93' }}>
              {mode === 'listen' ? '让对方说，说完点停止' : '你来说，说完点停止'}
            </p>
            <button onClick={toggleRec}
              className="mt-4 px-10 py-3 rounded-2xl text-[15px] font-medium active:opacity-70"
              style={{ background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
              停止
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleRec}
              className="w-24 h-24 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #4da3ff, #007aff)',
                boxShadow: '0 0 0 14px rgba(0,122,255,0.08), 0 10px 36px rgba(0,122,255,0.3)',
              }}>
              <MicIcon size={32} color="#fff" />
            </button>
            <p className="text-[14px] mt-5" style={{ color: '#8e8e93' }}>
              {mode === 'listen' ? '点击，让对方开始说' : '点击，你来说中文'}
            </p>
          </>
        )}
      </div>

      {/* 分隔 */}
      <div className="flex items-center gap-4 px-6 my-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        <span className="text-[12px]" style={{ color: '#8e8e93' }}>或者打字</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
      </div>

      {/* 文字输入 */}
      <div className="px-6">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={mode === 'listen' ? '输入对方说的内容...' : '输入你想表达的中文...'}
            rows={3}
            className="w-full bg-transparent px-4 pt-4 pb-3 text-[15px] outline-none resize-none"
            style={{ color: '#1c1c1e' }}
          />
          {textInput.trim() && !isProcessing && (
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={translateTyped}
                className="w-full py-4 text-[15px] font-semibold active:opacity-60"
                style={{ color: '#007aff' }}>
                翻译 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 翻译结果 */}
      {result && !isProcessing && (
        <div className="px-6 mt-5">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            <div className="px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-1.5"
                style={{ color: '#8e8e93' }}>原文</p>
              <p className="text-[14px]" style={{ color: '#636366' }}>
                {result.original}
              </p>
            </div>

            <div className="px-4 pt-4 pb-5"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: '#007aff' }}>
                {mode === 'listen' ? '意思是' : '翻译（给对方看）'}
              </p>
              <p className="text-[22px] font-semibold leading-snug" style={{ color: '#1c1c1e' }}>{result.translated}</p>
            </div>

            <div className="flex" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={addAsTask} disabled={taskAdded}
                className="flex-1 py-3.5 text-[14px] font-medium text-center active:opacity-60"
                style={{
                  color: taskAdded ? '#8e8e93' : '#34c759',
                  borderRight: '1px solid rgba(0,0,0,0.06)',
                }}>
                {taskAdded ? '已加入事项' : '加入事项'}
              </button>
              <button onClick={() => { setResult(null); setTextInput('') }}
                className="flex-1 py-3.5 text-[14px] font-medium text-center active:opacity-60"
                style={{ color: '#8e8e93' }}>
                清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
