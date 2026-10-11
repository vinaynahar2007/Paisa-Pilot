import { Bell, Menu } from 'lucide-react'
import type { PageLabel } from './Sidebar'

interface TopbarProps {
  page: PageLabel
  day: number
  onOpenNav: () => void
  onNotifications: () => void
}

export default function Topbar({ page, day, onOpenNav, onNotifications }: TopbarProps) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        aria-label="Open navigation"
        aria-expanded="false"
        aria-controls="app-sidebar"
        onClick={onOpenNav}
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        Money space <span aria-hidden="true">/</span> <strong aria-current="page">{page}</strong>
      </nav>
      <div className="topbar-right">
        <div className="day-pill">
          <span className="live-dot" aria-hidden="true" />
          <span>DAY {String(day).padStart(2, '0')}</span>
          <span className="day-divider" aria-hidden="true" />30
        </div>
        <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}>
          <Bell size={18} aria-hidden="true" /><i aria-hidden="true" />
        </button>
        <div className="top-avatar" aria-hidden="true">A</div>
      </div>
    </header>
  )
}
