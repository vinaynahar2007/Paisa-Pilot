import { Download } from 'lucide-react'
import { useState } from 'react'
import { money, sortTransactions, type FinanceState, type TxKind } from '../finance'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import TransactionRow from '../components/TransactionRow'

const FILTERS = ['All', 'Expense', 'Income', 'Savings'] as const
type Filter = typeof FILTERS[number]

function matches(t: FinanceState['transactions'][number], filter: Filter): boolean {
  if (filter === 'All') return true
  const kind: TxKind = filter === 'Income' ? 'income' : filter === 'Savings' ? 'saving' : 'expense'
  return t.kind === kind
}

export default function TransactionsPage({
  state, income, spent, savingsTransfers, onExport,
}: {
  state: FinanceState
  income: number
  spent: number
  savingsTransfers: number
  onExport: () => void
}) {
  const [filter, setFilter] = useState<Filter>('All')
  const rows = sortTransactions(state.transactions).filter(t => matches(t, filter))

  return (
    <div className="page-wrap inner-page">
      <PageHeader
        eyebrow="YOUR MONEY TRAIL"
        titleStart="Every rupee,"
        titleHighlight="accounted for."
        copy="Your activity, all in one place."
        action={<button className="primary-button dark-primary" onClick={onExport}><Download size={16} aria-hidden="true" /> Export CSV</button>}
      />
      <div className="transaction-summary">
        <div><span>Total income</span><strong>{money(income)}</strong></div>
        <div><span>Spent so far</span><strong>{money(spent)}</strong></div>
        <div><span>Moved to savings</span><strong>{money(savingsTransfers)}</strong></div>
        <div><span>Transactions</span><strong>{state.transactions.length}</strong></div>
      </div>
      <div className="panel full-panel">
        <div className="panel-head">
          <div><h2>Activity history</h2><p>Applied decisions and money movement.</p></div>
          <div className="filter-row" role="group" aria-label="Filter transactions">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'selected' : ''}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="tx-list roomy" aria-live="polite">
          {rows.map(t => <TransactionRow key={t.id} tx={t} />)}
        </div>
        {rows.length === 0 && <EmptyState title="No transactions in this category yet." hint="Try another filter, or simulate a decision to add one." />}
      </div>
    </div>
  )
}
