import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Commitment } from '../finance'
import { useDialogBehavior } from '../hooks/useDialogBehavior'

export default function AddCommitmentModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (c: Omit<Commitment, 'id'>) => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useDialogBehavior(dialogRef, true, onClose)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('250')
  const [day, setDay] = useState('18')
  const [kind, setKind] = useState<'bill' | 'subscription'>('bill')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.round(Number(amount)), d = Number(day)
    if (!name.trim()) { setError('Give the commitment a name.'); return }
    if (!Number.isFinite(n) || n <= 0) { setError('Enter an amount greater than ₹0.'); return }
    if (!Number.isInteger(d) || d < 1 || d > 30) { setError('Pick a due day between 1 and 30.'); return }
    onAdd({ name: name.trim(), amount: n, day: d, active: true, kind })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section className="sim-modal small-modal" role="dialog" aria-modal="true" aria-labelledby="add-commitment-title" ref={dialogRef} tabIndex={-1}>
        <div className="modal-top">
          <div>
            <div className="panel-kicker">PLAN AHEAD</div>
            <h2 id="add-commitment-title">Add a commitment</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="commitment-name">Name</label>
          <input id="commitment-name" className="text-input" value={name} onChange={e => setName(e.target.value)} required maxLength={50} placeholder="e.g. Internet bill" />
          <div className="form-row">
            <div>
              <label className="field-label" htmlFor="commitment-amount">Amount (₹)</label>
              <input id="commitment-amount" className="text-input" type="number" min="1" max="10000" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="commitment-day">Due day</label>
              <input id="commitment-day" className="text-input" type="number" min="1" max="30" inputMode="numeric" value={day} onChange={e => setDay(e.target.value)} required />
            </div>
          </div>
          <label className="field-label" htmlFor="commitment-kind">Type</label>
          <select id="commitment-kind" className="text-input" value={kind} onChange={e => setKind(e.target.value as 'bill' | 'subscription')}>
            <option value="bill">Bill / commitment</option>
            <option value="subscription">Subscription</option>
          </select>
          {error && <p className="preview-note negative" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button dark-primary"><Plus size={16} aria-hidden="true" /> Add commitment</button>
          </div>
        </form>
      </section>
    </div>
  )
}
