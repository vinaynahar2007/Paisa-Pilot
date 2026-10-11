import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
  STORAGE_KEY, applyDecision, availableCash, demoState, expenseTotal, healthReport,
  incomeTotal, loadPersisted, monthEndForecast, previewDecision, remainingDays, riskLevel,
  dailyAllowance, savingsTransfers, spendableCash, toCsv, upcomingTotal, savedTotal, uid,
  type DecisionInput, type DecisionKind, type FinanceState,
} from './finance'
import Sidebar, { type PageLabel } from './components/Sidebar'
import Topbar from './components/Topbar'
import SimulatorModal, { type SimState } from './components/SimulatorModal'
import AddCommitmentModal from './components/AddCommitmentModal'
import OverviewPage from './pages/OverviewPage'
import TransactionsPage from './pages/TransactionsPage'
import GoalsPage from './pages/GoalsPage'
import CommitmentsPage from './pages/CommitmentsPage'
import { useDialogBehavior } from './hooks/useDialogBehavior'

const DEFAULT_SIM: SimState = { kind: 'purchase', title: 'New headphones', amount: 799, category: 'Lifestyle', dueDay: 20 }

export default function App() {
  const [state, setState] = useState<FinanceState>(loadPersisted)
  const [page, setPage] = useState<PageLabel>('Overview')
  const [sim, setSim] = useState<SimState>(DEFAULT_SIM)
  const [simOpen, setSimOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  useDialogBehavior(navRef, mobileNav, () => setMobileNav(false))

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* private mode */ } }, [state])
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(t) }, [toast])

  const stats = useMemo(() => {
    const f = monthEndForecast(state)
    return {
      income: incomeTotal(state), spent: expenseTotal(state), saved: savedTotal(state),
      savingsTransfers: savingsTransfers(state), balance: availableCash(state),
      remainingDays: remainingDays(state), commitments: upcomingTotal(state),
      spendable: spendableCash(state), daily: dailyAllowance(state),
      forecast: f.forecast, expectedDaily: f.expectedDaily, usedBaseline: f.usedBaseline,
      risk: riskLevel(state), healthReport: healthReport(state),
    }
  }, [state])

  const recentTx = useMemo(
    () => [...state.transactions].sort((a, b) => b.day - a.day || (a.id < b.id ? -1 : 1)),
    [state.transactions],
  )
  const goalId = selectedGoal ?? state.goals[0]?.id ?? null

  const simInput: DecisionInput = useMemo(() => ({
    kind: sim.kind,
    amount: Math.round(Number(sim.amount) || 0),
    title: sim.title,
    category: sim.kind === 'purchase' ? sim.category : sim.kind === 'unexpected' ? 'Unexpected' : sim.kind === 'saving' ? 'Savings' : 'Income',
    goalId: goalId ?? undefined,
    dueDay: sim.dueDay,
  }), [sim, goalId])

  const preview = useMemo(() => previewDecision(state, simInput), [state, simInput])
  const notify = useCallback((message: string) => setToast(message), [])


  function openSim(kind: DecisionKind, title: string, amount: number, goalIdNext?: string | null) {
    setSim(s => ({ ...s, kind, title, amount }))
    if (goalIdNext !== undefined) setSelectedGoal(goalIdNext)
    setSubmitting(false)
    setSimOpen(true)
  }
  function cancelSim() { setSimOpen(false); setSubmitting(false) }

  function applySimulation() {
    if (submitting) return
    setSubmitting(true)
    try {
      const next = applyDecision(state, simInput)
      setState(next); setSimOpen(false)
      const label = simInput.title.trim() || (sim.kind === 'unexpected' ? 'Unexpected expense' : sim.kind === 'saving' ? 'Savings contribution' : sim.kind === 'income' ? 'Extra income' : sim.kind === 'subscription' ? 'Commitment' : 'Purchase')
      notify(sim.kind === 'subscription' ? `"${label}" reserved in your forecast.` : sim.kind === 'income' ? `"${label}" added to income.` : sim.kind === 'saving' ? `"${label}" contribution recorded.` : `"${label}" applied.`)
    } catch (e) { notify(e instanceof Error ? e.message : 'That decision cannot be applied.') }
    finally { setSubmitting(false) }
  }

  function toggleCommitment(id: string) {
    setState(s => ({ ...s, commitments: s.commitments.map(c => c.id === id ? { ...c, active: !c.active } : c) }))
    notify('Commitment updated. Forecast recalculated.')
  }
  function resetDemo() {
    setState(demoState()); setPage('Overview'); setSelectedGoal(null); setMobileNav(false); notify('Demo data reset.')
  }
  function exportCsv() {
    const csv = toCsv(state)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'paisapilot-transactions.csv'; a.click(); URL.revokeObjectURL(url)
    notify('Transaction CSV exported.')
  }
  function navigate(next: PageLabel) { setPage(next); setMobileNav(false) }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Sidebar
      ref={navRef}
      page={page}
      activeCommitments={state.commitments.filter(c => c.active).length}
      open={mobileNav}
      onNavigate={navigate}
      onClose={() => setMobileNav(false)}
      onTryMove={() => openSim('purchase', '', 799)}
      onReset={resetDemo}
      onProfileInfo={() => notify('Demo profile · Data is stored in this browser.')}
    />
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content" id="main-content">
      <Topbar
        page={page}
        day={state.day}
        onOpenNav={() => setMobileNav(true)}
        onNotifications={() => notify(stats.risk === 'Low' ? 'You are currently on track. Keep protecting your reserve.' : 'Review upcoming commitments before making a large purchase.')}
      />

      {page === 'Overview' && (
        <OverviewPage
          state={state}
          stats={stats}
          recentTx={recentTx}
          onSimulate={(kind, title, amount) => openSim(kind, title, amount)}
          onAddIncome={() => openSim('income', 'Extra income', 1000)}
          onAllowanceInfo={() => notify('Safe daily allowance = balance minus upcoming commitments, divided across remaining days.')}
          onForecastInfo={() => notify('Forecast covers day ' + state.day + ' through day 30.')}
          onGoCommitments={() => setPage('Commitments')}
          onGoTransactions={() => setPage('Transactions')}
          onAddGoal={(id) => openSim('saving', 'Goal contribution', 200, id)}
        />
      )}

      {page === 'Transactions' && (
        <TransactionsPage
          state={state}
          income={stats.income}
          spent={stats.spent}
          savingsTransfers={stats.savingsTransfers}
          onExport={exportCsv}
        />
      )}

      {page === 'Goals & savings' && (
        <GoalsPage state={state} onSimulate={(kind, title, amount, gid) => openSim(kind, title, amount, gid)} />
      )}

      {page === 'Commitments' && (
        <CommitmentsPage
          state={state}
          reserved={stats.commitments}
          activeCount={state.commitments.filter(c => c.active).length}
          onToggle={toggleCommitment}
          onAdd={() => setShowAdd(true)}
        />
      )}

      <footer className="footer">
        <span>paisa pilot</span><span>Make your money make sense.</span>
        <button onClick={resetDemo}>Reset demo</button>
      </footer>
    </main>

    {simOpen && (
      <SimulatorModal
        state={state}
        sim={sim}
        goalId={goalId}
        preview={preview}
        submitting={submitting}
        onChange={(patch) => setSim(s => ({ ...s, ...patch }))}
        onSelectGoal={setSelectedGoal}
        onClose={cancelSim}
        onApply={applySimulation}
      />
    )}

    {showAdd && (
      <AddCommitmentModal
        onClose={() => setShowAdd(false)}
        onAdd={c => { setState(s => ({ ...s, commitments: [...s.commitments, { ...c, id: uid() }] })); setShowAdd(false); notify('Commitment added to your forecast.') }}
      />
    )}

    {toast && (
      <div className="toast" role="status">
        <span aria-hidden="true"><Check size={16} /></span>{toast}
        <button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} aria-hidden="true" /></button>
      </div>
    )}
  </div>
}

