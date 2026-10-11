import { Lightbulb, Plus, Target } from 'lucide-react'
import { money, type DecisionKind, type FinanceState } from '../finance'
import PageHeader from '../components/PageHeader'

export default function GoalsPage({
  state, onSimulate,
}: {
  state: FinanceState
  onSimulate: (kind: DecisionKind, title: string, amount: number, goalId: string) => void
}) {
  return (
    <div className="page-wrap inner-page">
      <PageHeader
        eyebrow="FUTURE YOU SAYS THANKS"
        titleStart="Make room for"
        titleHighlight="what matters."
        copy="Small, consistent contributions add up. See what your next move could do."
      />
      <div className="goal-page-grid">
        {state.goals.map(g => (
          <div className="panel goal-detail" key={g.id}>
            <div className="goal-detail-top">
              <div className="goal-icon large" style={{ background: g.color }} aria-hidden="true"><Target size={23} /></div>
              <span className="goal-percent">{Math.round(g.saved / g.target * 100)}% there</span>
            </div>
            <h2>{g.name}</h2>
            <p>Keep this goal moving without putting your essentials at risk.</p>
            <div className="goal-big-number">{money(g.saved)} <span>of {money(g.target)}</span></div>
            <div className="goal-track big-track" role="img" aria-label={`${g.name}: ${money(g.saved)} of ${money(g.target)} saved`}>
              <span style={{ width: `${Math.min(100, g.saved / g.target * 100)}%`, background: g.color }} />
            </div>
            <div className="goal-detail-foot"><span>Still to go</span><strong>{money(Math.max(0, g.target - g.saved))}</strong></div>
            <button
              className="primary-button dark-primary full-width"
              onClick={() => onSimulate('saving', `Contribution · ${g.name}`, 200, g.id)}
            >
              <Plus size={16} aria-hidden="true" /> Add contribution
            </button>
          </div>
        ))}
      </div>
      <div className="panel goal-note">
        <Lightbulb size={20} aria-hidden="true" />
        <div>
          <strong>Protect the emergency cushion first.</strong>
          <p>Your emergency goal gives you options when life gets unpredictable. Build it steadily, but don't move money into savings that you need for bills due this month.</p>
        </div>
      </div>
    </div>
  )
}
