import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, CircleHelp, Gauge, Lightbulb, PiggyBank, Plus, ShieldCheck, Sparkles, Target, TrendingUp, Wallet, Zap } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { money, type DecisionKind, type FinanceState, type HealthReport, type RiskLevel } from '../finance'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
import PacePanel from '../components/PacePanel'
import TransactionRow from '../components/TransactionRow'

const ForecastChart = lazy(() => import('../components/ForecastChart'))

export interface OverviewStats {
  income: number; spent: number; saved: number; savingsTransfers: number; balance: number
  remainingDays: number; commitments: number; spendable: number; daily: number
  forecast: number; expectedDaily: number; usedBaseline: boolean
  risk: RiskLevel; healthReport: HealthReport
}

interface OverviewPageProps {
  state: FinanceState
  stats: OverviewStats
  recentTx: FinanceState['transactions']
  onSimulate: (kind: DecisionKind, title: string, amount: number) => void
  onAddIncome: () => void
  onAllowanceInfo: () => void
  onForecastInfo: () => void
  onGoCommitments: () => void
  onGoTransactions: () => void
  onAddGoal: (goalId: string | null) => void
}

export default function OverviewPage({
  state, stats, recentTx, onSimulate, onAddIncome, onAllowanceInfo,
  onForecastInfo, onGoCommitments, onGoTransactions, onAddGoal,
}: OverviewPageProps) {
  const totalGoalTarget = state.goals.reduce((s, g) => s + g.target, 0)
  const dayPct = Math.round(state.day / 30 * 100)
  const ringPct = Math.max(4, dayPct)
  const goalId = state.goals[0]?.id ?? null

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="YOUR 30-DAY MONEY RESET"
        titleStart="Your money."
        titleHighlight="Your next move."
        copy="A little more clarity today. A lot more freedom tomorrow."
        action={
          <div className="budget-ring-wrap">
            <div
              className="budget-ring"
              style={{ background: `conic-gradient(#c8f36b 0 ${ringPct}%, #e8eddf ${ringPct}% 100%)` }}
              role="img"
              aria-label={`Challenge progress: day ${state.day} of 30, ${dayPct}% through`}
            >
              <div className="ring-center"><span>DAY {state.day} OF 30</span><strong>{dayPct}%</strong><small>challenge complete</small></div>
            </div>
            <div className="ring-caption"><span className="live-dot" aria-hidden="true" /> Day {state.day} of 30 Â· {dayPct}% through</div>
          </div>
        }
      />

      <section className="hero-grid">
        <div className="balance-card">
          <div className="balance-top">
            <span className="card-label"><Wallet size={15} aria-hidden="true" /> AVAILABLE BALANCE</span>
            <span className="balance-badge"><span aria-hidden="true" /> {stats.balance >= stats.commitments ? 'Looking steady' : 'Needs attention'}</span>
          </div>
          <div className="balance-number">{money(stats.balance)}<span>.00</span></div>
          <div className="balance-sub">of your {money(stats.income)} total income</div>
          <div className="balance-track" role="img" aria-label={`${Math.round(stats.balance / Math.max(stats.income, 1) * 100)}% of income still available`}>
            <div style={{ width: `${Math.max(0, Math.min(100, stats.balance / Math.max(stats.income, 1) * 100))}%` }} />
          </div>
          <div className="balance-foot"><span>{money(stats.spent)} spent</span><span>{Math.round(stats.balance / Math.max(stats.income, 1) * 100)}% still yours</span></div>
          <div className="balance-actions">
            <button className="primary-button" onClick={() => onSimulate('purchase', '', 799)}><Plus size={16} aria-hidden="true" /> Simulate a decision</button>
            <button className="ghost-light-button" onClick={onAddIncome}><ArrowDownLeft size={16} aria-hidden="true" /> Add income</button>
          </div>
          <div className="balance-decoration" aria-hidden="true"><div /><div /><div /></div>
        </div>
        <div className="allowance-card">
          <div className="card-heading">
            <div className="heading-icon lime-icon"><CalendarDays size={18} aria-hidden="true" /></div>
            <button className="more-dots" aria-label="How the daily allowance is calculated" onClick={onAllowanceInfo}><CircleHelp size={17} aria-hidden="true" /></button>
          </div>
          <div className="mini-label">SAFE TO SPEND / DAY</div>
          <div className="allowance-number">{money(stats.daily)}</div>
          <p className="muted-small">After setting aside {money(stats.commitments)} for commitments.</p>
          <div className="allowance-meter" role="img" aria-label={`Daily guide meter: ${money(stats.daily)} per day`}>
            <span style={{ width: `${Math.min(100, stats.daily / 500 * 100)}%` }} />
          </div>
          <div className="allowance-foot"><span>Daily guide</span><strong>{stats.daily < 150 ? 'Take it easy' : stats.daily < 300 ? 'Steady pace' : 'Room to breathe'}</strong></div>
          <div className="allowance-bottom">
            <span><span className="tiny-dot" aria-hidden="true" /> {stats.remainingDays} days left</span>
            <span>{money(stats.spendable)} uncommitted</span>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Key metrics">
        <MetricCard icon={<PiggyBank size={18} aria-hidden="true" />} label="SAVINGS PROGRESS" value={money(stats.saved)} detail={`${Math.round(stats.saved / Math.max(totalGoalTarget, 1) * 100)}% of total goals`} tone="lavender" progress={stats.saved / Math.max(totalGoalTarget, 1) * 100} />
        <MetricCard icon={<TrendingUp size={18} aria-hidden="true" />} label="MONTH-END FORECAST" value={money(stats.forecast)} detail={stats.usedBaseline ? 'Estimate Â· baseline pace' : 'Estimate Â· your pace'} tone="mint" trend={stats.forecast >= 0} />
        <MetricCard icon={<ShieldCheck size={18} aria-hidden="true" />} label="FINANCIAL HEALTH" value={stats.healthReport.status} detail={stats.healthReport.status === 'Healthy' ? 'Commitments covered' : stats.healthReport.status === 'Caution' ? 'A few moves can help' : 'Needs attention now'} tone="peach" />
        <MetricCard icon={<Gauge size={18} aria-hidden="true" />} label="FINANCIAL RISK" value={stats.risk} detail={stats.risk === 'Low' ? 'Commitments look covered' : stats.risk === 'Watch' ? 'Keep an eye on cash flow' : 'Review spending and bills'} tone={stats.risk === 'Low' ? 'mint' : 'peach'} risk={stats.risk} />
      </section>

      <section className="content-grid">
        <div className="panel forecast-panel">
          <div className="panel-head">
            <div>
              <div className="panel-kicker">LOOKING AHEAD Â· ESTIMATE</div>
              <h2>Your money, in motion</h2>
              <p>{stats.usedBaseline ? `Baseline pace of ${money(stats.expectedDaily)}/day (limited history) minus ${money(stats.commitments)} commitments.` : `Your pace of ${money(stats.expectedDaily)}/day minus ${money(stats.commitments)} commitments. Each commitment counted once.`}</p>
            </div>
            <button className="period-select" onClick={onForecastInfo}>30 days <span className="sr-only">â€” forecast period</span></button>
          </div>
          <Suspense fallback={<div className="chart-fallback" role="status">Loading chartâ€¦</div>}>
            <ForecastChart state={state} />
          </Suspense>
          <div className="chart-bottom">
            <div><span className="bottom-dot green-dot" aria-hidden="true" /><span>Projected by day 30 (estimate)</span><strong>{money(stats.forecast)}</strong></div>
            <button className="text-button" onClick={onGoCommitments}>View commitments <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="panel insight-panel">
          <div className="panel-head">
            <div><div className="panel-kicker">A LITTLE MONEY WISDOM</div><h2>Your next best move</h2></div>
            <div className="insight-spark" aria-hidden="true"><Sparkles size={17} /></div>
          </div>
          <div className="insight-illustration" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="insight-coin"><Lightbulb size={29} /></div>
            <div className="float-star star-a">âœ¦</div><div className="float-star star-b">âœ¦</div>
          </div>
          <div className="insight-tag"><Zap size={12} aria-hidden="true" /> {stats.healthReport.status.toUpperCase()} Â· EXPLAINED</div>
          <h3>{stats.risk === 'Low' ? 'Give your future self a little cushion.' : 'Protect your essentials first.'}</h3>
          <ul className="health-reasons">{stats.healthReport.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>
          <p className="health-tip">Try this: {stats.healthReport.suggestions[0]}</p>
          <button className="insight-cta" onClick={() => onSimulate('purchase', '', 799)}>Try a what-if <ArrowUpRight size={15} aria-hidden="true" /></button>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel transactions-panel">
          <div className="panel-head compact-head">
            <div><div className="panel-kicker">YOUR MONEY TRAIL</div><h2>Recent activity</h2></div>
            <button className="text-button" onClick={onGoTransactions}>View all <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
          <div className="tx-list">{recentTx.slice(0, 5).map(t => <TransactionRow key={t.id} tx={t} />)}</div>
        </div>
        <div className="panel goals-panel">
          <div className="panel-head compact-head">
            <div><div className="panel-kicker">FUTURE YOU SAYS THANKS</div><h2>Savings goals</h2></div>
            <button className="icon-button add-goal" aria-label="Add to savings goal" onClick={() => onAddGoal(goalId)}><Plus size={17} aria-hidden="true" /></button>
          </div>
          <div className="goal-list">
            {state.goals.map(g => (
              <div className="goal-item" key={g.id}>
                <div className="goal-top">
                  <div className="goal-icon" style={{ background: g.color }} aria-hidden="true"><Target size={16} /></div>
                  <div className="goal-info"><strong>{g.name}</strong><span>{money(g.saved)} of {money(g.target)}</span></div>
                  <span className="goal-percent">{Math.round(g.saved / g.target * 100)}%</span>
                </div>
                <div className="goal-track" role="img" aria-label={`${g.name}: ${Math.round(g.saved / g.target * 100)}% funded`}>
                  <span style={{ width: `${Math.min(100, g.saved / g.target * 100)}%`, background: g.color }} />
                </div>
              </div>
            ))}
          </div>
          <button className="goal-add-button" onClick={() => onAddGoal(goalId)}><Plus size={15} aria-hidden="true" /> Put money towards a goal</button>
        </div>
      </section>

      <PacePanel state={state} />
    </div>
  )
}

