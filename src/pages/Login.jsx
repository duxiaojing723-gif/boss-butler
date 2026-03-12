import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (login(username, password)) {
      navigate('/', { replace: true })
    } else {
      setError('用户名或密码错误')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#f2f2f7' }}>

      <div className="w-full max-w-[360px]">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[18px] mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(0,122,255,0.12)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#007aff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 className="text-[1.5rem] font-bold text-[#1c1c1e] tracking-tight">单单的小助理</h1>
          <p className="text-[14px] text-[#8e8e93] mt-1">登录后开始使用</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}
          className={`rounded-2xl overflow-hidden ${shaking ? 'animate-shake' : ''}`}
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: '#8e8e93' }}>用户名</p>
            <input value={username} onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-transparent text-[16px] outline-none"
              style={{ color: '#1c1c1e' }}
              placeholder="请输入用户名" />
          </div>
          <div className="px-4 pt-3 pb-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: '#8e8e93' }}>密码</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-transparent text-[16px] outline-none"
              style={{ color: '#1c1c1e' }}
              placeholder="请输入密码" />
          </div>
        </form>

        {error && (
          <p className="text-[14px] text-center mt-3" style={{ color: '#ff3b30' }}>{error}</p>
        )}

        <button onClick={handleSubmit}
          className="w-full mt-5 py-4 rounded-2xl text-[16px] font-semibold active:scale-[0.98] transition-transform text-white"
          style={{ background: '#007aff', boxShadow: '0 6px 24px rgba(0,122,255,0.3)' }}>
          登录
        </button>
      </div>
    </div>
  )
}
