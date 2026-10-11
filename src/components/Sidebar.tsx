import { forwardRef } from 'react'
import { Activity, ArrowUpRight, CalendarDays, LayoutDashboard, MoreHorizontal, Sparkles, Target, Wallet, X, type LucideIcon } from 'lucide-react'

export type PageLabel = 'Overview' | 'Transactions' | 'Goals & savings' | 'Commitments'

export const NAV_ITEMS: { label: PageLabel; icon: LucideIcon }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Transactions', icon: Activity },
  { label: 'Goals & savings', icon: Target },
  { label: 'Commitments', icon: CalendarDays },
]

interface SidebarProps {
  page: PageLabel
  activeCommitments: number
  open: boolean
  onNavigate: (page: PageLabel) => void
  onClose: () => void
  onTryMove: () => void
  onReset: () => void
  onProfileInfo: () => void
}

export default forwardRef<HTMLElement, SidebarProps>(function Sidebar({
  page, activeCommitments, open, onNavigate, onClose, onTryMove, onReset, onProfileInfo,
}, ref) {
  return (
    <aside ref={ref} className={`sidebar ${open ? 'sidebar-open' : ''}`} id="app-sidebar" tabIndex={-1}>
      <div className="brand">
        <div className="brand-mark"><Wallet size={21} aria-hidden="true" /></div>
        <span>paisa<span className="brand-light"> pilot</span></span>
        <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="workspace-label">YOUR MONEY SPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${page === label ? 'active' : ''}`}
            aria-current={page === label ? 'page' : undefined}
            onClick={() => onNavigate(label)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {label === 'Commitments' && <span className="nav-count">{activeCommitments}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip">
        <div className="tip-icon"><Sparkles size={17} aria-hidden="true" /></div>
        <div className="tip-title">Small moves. Big future.</div>
        <p>Your money has a plan. You're in control of it.</p>
        <button onClick={onTryMove}>Try a money move <ArrowUpRight size={14} aria-hidden="true" /></button>
      </div>
      <button className="nav-item reset-link" onClick={onReset}>
        <Activity size={17} aria-hidden="true" /><span>Reset demo data</span>
      </button>
      <div className="sidebar-footer">
        <div className="avatar" aria-hidden="true">A</div>
        <div className="profile-text"><strong>Alex Morgan</strong><span>Budget explorer</span></div>
        <button className="icon-button subtle" aria-label="More profile options" onClick={onProfileInfo}>
          <MoreHorizontal size={19} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
})
