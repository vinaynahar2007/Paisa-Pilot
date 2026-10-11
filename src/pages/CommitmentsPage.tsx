import { CalendarDays, CreditCard, Plus, Zap } from 'lucide-react'
import { money, type FinanceState } from '../finance'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function CommitmentsPage({
  state, reserved, activeCount, onToggle, onAdd,
}: {
  state: FinanceState
  reserved: number
  activeCount: number
  onToggle: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="page-wrap inner-page">
      <PageHeader
        eyebrow="PLAN AHEAD, STAY EASY"
        titleStart="Future bills."
        titleHighlight="Zero surprises."
        copy="These are the things your future balance already has plans for."
      />
      <div className="commitment-banner">
        <div className="commitment-banner-icon" aria-hidden="true"><CalendarDays size={22} /></div>
        <div>
          <span>COMING UP · {state.commitments.filter(c => c.active && c.day >= state.day).length} ACTIVE ITEMS</span>
          <strong>{money(reserved)} <small>reserved</small></strong>
        </div>
        <div className="commitment-banner-side">Money reserved here is excluded from your safe-to-spend allowance.</div>
      </div>
      <div className="commitment-list">
        {state.commitments.map(c => (
          <div className={`panel commitment-item ${!c.active ? 'commitment-paused' : ''}`} key={c.id}>
            <div className={`commitment-icon ${c.kind}`} aria-hidden="true">
              {c.kind === 'bill' ? <CreditCard size={19} /> : <Zap size={19} />}
            </div>
            <div className="commitment-info">
              <strong>{c.name}</strong>
              <span>{c.kind === 'bill' ? 'Bill' : 'Subscription'} · Day {c.day}{c.day <= state.day ? ' · Due / passed' : ' · Upcoming'}</span>
            </div>
            <div className="commitment-amount">{money(c.amount)}<span>{c.active ? 'Included in forecast' : 'Paused'}</span></div>
            <button
              className={`toggle ${c.active ? 'toggle-on' : ''}`}
              role="switch"
              aria-checked={c.active}
              aria-label={`${c.active ? 'Pause' : 'Activate'} ${c.name}`}
              onClick={() => onToggle(c.id)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
      {state.commitments.length === 0 && (
        <EmptyState title="No commitments yet." hint="Add bills and subscriptions so your daily allowance stays accurate." />
      )}
      <button className="secondary-button add-commitment" onClick={onAdd}><Plus size={16} aria-hidden="true" /> Add a commitment</button>
      <p className="sr-only" aria-live="polite">{activeCount} active commitments</p>
    </div>
  )
}
