import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isLoggedIn } from './lib/auth'
import Login from './pages/Login'
import Home from './pages/Home'
import Record from './pages/Record'
import Tasks from './pages/Tasks'
import Translate from './pages/Translate'
import Health from './pages/Health'
import LogExercise from './pages/LogExercise'
import LogMeal from './pages/LogMeal'

function HomeIcon({ active }) {
  const c = active ? '#007aff' : '#8e8e93'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10L12 3L21 10V21H15V15H9V21H3V10Z"
        fill={active ? 'rgba(0,122,255,0.12)' : 'none'}
        stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function ListIcon({ active }) {
  const c = active ? '#007aff' : '#8e8e93'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5.5" width="18" height="2" rx="1" fill={c} />
      <rect x="3" y="11" width="18" height="2" rx="1" fill={c} />
      <rect x="3" y="16.5" width="12" height="2" rx="1" fill={c} />
    </svg>
  )
}

function GlobeIcon({ active }) {
  const c = active ? '#007aff' : '#8e8e93'
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

function HeartNavIcon({ active }) {
  const c = active ? '#007aff' : '#8e8e93'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        fill={active ? 'rgba(0,122,255,0.12)' : 'none'}
        stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

const tabs = [
  { path: '/', label: '首页', Icon: HomeIcon },
  { path: '/tasks', label: '事项', Icon: ListIcon },
  { path: '/translate', label: '翻译', Icon: GlobeIcon },
  { path: '/health', label: '健康', Icon: HeartNavIcon },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const hiddenPaths = ['/login', '/record', '/health/exercise', '/health/meal']
  if (hiddenPaths.includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[480px] mx-auto">
        <div className="flex border-t"
          style={{
            background: 'rgba(242,242,247,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTopColor: 'rgba(0,0,0,0.08)',
          }}>
          {tabs.map((tab) => {
            const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path)
            const TabIcon = tab.Icon
            return (
              <button key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:opacity-60 transition-opacity">
                <TabIcon active={active} />
                <span className="text-[10px] font-medium tracking-wide"
                  style={{ color: active ? '#007aff' : '#8e8e93' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ background: 'rgba(242,242,247,0.92)', height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </nav>
  )
}

function RequireAuth({ children }) {
  const location = useLocation()
  if (!isLoggedIn()) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/record" element={<RequireAuth><Record /></RequireAuth>} />
        <Route path="/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
        <Route path="/translate" element={<RequireAuth><Translate /></RequireAuth>} />
        <Route path="/health" element={<RequireAuth><Health /></RequireAuth>} />
        <Route path="/health/exercise" element={<RequireAuth><LogExercise /></RequireAuth>} />
        <Route path="/health/meal" element={<RequireAuth><LogMeal /></RequireAuth>} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
