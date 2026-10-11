import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, ChevronDown, CircleHelp, CreditCard, Download, Gauge, LayoutDashboard, Lightbulb,
  Menu, MoreHorizontal, PiggyBank, Plus, ShieldCheck, Sparkles, Target, TrendingUp,
  Wallet, X, Zap
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import {
  STORAGE_KEY, applyDecision, availableCash, demoState, expenseTotal, expensesByCategory,
  healthReport, incomeTotal, loadPersisted, money, monthEndForecast,
  previewDecision, projectionSeries, remainingDays, riskLevel, dailyAllowance, savingsTransfers,
  spendableCash, toCsv, upcomingTotal, savedTotal, uid,
  type Commitment, type DecisionInput, type DecisionKind, type FinanceState, type Tx,
} from './finance'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Transactions', icon: Activity },
  { label: 'Goals & savings', icon: Target },
  { label: 'Commitments', icon: CalendarDays }
]
const CATEGORIES = ['Food', 'Transport', 'Lifestyle', 'Shopping', 'Education', 'Health', 'Other']

export default function App() {
  const [state, setState] = useState<FinanceState>(loadPersisted)
  const [page, setPage] = useState('Overview')
  const [simOpen, setSimOpen] = useState(false)
  const [simAmount, setSimAmount] = useState(799)
  const [simCategory, setSimCategory] = useState('Lifestyle')
  const [simTitle, setSimTitle] = useState('New headphones')
  const [simKind, setSimKind] = useState<DecisionKind>('purchase')
  const [simDueDay, setSimDueDay] = useState(20)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [filter, setFilter] = useState('All')
  const [showAllTx, setShowAllTx] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* private mode */ } }, [state])
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(t) }, [toast])
  useEffect(() => {
    if (!simOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSimOpen(false); setSubmitting(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [simOpen])

  const stats = useMemo(() => {
    const f = monthEndForecast(state);
    return {
      income: incomeTotal(state), spent: expenseTotal(state), saved: savedTotal(state),
      savingsTransfers: savingsTransfers(state), balance: availableCash(state),
      remainingDays: remainingDays(state), commitments: upcomingTotal(state),
      spendable: spendableCash(state), daily: dailyAllowance(state),
      forecast: f.forecast, expectedDaily: f.expectedDaily, usedBaseline: f.usedBaseline,
      risk: riskLevel(state), healthReport: healthReport(state), byCategory: expensesByCategory(state),
    };
  }, [state])
  const projected = useMemo(() => projectionSeries(state), [state])

  const recentTx = [...state.transactions].filter(t => filter === 'All' || (filter === 'Income' ? t.kind === 'income' : filter === 'Savings' ? t.kind === 'saving' : t.kind === 'expense')).sort((a,b) => b.day-a.day || (a.id < b.id ? -1 : 1))
  const goalId = selectedGoal ?? state.goals[0]?.id ?? null
  const goal = state.goals.find(g => g.id === goalId) || state.goals[0]
  const simInput: DecisionInput = { kind: simKind, amount: Math.round(Number(simAmount) || 0), title: simTitle, category: simKind === 'purchase' ? simCategory : simKind === 'unexpected' ? 'Unexpected' : simKind === 'saving' ? 'Savings' : 'Income', goalId: goalId ?? undefined, dueDay: simDueDay }
  const preview = useMemo(() => previewDecision(state, simInput), [state, simKind, simAmount, simTitle, simCategory, goalId, simDueDay])
  function openSim(kind: DecisionKind, title: string, amount: number, goalIdNext?: string | null) {
    setSimKind(kind); setSimTitle(title); setSimAmount(amount);
    if (goalIdNext !== undefined) setSelectedGoal(goalIdNext);
    setSubmitting(false); setSimOpen(true);
  }
  function cancelSim() { setSimOpen(false); setSubmitting(false); }

  function notify(message: string) { setToast(message) }
  function applySimulation() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const next = applyDecision(state, simInput);
      setState(next); setSimOpen(false);
      const label = simInput.title.trim() || (simKind === 'unexpected' ? 'Unexpected expense' : simKind === 'saving' ? 'Savings contribution' : simKind === 'income' ? 'Extra income' : simKind === 'subscription' ? 'Commitment' : 'Purchase');
      notify(simKind === 'subscription' ? `"${label}" reserved in your forecast.` : simKind === 'income' ? `"${label}" added to income.` : simKind === 'saving' ? `"${label}" contribution recorded.` : `"${label}" applied.`);
    } catch (e) { notify(e instanceof Error ? e.message : 'That decision cannot be applied.'); }
    finally { setSubmitting(false); }
  }
  function toggleCommitment(id: string) {
    setState(s => ({ ...s, commitments: s.commitments.map(c => c.id === id ? { ...c, active: !c.active } : c) }))
    notify('Commitment updated. Forecast recalculated.')
  }
  function resetDemo() {
    setState(demoState()); setPage('Overview'); setFilter('All'); setSelectedGoal(null); notify('Demo data reset.')
  }
  function exportCsv() {
    const csv = toCsv(state)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'paisapilot-transactions.csv'; a.click(); URL.revokeObjectURL(url)
    notify('Transaction CSV exported.')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><span>paisa<span className="brand-light"> pilot</span></span></div>
      <div className="workspace-label">YOUR MONEY SPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => {setPage(item.label); setMobileNav(false)}}><Icon size={18}/><span>{item.label}</span>{item.label === 'Commitments' && <span className="nav-count">{state.commitments.filter(c=>c.active).length}</span>}</button> })}
      </nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17}/></div><div className="tip-title">Small moves. Big future.</div><p>Your money has a plan. You’re in control of it.</p><button onClick={() => openSim('purchase', '', 799)}>Try a money move <ArrowUpRight size={14}/></button></div>
      <button className="nav-item reset-link" onClick={resetDemo}><Activity size={17}/><span>Reset demo data</span></button>
      <div className="sidebar-footer"><div className="avatar">A</div><div className="profile-text"><strong>Alex Morgan</strong><span>Budget explorer</span></div><button className="icon-button subtle" aria-label="More profile options" onClick={() => notify('Demo profile · Data is stored in this browser.')}><MoreHorizontal size={19}/></button></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20}/></button>
        <div className="breadcrumb">Money space <span>/</span> <strong>{page}</strong></div>
        <div className="topbar-right"><div className="day-pill"><span className="live-dot"/><span>DAY {String(state.day).padStart(2,'0')}</span><span className="day-divider"/>30</div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify(stats.risk === 'Low' ? 'You are currently on track. Keep protecting your reserve.' : 'Review upcoming commitments before making a large purchase.')}><Bell size={18}/><i/></button><div className="top-avatar">A</div></div>
      </header>

      {page === 'Overview' && <div className="page-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR 30-DAY MONEY RESET</div><h1>Your money.<br/><span>Your next move.</span></h1><p className="welcome-copy">A little more clarity today. A lot more freedom tomorrow.</p></div><div className="budget-ring-wrap"><div className="budget-ring"><div className="ring-center"><span>STARTED WITH</span><strong>₹10,000</strong><small>30 day challenge</small></div></div><div className="ring-caption"><span className="live-dot"/> Day {state.day} of 30 <span>·</span> {Math.round(state.day/30*100)}% through</div></div></section>

        <section className="hero-grid">
          <div className="balance-card">
            <div className="balance-top"><span className="card-label"><Wallet size={15}/> AVAILABLE BALANCE</span><span className="balance-badge"><span/> {stats.balance >= stats.commitments ? 'Looking steady' : 'Needs attention'}</span></div>
            <div className="balance-number">{money(stats.balance)}<span>.00</span></div>
            <div className="balance-sub">of your {money(stats.income)} total income</div>
            <div className="balance-track"><div style={{width:`${Math.max(0,Math.min(100,stats.balance/Math.max(stats.income,1)*100))}%`}}/></div>
            <div className="balance-foot"><span>{money(stats.spent)} spent</span><span>{Math.round(stats.balance/Math.max(stats.income,1)*100)}% still yours</span></div>
            <div className="balance-actions"><button className="primary-button" onClick={() => openSim('purchase', '', 799)}><Plus size={16}/> Simulate a decision</button><button className="ghost-light-button" onClick={() => openSim('income', 'Extra income', 1000)}><ArrowDownLeft size={16}/> Add income</button></div>
            <div className="balance-decoration"><div/><div/><div/></div>
          </div>
          <div className="allowance-card">
            <div className="card-heading"><div className="heading-icon lime-icon"><CalendarDays size={18}/></div><button className="more-dots" aria-label="Allowance information" onClick={() => notify('Safe daily allowance = balance minus upcoming commitments, divided across remaining days.')}><CircleHelp size={17}/></button></div>
            <div className="mini-label">SAFE TO SPEND / DAY</div><div className="allowance-number">{money(stats.daily)}</div><p className="muted-small">After setting aside {money(stats.commitments)} for commitments.</p>
            <div className="allowance-meter"><span style={{width:`${Math.min(100,stats.daily/500*100)}%`}}/></div>
            <div className="allowance-foot"><span>Daily guide</span><strong>{stats.daily < 150 ? 'Take it easy' : stats.daily < 300 ? 'Steady pace' : 'Room to breathe'}</strong></div>
            <div className="allowance-bottom"><span><span className="tiny-dot"/> {stats.remainingDays} days left</span><span>{money(stats.spendable)} uncommitted</span></div>
          </div>
        </section>

        <section className="metric-grid">
          <MetricCard icon={<PiggyBank size={18}/>} label="SAVINGS PROGRESS" value={money(stats.saved)} detail={`${Math.round(stats.saved/Math.max(state.goals.reduce((s,g)=>s+g.target,0),1)*100)}% of total goals`} tone="lavender" progress={stats.saved/Math.max(state.goals.reduce((s,g)=>s+g.target,0),1)*100}/>
          <MetricCard icon={<TrendingUp size={18}/>} label="MONTH-END FORECAST" value={money(stats.forecast)} detail={stats.usedBaseline ? 'Estimate · baseline pace' : 'Estimate · your pace'} tone="mint" trend={stats.forecast >= 0}/>
          <MetricCard icon={<ShieldCheck size={18}/>} label="FINANCIAL HEALTH" value={stats.healthReport.status} detail={stats.healthReport.status === 'Healthy' ? 'Commitments covered' : stats.healthReport.status === 'Caution' ? 'A few moves can help' : 'Needs attention now'} tone="peach"/>
          <MetricCard icon={<Gauge size={18}/>} label="FINANCIAL RISK" value={stats.risk} detail={stats.risk === 'Low' ? 'Commitments look covered' : stats.risk === 'Watch' ? 'Keep an eye on cash flow' : 'Review spending and bills'} tone={stats.risk === 'Low' ? 'mint' : 'peach'} risk={stats.risk}/>
        </section>

        <section className="content-grid">
          <div className="panel forecast-panel">
            <div className="panel-head"><div><div className="panel-kicker">LOOKING AHEAD · ESTIMATE</div><h2>Your money, in motion</h2><p>{stats.usedBaseline ? `Baseline pace of ${money(stats.expectedDaily)}/day (limited history) minus ${money(stats.commitments)} commitments.` : `Your pace of ${money(stats.expectedDaily)}/day minus ${money(stats.commitments)} commitments. Each commitment counted once.`}</p></div><button className="period-select" onClick={() => notify('Forecast covers day '+state.day+' through day 30.')}>30 days <ChevronDown size={14}/></button></div>
            <div className="chart-legend"><span><i className="legend-lime"/> Projected balance</span><span><i className="legend-dash"/> Commitment dates</span></div>
            <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={projected} margin={{top:10,right:8,left:-18,bottom:0}}><defs><linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7e86a" stopOpacity={0.28}/><stop offset="100%" stopColor="#b7e86a" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9ece4"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#899083'}} interval={Math.max(0,Math.floor(projected.length/6)-1)}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#899083'}} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`}/><Tooltip formatter={(v) => [money(Number(v)), 'Projected balance']} contentStyle={{borderRadius:12,border:'1px solid #e6e9e1',fontSize:12,boxShadow:'0 8px 30px #17210c12'}}/><Area type="monotone" dataKey="balance" stroke="#7fae37" strokeWidth={2.5} fill="url(#balanceGradient)" activeDot={{r:5,strokeWidth:0,fill:'#7fae37'}}/>{state.commitments.filter(c=>c.active&&c.day>=state.day).map(c=><ReferenceDot key={c.id} x={`D${c.day}`} y={projected.find(p=>p.day===`D${c.day}`)?.balance ?? 0} r={4} fill="#d4a05a" stroke="#fff" />)}</AreaChart></ResponsiveContainer></div>
            <div className="chart-bottom"><div><span className="bottom-dot green-dot"/><span>Projected by day 30 (estimate)</span><strong>{money(projected.length ? projected[projected.length-1].raw : 0)}</strong></div><button className="text-button" onClick={() => setPage('Commitments')}>View commitments <ArrowRight size={14}/></button></div>
          </div>
          <div className="panel insight-panel">
            <div className="panel-head"><div><div className="panel-kicker">A LITTLE MONEY WISDOM</div><h2>Your next best move</h2></div><div className="insight-spark"><Sparkles size={17}/></div></div>
            <div className="insight-illustration"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="insight-coin"><Lightbulb size={29}/></div><div className="float-star star-a">✳</div><div className="float-star star-b">✦</div></div>
            <div className="insight-tag"><Zap size={12}/> {stats.healthReport.status.toUpperCase()} · EXPLAINED</div>
            <h3>{stats.risk === 'Low' ? 'Give your future self a little cushion.' : 'Protect your essentials first.'}</h3>
            <ul className="health-reasons">{stats.healthReport.reasons.slice(0,3).map((r,i)=><li key={i}>{r}</li>)}</ul>
            <p className="health-tip">Try this: {stats.healthReport.suggestions[0]}</p>
            <button className="insight-cta" onClick={() => openSim('purchase', '', 799)}>Try a what-if <ArrowUpRight size={15}/></button>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel transactions-panel">
            <div className="panel-head compact-head"><div><div className="panel-kicker">YOUR MONEY TRAIL</div><h2>Recent activity</h2></div><button className="text-button" onClick={() => {setPage('Transactions');setShowAllTx(true)}}>View all <ArrowRight size={14}/></button></div>
            <div className="tx-list">{recentTx.slice(0,showAllTx?12:5).map(t => <TransactionRow key={t.id} tx={t}/>)}</div>
          </div>
          <div className="panel goals-panel">
            <div className="panel-head compact-head"><div><div className="panel-kicker">FUTURE YOU SAYS THANKS</div><h2>Savings goals</h2></div><button className="icon-button add-goal" aria-label="Add to savings goal" onClick={() => openSim('saving', 'Goal contribution', 200, goalId)}><Plus size={17}/></button></div>
            <div className="goal-list">{state.goals.map(g => <div className="goal-item" key={g.id}><div className="goal-top"><div className="goal-icon" style={{background:g.color}}><Target size={16}/></div><div className="goal-info"><strong>{g.name}</strong><span>{money(g.saved)} of {money(g.target)}</span></div><span className="goal-percent">{Math.round(g.saved/g.target*100)}%</span></div><div className="goal-track"><span style={{width:`${Math.min(100,g.saved/g.target*100)}%`,background:g.color}}/></div></div>)}</div>
            <button className="goal-add-button" onClick={() => openSim('saving', 'Goal contribution', 200, goalId)}><Plus size={15}/> Put money towards a goal</button>
          </div>
        </section>
      </div>}

      {page === 'Transactions' && <div className="page-wrap inner-page"><div className="eyebrow"><span className="eyebrow-line"/> YOUR MONEY TRAIL</div><div className="page-title-row"><div><h1>Every rupee,<br/><span>accounted for.</span></h1><p className="welcome-copy">Your activity, all in one place.</p></div><button className="primary-button dark-primary" onClick={exportCsv}><Download size={16}/> Export CSV</button></div><div className="transaction-summary"><div><span>Total income</span><strong>{money(stats.income)}</strong></div><div><span>Spent so far</span><strong>{money(stats.spent)}</strong></div><div><span>Moved to savings</span><strong>{money(stats.savingsTransfers)}</strong></div><div><span>Transactions</span><strong>{state.transactions.length}</strong></div></div><div className="panel full-panel"><div className="panel-head"><div><h2>Activity history</h2><p>Applied decisions and money movement.</p></div><div className="filter-row">{['All','Expense','Income','Savings'].map(f=><button key={f} className={`filter-chip ${filter===f?'selected':''}`} onClick={()=>setFilter(f)}>{f}</button>)}</div></div><div className="tx-list roomy">{recentTx.map(t=><TransactionRow key={t.id} tx={t}/>)}</div>{recentTx.length===0&&<div className="empty-state">No transactions in this category yet.</div>}</div></div>}

      {page === 'Goals & savings' && <div className="page-wrap inner-page"><div className="eyebrow"><span className="eyebrow-line"/> FUTURE YOU SAYS THANKS</div><h1>Make room for<br/><span>what matters.</span></h1><p className="welcome-copy">Small, consistent contributions add up. See what your next move could do.</p><div className="goal-page-grid">{state.goals.map(g=><div className="panel goal-detail" key={g.id}><div className="goal-detail-top"><div className="goal-icon large" style={{background:g.color}}><Target size={23}/></div><span className="goal-percent">{Math.round(g.saved/g.target*100)}% there</span></div><h2>{g.name}</h2><p>Keep this goal moving without putting your essentials at risk.</p><div className="goal-big-number">{money(g.saved)} <span>of {money(g.target)}</span></div><div className="goal-track big-track"><span style={{width:`${Math.min(100,g.saved/g.target*100)}%`,background:g.color}}/></div><div className="goal-detail-foot"><span>Still to go</span><strong>{money(Math.max(0,g.target-g.saved))}</strong></div><button className="primary-button dark-primary full-width" onClick={()=>openSim('saving', `Contribution · ${g.name}`, 200, g.id)}><Plus size={16}/> Add contribution</button></div>)}</div><div className="panel goal-note"><Lightbulb size={20}/><div><strong>Protect the emergency cushion first.</strong><p>Your emergency goal gives you options when life gets unpredictable. Build it steadily, but don't move money into savings that you need for bills due this month.</p></div></div></div>}

      {page === 'Commitments' && <div className="page-wrap inner-page"><div className="eyebrow"><span className="eyebrow-line"/> PLAN AHEAD, STAY EASY</div><h1>Future bills.<br/><span>Zero surprises.</span></h1><p className="welcome-copy">These are the things your future balance already has plans for.</p><div className="commitment-banner"><div className="commitment-banner-icon"><CalendarDays size={22}/></div><div><span>COMING UP · {state.commitments.filter(c=>c.active&&c.day>=state.day).length} ACTIVE ITEMS</span><strong>{money(stats.commitments)} <small>reserved</small></strong></div><div className="commitment-banner-side">Money reserved here is excluded from your safe-to-spend allowance.</div></div><div className="commitment-list">{state.commitments.map(c=><div className={`panel commitment-item ${!c.active?'commitment-paused':''}`} key={c.id}><div className={`commitment-icon ${c.kind}`} >{c.kind==='bill'?<CreditCard size={19}/>:<Zap size={19}/>}</div><div className="commitment-info"><strong>{c.name}</strong><span>{c.kind==='bill'?'Bill':'Subscription'} · Day {c.day}{c.day<=state.day?' · Due / passed':' · Upcoming'}</span></div><div className="commitment-amount">{money(c.amount)}<span>{c.active?'Included in forecast':'Paused'}</span></div><button className={`toggle ${c.active?'toggle-on':''}`} role="switch" aria-checked={c.active} aria-label={`${c.active?'Pause':'Activate'} ${c.name}`} onClick={()=>toggleCommitment(c.id)}><span/></button></div>)}</div><button className="secondary-button add-commitment" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add a commitment</button></div>}

      <footer className="footer"><span>paisa pilot</span><span>Make your money make sense.</span><button onClick={resetDemo}>Reset demo</button></footer>
    </main>

    {simOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)cancelSim()}}><section className="sim-modal" role="dialog" aria-modal="true" aria-labelledby="sim-title"><div className="modal-top"><div><div className="panel-kicker">THINK IT THROUGH</div><h2 id="sim-title">What if you make<br/>this money move?</h2></div><button className="icon-button" aria-label="Close simulator" onClick={cancelSim}><X size={20}/></button></div><div className="sim-type-tabs" role="tablist" aria-label="Decision type">{([{key:'purchase',label:'Purchase'},{key:'unexpected',label:'Unexpected'},{key:'saving',label:'Save'},{key:'income',label:'Income'},{key:'subscription',label:'Recurring'}] as {key:DecisionKind;label:string}[]).map((it)=><button key={it.key} role="tab" aria-selected={simKind===it.key} className={simKind===it.key?'selected':''} onClick={()=>{setSimKind(it.key);setSimTitle(it.key==='purchase'?'':it.key==='unexpected'?'Unexpected expense':it.key==='saving'?'Goal contribution':it.key==='income'?'Extra income':'New subscription')}}>{it.label}</button>)}</div><label className="field-label" htmlFor="sim-title-input">Give this decision a name</label><input id="sim-title-input" className="text-input" value={simTitle} onChange={e=>setSimTitle(e.target.value)} placeholder={simKind==='purchase'?'e.g. Concert tickets':'What is this for?'} maxLength={60}/><label className="field-label" htmlFor="sim-amount-num">How much money? <strong>{money(Number(simAmount) || 0)}</strong></label><div className="amount-row"><input id="sim-amount-num" className="text-input" type="number" min={1} max={10000} step={1} value={simAmount} onChange={e=>setSimAmount(Number(e.target.value))}/><input id="sim-amount" className="range-input" type="range" min="50" max="5000" step="50" value={Math.min(5000,Math.max(50,Number(simAmount)||50))} onChange={e=>setSimAmount(Number(e.target.value))} aria-label="Amount slider"/></div><div className="range-labels"><span>₹50</span><span>₹5,000 (type exact above)</span></div>{simKind==='purchase'&&<><label className="field-label" htmlFor="sim-category">Spending category</label><select id="sim-category" className="text-input" value={simCategory} onChange={e=>setSimCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></>} {simKind==='saving'&&<><label className="field-label" htmlFor="goal-select">Contribute to</label><select id="goal-select" className="text-input" value={goalId ?? ''} onChange={e=>setSelectedGoal(e.target.value)}>{state.goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></>}{simKind==='subscription'&&<><label className="field-label" htmlFor="sim-due">Due day (1–30)</label><input id="sim-due" className="text-input" type="number" min={1} max={30} value={simDueDay} onChange={e=>setSimDueDay(Math.min(30,Math.max(1,Number(e.target.value)||1)))}/></>}<div className="sim-preview"><div className="sim-preview-title"><Sparkles size={15}/> YOUR PREVIEW <span>NOT APPLIED YET</span></div><div className="preview-metrics"><div><span>New balance</span><strong>{money(preview.after.available)}</strong><small className={preview.after.available<preview.after.upcoming?'negative':'positive'}>{preview.after.available<preview.after.upcoming?'Below commitments':'Commitments covered'}</small></div><div><span>Daily allowance</span><strong>{money(preview.after.daily)}</strong><small>Was {money(preview.before.daily)} · {preview.deltas.daily>=0?'+':''}{money(preview.deltas.daily)}/day</small></div><div><span>Month-end buffer</span><strong>{money(preview.after.forecast)}</strong><small>{preview.deltas.forecast>=0?'+':''}{money(preview.deltas.forecast)} vs now</small></div></div><p className="preview-note">{preview.headline}</p>{simKind==='saving'&&preview.deltas.goal!=null&&<p className="preview-note">Goal progress: {money(preview.before.goalSaved ?? 0)} → {money(preview.after.goalSaved ?? 0)}.</p>}{preview.blocksDecision&&<p className="preview-note negative" role="alert">{preview.blocksDecision}</p>}{!preview.blocksDecision&&preview.after.risk!==preview.before.risk&&<p className="preview-note">Risk moves from {preview.before.risk} → {preview.after.risk}.</p>}{!preview.blocksDecision&&preview.after.health!==preview.before.health&&<p className="preview-note">Health moves from {preview.before.health} → {preview.after.health}.</p>}</div><div className="modal-actions"><button className="secondary-button" onClick={cancelSim}>Cancel</button><button className="primary-button dark-primary" onClick={applySimulation} disabled={submitting || preview.blocksDecision!=null} aria-disabled={submitting || preview.blocksDecision!=null}>{submitting ? 'Applying…' : <><Check size={16}/> Apply decision</>}</button></div><p className="modal-disclaimer">Demo mode · No bank account connected. You can reset sample data at any time.</p></section></div>}

    {showAdd && <AddCommitmentModal onClose={()=>setShowAdd(false)} onAdd={c=>{setState(s=>({...s,commitments:[...s.commitments,{...c,id:uid()}]}));setShowAdd(false);notify('Commitment added to your forecast.')}}/>}
    {toast && <div className="toast" role="status"><span><Check size={16}/></span>{toast}<button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>
}

function MetricCard({icon,label,value,detail,tone,progress,risk,trend}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string;progress?:number;risk?:string;trend?:boolean}) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className={`metric-value ${risk==='High'?'risk-high':risk==='Watch'?'risk-watch':''}`}>{value}</div><div className="metric-detail">{trend!==undefined&&<span className={trend?'trend-up':'trend-down'}>{trend?<ArrowDownRight size={13}/>:<ArrowUpRight size={13}/>}</span>}{detail}</div>{progress!==undefined&&<div className="metric-progress"><span style={{width:`${Math.min(100,Math.max(0,progress))}%`}}/></div>}</div>
}
function TransactionRow({tx}:{tx:Tx}) {
  const icon = tx.kind==='income'?<ArrowDownLeft size={17}/>:tx.kind==='saving'?<PiggyBank size={17}/>:tx.category==='Transport'?<ArrowUpRight size={17}/>:tx.category==='Subscriptions'?<Zap size={17}/>:tx.category==='Food'?<Wallet size={17}/>:<Sparkles size={17}/>
  return <div className="tx-row"><div className={`tx-icon ${tx.kind}`}>{icon}</div><div className="tx-details"><strong>{tx.title}</strong><span>{tx.category} · Day {tx.day}</span></div><div className={`tx-amount ${tx.kind}`}>{tx.kind==='income'?'+':tx.kind==='saving'?'↗':'−'}{money(tx.amount)}</div></div>
}
function AddCommitmentModal({onClose,onAdd}:{onClose:()=>void;onAdd:(c:Omit<Commitment,'id'>)=>void}) {
  const [name,setName]=useState(''); const [amount,setAmount]=useState('250'); const [day,setDay]=useState('18'); const [kind,setKind]=useState<'bill'|'subscription'>('bill'); const [error,setError]=useState('')
  function submit(e:React.FormEvent) {
    e.preventDefault();
    const n=Math.round(Number(amount)),d=Number(day);
    if(!name.trim()){setError('Give the commitment a name.');return;}
    if(!Number.isFinite(n)||n<=0){setError('Enter an amount greater than ₹0.');return;}
    if(!Number.isInteger(d)||d<1||d>30){setError('Pick a due day between 1 and 30.');return;}
    onAdd({name:name.trim(),amount:n,day:d,active:true,kind});
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="sim-modal small-modal" role="dialog" aria-modal="true" aria-labelledby="add-commitment-title"><div className="modal-top"><div><div className="panel-kicker">PLAN AHEAD</div><h2 id="add-commitment-title">Add a commitment</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={20}/></button></div><form onSubmit={submit}><label className="field-label" htmlFor="commitment-name">Name</label><input id="commitment-name" className="text-input" value={name} onChange={e=>setName(e.target.value)} required maxLength={50} placeholder="e.g. Internet bill"/><div className="form-row"><div><label className="field-label" htmlFor="commitment-amount">Amount (₹)</label><input id="commitment-amount" className="text-input" type="number" min="1" max="10000" value={amount} onChange={e=>setAmount(e.target.value)} required/></div><div><label className="field-label" htmlFor="commitment-day">Due day</label><input id="commitment-day" className="text-input" type="number" min="1" max="30" value={day} onChange={e=>setDay(e.target.value)} required/></div></div><label className="field-label" htmlFor="commitment-kind">Type</label><select id="commitment-kind" className="text-input" value={kind} onChange={e=>setKind(e.target.value as 'bill'|'subscription')}><option value="bill">Bill / commitment</option><option value="subscription">Subscription</option></select>{error&&<p className="preview-note negative" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button dark-primary"><Plus size={16}/> Add commitment</button></div></form></section></div>
}