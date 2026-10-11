import { useRef } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import {
  money, type DecisionKind, type FinanceState, type Preview,
} from '../finance'
import { useDialogBehavior } from '../hooks/useDialogBehavior'

export const CATEGORIES = ['Food', 'Transport', 'Lifestyle', 'Shopping', 'Education', 'Health', 'Other']

const KIND_TABS: { key: DecisionKind; label: string; title: string }[] = [
  { key: 'purchase', label: 'Purchase', title: '' },
  { key: 'unexpected', label: 'Unexpected', title: 'Unexpected expense' },
  { key: 'saving', label: 'Save', title: 'Goal contribution' },
  { key: 'income', label: 'Income', title: 'Extra income' },
  { key: 'subscription', label: 'Recurring', title: 'New subscription' },
]

export interface SimState {
  kind: DecisionKind
  title: string
  amount: number
  category: string
  dueDay: number
}

interface SimulatorModalProps {
  state: FinanceState
  sim: SimState
  goalId: string | null
  preview: Preview
  submitting: boolean
  onChange: (patch: Partial<SimState>) => void
  onSelectGoal: (id: string) => void
  onClose: () => void
  onApply: () => void
}

export default function SimulatorModal({
  state, sim, goalId, preview, submitting, onChange, onSelectGoal, onClose, onApply,
}: SimulatorModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  useDialogBehavior(dialogRef, true, onClose)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section className="sim-modal" role="dialog" aria-modal="true" aria-labelledby="sim-title" ref={dialogRef} tabIndex={-1}>
        <div className="modal-top">
          <div>
            <div className="panel-kicker">THINK IT THROUGH</div>
            <h2 id="sim-title">What if you make<br />this money move?</h2>
          </div>
          <button className="icon-button" aria-label="Close simulator" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        </div>

        <div className="sim-type-tabs" role="tablist" aria-label="Decision type">
          {KIND_TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={sim.kind === tab.key}
              className={sim.kind === tab.key ? 'selected' : ''}
              onClick={() => onChange({ kind: tab.key, title: tab.title })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="field-label" htmlFor="sim-title-input">Give this decision a name</label>
        <input
          id="sim-title-input" className="text-input" value={sim.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder={sim.kind === 'purchase' ? 'e.g. Concert tickets' : 'What is this for?'}
          maxLength={60}
        />

        <label className="field-label" htmlFor="sim-amount-num">How much money? <strong>{money(Number(sim.amount) || 0)}</strong></label>
        <div className="amount-row">
          <input
            id="sim-amount-num" className="text-input" type="number" min={1} max={10000} step={1}
            inputMode="numeric" value={sim.amount} onChange={e => onChange({ amount: Number(e.target.value) })}
          />
          <input
            id="sim-amount" className="range-input" type="range" min="50" max="5000" step="50"
            value={Math.min(5000, Math.max(50, Number(sim.amount) || 50))}
            onChange={e => onChange({ amount: Number(e.target.value) })}
            aria-label="Amount slider"
          />
        </div>
        <div className="range-labels"><span>â‚¹50</span><span>â‚¹5,000 (type exact above)</span></div>

        {sim.kind === 'purchase' && <>
          <label className="field-label" htmlFor="sim-category">Spending category</label>
          <select id="sim-category" className="text-input" value={sim.category} onChange={e => onChange({ category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </>}
        {sim.kind === 'saving' && <>
          <label className="field-label" htmlFor="goal-select">Contribute to</label>
          <select id="goal-select" className="text-input" value={goalId ?? ''} onChange={e => onSelectGoal(e.target.value)}>
            {state.goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </>}
        {sim.kind === 'subscription' && <>
          <label className="field-label" htmlFor="sim-due">Due day (1â€“30)</label>
          <input
            id="sim-due" className="text-input" type="number" min={1} max={30} inputMode="numeric"
            value={sim.dueDay}
            onChange={e => onChange({ dueDay: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </>}

        <div className="sim-preview">
          <div className="sim-preview-title"><Sparkles size={15} aria-hidden="true" /> YOUR PREVIEW <span>NOT APPLIED YET</span></div>
          <div className="preview-metrics">
            <div>
              <span>New balance</span>
              <strong>{money(preview.after.available)}</strong>
              <small className={preview.after.available < preview.after.upcoming ? 'negative' : 'positive'}>
                {preview.after.available < preview.after.upcoming ? 'Below commitments' : 'Commitments covered'}
              </small>
            </div>
            <div>
              <span>Daily allowance</span>
              <strong>{money(preview.after.daily)}</strong>
              <small>Was {money(preview.before.daily)} Â· {preview.deltas.daily >= 0 ? '+' : ''}{money(preview.deltas.daily)}/day</small>
            </div>
            <div>
              <span>Month-end buffer</span>
              <strong>{money(preview.after.forecast)}</strong>
              <small>{preview.deltas.forecast >= 0 ? '+' : ''}{money(preview.deltas.forecast)} vs now</small>
            </div>
          </div>
          <p className="preview-note">{preview.headline}</p>
          {sim.kind === 'saving' && preview.deltas.goal != null &&
            <p className="preview-note">Goal progress: {money(preview.before.goalSaved ?? 0)} â†’ {money(preview.after.goalSaved ?? 0)}.</p>}
          {preview.blocksDecision && <p className="preview-note negative" role="alert">{preview.blocksDecision}</p>}
          {!preview.blocksDecision && preview.after.risk !== preview.before.risk &&
            <p className="preview-note">Risk moves from {preview.before.risk} â†’ {preview.after.risk}.</p>}
          {!preview.blocksDecision && preview.after.health !== preview.before.health &&
            <p className="preview-note">Health moves from {preview.before.health} â†’ {preview.after.health}.</p>}
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button
            className="primary-button dark-primary" onClick={onApply}
            disabled={submitting || preview.blocksDecision != null}
            aria-disabled={submitting || preview.blocksDecision != null}
          >
            {submitting ? 'Applyingâ€¦' : <><Check size={16} aria-hidden="true" /> Apply decision</>}
          </button>
        </div>
        <p className="modal-disclaimer">Demo mode Â· No bank account connected. You can reset sample data at any time.</p>
      </section>
    </div>
  )
}
