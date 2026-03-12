import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeFood, compressImage } from '../lib/health'
import { supabase } from '../lib/supabase'
import { CameraIcon } from '../components/Icons'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐', '其他']

export default function LogMeal() {
  const [preview, setPreview] = useState(null) // base64
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [mealType, setMealType] = useState('其他')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const navigate = useNavigate()

  // 根据当前时间自动推测餐次
  function guessMealType() {
    const h = new Date().getHours()
    if (h >= 5 && h < 10) return '早餐'
    if (h >= 10 && h < 14) return '午餐'
    if (h >= 17 && h < 21) return '晚餐'
    return '加餐'
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setAnalyzing(true)
    setMealType(guessMealType())

    try {
      const base64 = await compressImage(file)
      setPreview(base64)
      const data = await analyzeFood(base64)
      setResult(data)
    } catch (err) {
      setError(err.message || '识别失败')
    } finally {
      setAnalyzing(false)
    }
  }

  function updateField(field, value) {
    setResult(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    if (!result || saving) return
    setSaving(true)
    setError('')

    try {
      const { error: dbError } = await supabase.from('meals').insert({
        name: result.name,
        photo_url: preview,
        portion: result.portion || null,
        calories: parseInt(result.calories) || 0,
        protein_g: parseFloat(result.protein_g) || 0,
        carbs_g: parseFloat(result.carbs_g) || 0,
        fat_g: parseFloat(result.fat_g) || 0,
        meal_type: mealType,
        ai_raw: result,
        source: 'photo',
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
          style={{ color: '#1c1c1e' }}>拍一餐</h1>
      </div>

      <div className="px-6 flex flex-col gap-5 pb-10">

        {/* 拍照/选图 */}
        {!preview && !analyzing && (
          <div className="flex flex-col items-center py-10 gap-5">
            <button onClick={() => fileRef.current?.click()}
              className="w-32 h-32 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ffb347, #ff9500)',
                boxShadow: '0 0 0 16px rgba(255,149,0,0.08), 0 12px 40px rgba(255,149,0,0.3)',
              }}>
              <CameraIcon size={40} color="#fff" />
            </button>
            <p className="text-[14px]" style={{ color: '#8e8e93' }}>拍照或选择一张食物照片</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={handleFile} className="hidden" />
          </div>
        )}

        {/* 分析中 */}
        {analyzing && (
          <div className="flex flex-col items-center py-10 gap-4">
            {preview && (
              <img src={preview} alt="food" className="w-48 h-48 rounded-2xl object-cover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
            )}
            <div className="animate-bounce">
              <CameraIcon size={48} color="#ff9500" />
            </div>
            <p className="text-[18px] font-semibold" style={{ color: '#1c1c1e' }}>AI 识别中...</p>
          </div>
        )}

        {/* 结果编辑 */}
        {result && !analyzing && (
          <>
            {/* 照片预览 */}
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="food" className="w-48 h-48 rounded-2xl object-cover"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
              </div>
            )}

            {/* 名称 + 份量 */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#8e8e93' }}>食物名称</p>
                <input value={result.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: '#1c1c1e' }} />
              </div>
              <div className="px-4 pt-3 pb-3">
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#8e8e93' }}>份量</p>
                <input value={result.portion || ''}
                  onChange={e => updateField('portion', e.target.value)}
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: '#1c1c1e' }} />
              </div>
            </div>

            {/* 营养信息 */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="grid grid-cols-2">
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: '#8e8e93' }}>热量 (kcal)</p>
                  <input type="number" value={result.calories}
                    onChange={e => updateField('calories', e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold outline-none"
                    style={{ color: '#ff9500' }} />
                </div>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: '#8e8e93' }}>蛋白质 (g)</p>
                  <input type="number" step="0.1" value={result.protein_g}
                    onChange={e => updateField('protein_g', e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold outline-none"
                    style={{ color: '#1c1c1e' }} />
                </div>
                <div className="px-4 py-3" style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: '#8e8e93' }}>碳水 (g)</p>
                  <input type="number" step="0.1" value={result.carbs_g}
                    onChange={e => updateField('carbs_g', e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold outline-none"
                    style={{ color: '#1c1c1e' }} />
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: '#8e8e93' }}>脂肪 (g)</p>
                  <input type="number" step="0.1" value={result.fat_g}
                    onChange={e => updateField('fat_g', e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold outline-none"
                    style={{ color: '#1c1c1e' }} />
                </div>
              </div>
            </div>

            {/* 餐次选择 */}
            <div className="rounded-2xl px-4 py-4"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-3"
                style={{ color: '#8e8e93' }}>餐次</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(t => (
                  <button key={t} onClick={() => setMealType(t)}
                    className="px-4 py-2 rounded-full text-[14px] font-medium transition-all"
                    style={{
                      background: mealType === t ? 'rgba(255,149,0,0.12)' : '#f2f2f7',
                      color: mealType === t ? '#ff9500' : '#636366',
                      border: mealType === t ? '1px solid rgba(255,149,0,0.3)' : '1px solid transparent',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 重新拍 + 保存 */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setResult(null); setPreview(null); setError('') }}
                className="flex-1 py-4 rounded-2xl text-[15px] font-medium active:opacity-60"
                style={{ background: '#fff', color: '#636366', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                重拍
              </button>
              <button onClick={save} disabled={saving}
                className="flex-[2] py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform text-white"
                style={{
                  background: saving ? '#b0b0b0' : '#ff9500',
                  boxShadow: saving ? 'none' : '0 6px 24px rgba(255,149,0,0.3)',
                }}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </>
        )}

        {/* 错误 */}
        {error && (
          <div className="rounded-2xl px-4 py-3 text-[14px] text-center"
            style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30' }}>{error}</div>
        )}
      </div>
    </div>
  )
}
