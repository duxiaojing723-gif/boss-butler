// 统一扁平化线条 SVG 图标库
// 所有图标默认 20x20，stroke 风格，颜色通过 color prop 控制

function I({ children, size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

// 📌 图钉 — 待办
export function PinIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14" />
      <path d="M6 12V9a6 6 0 0 1 12 0v3" />
      <path d="M6 12h12l-1 5H7l-1-5z" stroke={color} fill="none" />
    </I>
  )
}

// 📞 电话 — 待回复
export function PhoneIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </I>
  )
}

// 🏗️ 施工 — 新店
export function BuildIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M2 20h20" />
      <path d="M5 20V8l7-5 7 5v12" />
      <rect x="9" y="13" width="6" height="7" />
      <line x1="12" y1="3" x2="12" y2="8" />
    </I>
  )
}

// 👥 人群 — 排班
export function PeopleIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.83" />
    </I>
  )
}

// 📦 箱子 — 进货
export function BoxIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M21 8L12 2 3 8v8l9 6 9-6V8z" />
      <line x1="12" y1="22" x2="12" y2="12" />
      <polyline points="3 8 12 14 21 8" />
    </I>
  )
}

// 💰 钱 — 做账
export function CoinIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M9 9.5a2.5 2.5 0 0 1 2.5-2h1a2.5 2.5 0 0 1 0 5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 0 2.5-2" />
    </I>
  )
}

// ⚠️ 警告 — 异常
export function AlertIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </I>
  )
}

// ✓ 勾选 — 新建任务
export function CheckIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </I>
  )
}

// 📋 清单 — 查看事项
export function ListIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </I>
  )
}

// 📝 笔记 — 记一笔
export function NoteIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </I>
  )
}

// 🌐 地球 — 翻译
export function GlobeIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </I>
  )
}

// ✨ 闪光 — 空状态
export function SparkleIcon({ size = 48, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
      <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </I>
  )
}

// 📭 空邮箱 — 无事项
export function EmptyBoxIcon({ size = 48, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
      <line x1="3" y1="7" x2="9" y2="12" />
      <line x1="21" y1="7" x2="15" y2="12" />
    </I>
  )
}

// 🏠 房子 — 门店
export function HouseIcon({ size = 14, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M3 10L12 3l9 7v11H3V10z" />
      <rect x="9" y="14" width="6" height="7" />
    </I>
  )
}

// 📅 日历 — 日期
export function CalendarIcon({ size = 14, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </I>
  )
}

// 🔴 录音中 — 红点
export function RecDotIcon({ size = 28, color = '#fff', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="6" fill={color} />
    </svg>
  )
}

// 👂 耳朵 — 正在识别
export function EarIcon({ size = 48, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M6 12a6 6 0 0 1 12 0c0 3-2 5-2 8" />
      <path d="M6 12c0-4.42 2.69-8 6-8s6 3.58 6 8" />
      <circle cx="12" cy="20" r="1" fill={color} stroke="none" />
    </I>
  )
}

// 🔍 搜索 — 问AI
export function SearchIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </I>
  )
}

// 🤔 思考 — 处理中
export function ThinkIcon({ size = 48, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </I>
  )
}

// 👔 衣服 — 穿搭建议
export function ShirtIcon({ size = 14, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M7 2l-5 4 2 3 3-2v15h10V7l3 2 2-3-5-4-2.5 2h-5L7 2z" />
    </I>
  )
}

// ☂️ 雨伞 — 下雨提醒
export function UmbrellaIcon({ size = 14, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M12 2v1" />
      <path d="M4.93 10A8 8 0 0 1 12 3a8 8 0 0 1 7.07 7H4.93z" />
      <line x1="12" y1="10" x2="12" y2="19" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </I>
  )
}

// 🌙 月亮 — 晚间提醒
export function MoonIcon({ size = 14, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </I>
  )
}

// 麦克风（白色，用于录音按钮）
export function MicIcon({ size = 40, color = '#fff', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// 心 — 健康导航
export function HeartIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </I>
  )
}

// 跑步 — 记运动
export function RunIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <circle cx="13" cy="4" r="2" />
      <path d="M7 21l3-7 2.5 2V21" />
      <path d="M16 21l-2-5-3.5-1-1.5-4 4-2 3 3 3 1" />
    </I>
  )
}

// 相机 — 拍一餐
export function CameraIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </I>
  )
}

// 火焰 — 卡路里
export function FlameIcon({ size, color, className }) {
  return (
    <I size={size} color={color} className={className}>
      <path d="M12 22c-4.97 0-7-3.58-7-7 0-4 3-7.5 4-10.5 1 3.5 3 5 5 7 0-2.5-.5-5-1-7.5C16 7 19 11 19 15c0 3.42-2.03 7-7 7z" />
    </I>
  )
}

// 分类图标映射 — 返回 JSX 组件
const CAT_ICONS = {
  '待办': PinIcon,
  '待回复': PhoneIcon,
  '新店': BuildIcon,
  '排班': PeopleIcon,
  '进货': BoxIcon,
  '做账': CoinIcon,
  '异常': AlertIcon,
}

export function CatIcon({ category, size = 18, color = '#636366' }) {
  const Comp = CAT_ICONS[category] || PinIcon
  return <Comp size={size} color={color} />
}
