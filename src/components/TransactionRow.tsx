import { ArrowDownLeft, ArrowUpRight, PiggyBank, Sparkles, Wallet, Zap } from 'lucide-react'
import { money, type Tx } from '../finance'

export default function TransactionRow({ tx }: { tx: Tx }) {
  const icon =
    tx.kind === 'income' ? <ArrowDownLeft size={17} /> :
    tx.kind === 'saving' ? <PiggyBank size={17} /> :
    tx.category === 'Transport' ? <ArrowUpRight size={17} /> :
    tx.category === 'Subscriptions' ? <Zap size={17} /> :
    tx.category === 'Food' ? <Wallet size={17} /> :
    <Sparkles size={17} />
  return (
    <div className="tx-row">
      <div className={`tx-icon ${tx.kind}`}>{icon}</div>
      <div className="tx-details">
        <strong>{tx.title}</strong>
        <span>{tx.category} · Day {tx.day}</span>
      </div>
      <div className={`tx-amount ${tx.kind}`}>
        {tx.kind === 'income' ? '+' : tx.kind === 'saving' ? '↗' : '−'}{money(tx.amount)}
      </div>
    </div>
  )
}
