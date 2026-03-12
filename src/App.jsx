import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Record from './pages/Record'
import Tasks from './pages/Tasks'
import Translate from './pages/Translate'

function HomeIcon({ active }) {
  const c = active ? '#FF6B35' : 'rgba(255,255,255,0.3)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10L12 3L21 10V21H15V15H9V21H3V10Z"
        fill={active ? 'rgba(255,107,53,0.2)' : 'none'}
        stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function ListIcon({ active }) {
  const c = active ? '#FF6B35' : 'rgba(255,255,255,0.3)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5.5" width="18" height="2" rx="1" fill={c} />
      <rect x="3" y="11" width="18" height="2" rx="1" fill={c} />
      <rect x="3" y="16.5" width="12" height="2" rx="1" fill={c} />
    </svg>
  )
}

function GlobeIcon({ active }) {
  const c = active ? '#FF6B35' : 'rgba(255,255,255,0.3)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.25" stroke={c} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="3.5" ry="9.25" stroke={c} strokeWidth="1.5" />
      <line x1="2.75" y1="12" x2="21.25" y2="12" stroke={c} strokeWidth="1.5" />
      <line x1="4" y1="7.5" x2="20" y2="7.5" stroke={c} strokeWidth="1.3" />
      <line x1="4" y1="16.5" x2="20" y2="16.5" stroke={c} strokeWidth="1.3" />
    </svg>
  )
}

const tabs = [
  { path: '/', label: '首页', Icon: HomeIcon },
  { path: '/tasks', label: '事项', Icon: ListIcon },
  { path: '/translate', label: '翻译', Icon: GlobeIcon },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  if (location.pathname === '/record') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[430px] mx-auto">
        <div className="flex border-t"
          style={{
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTopColor: 'rgba(255,255,255,0.08)',
          }}>
          {tabs.map(({ path, label, Icon }) => {
            const active = location.pathname === path
            return (
              <button key={path}
                onClick={() => navigate(path)}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:opacity-60 transition-opacity">
                <Icon active={active} />
                <span className="text-[10px] font-medium tracking-wide"
                  style={{ color: active ? '#FF6B35' : 'rgba(255,255,255,0.3)' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.88)', height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/record" element={<Record />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/translate" element={<Translate />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
