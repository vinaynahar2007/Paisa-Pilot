import { Flame, Sparkles } from 'lucide-react'
import { TOTAL_DAYS, longestStreak, money, noSpendDays, type FinanceState } from '../finance'

/**
 * Challenge Pace — a lightweight 30-day spending-pace visualiser.
 * Shows which days had zero spending, the current no-spend streak,
 * and how the user's average spend compares to the implied daily budget.
 */
export default function PacePanel({ state }: { state: FinanceState }) {
  const noSpend = noSpendDays(state)
  const streak = longestStreak(noSpend)
  const expenseDays = new Set(
    state.transactions.filter(t => t.kind === 'expense').map(t => t.day),
  )
  const totalTarget = state.transactions
    .filter(t => t.kind === 'income')
    .reduce((a, t) => a + t.amount, 0)
  const spentSoFar = state.transactions
    .filter(t => t.kind === 'expense')
    .reduce((a, t) => a + t.amount, 0)
  const dailyBudget = totalTarget / TOTAL_DAYS
  const avgPerElapsedDay = spentSoFar / Math.max(1, state.day)
  const paceDelta = dailyBudget - avgPerElapsedDay
  const paceTone = paceDelta >= 50 ? 'ahead' : paceDelta <= -50 ? 'behind' : 'even'

  return (
    <section className="panel pace-panel" aria-labelledby="pace-title">
      <div className="panel-head compact-head">
        <div>
          <div className="panel-kicker">30-DAY CHALLENGE PACE</div>
          <h2 id="pace-title">No-spend days</h2>
        </div>
        <div className="pace-score" aria-label={`${noSpend.length} no-spend days so far`}>
          <Flame size={16} aria-hidden="true" />
          <strong>{noSpend.length}</strong>
        </div>
      </div>
      <div className="pace-strip" role="img"
        aria-label={`Day-by-day spending from day 1 to day ${state.day}: ${noSpend.length} no-spend days`}>
        {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(d => {
          const cls = d > state.day ? 'future' : expenseDays.has(d) ? 'spent' : 'free'
          return <span key={d} className={`pace-cell ${cls}`} title={`Day ${d}: ${cls === 'free' ? 'no spending' : cls === 'spent' ? 'spent' : 'not yet'}`} />
        })}
      </div>
      <div className="pace-legend" aria-hidden="true">
        <span><i className="pace-dot free" />No spend</span>
        <span><i className="pace-dot spent" />Spent</span>
        <span><i className="pace-dot future" />Upcoming</span>
      </div>
      <p className="pace-note">
        {streak > 0
          ? <><strong>{streak}-day streak</strong> of no spending — keep it going.</>
          : <>One no-spend day starts a streak. Tomorrow counts.</>}
      </p>
      <p className={`pace-verdict ${paceTone}`}>
        <Sparkles size={13} aria-hidden="true" />
        {paceTone === 'ahead'
          ? `You're averaging ${money(avgPerElapsedDay)}/day — under your ${money(dailyBudget)}/day plan by ${money(paceDelta)}.`
          : paceTone === 'behind'
            ? `You're averaging ${money(avgPerElapsedDay)}/day — ${money(-paceDelta)} above your ${money(dailyBudget)}/day plan. Ease off.`
            : `Right on pace with your ${money(dailyBudget)}/day plan.`}
      </p>
    </section>
  )
}
