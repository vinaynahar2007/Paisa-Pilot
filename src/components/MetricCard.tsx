import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  detail: string
  tone: string
  progress?: number
  risk?: string
  trend?: boolean
}

export default function MetricCard({ icon, label, value, detail, tone, progress, risk, trend }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${risk === 'High' ? 'risk-high' : risk === 'Watch' ? 'risk-watch' : ''}`}>{value}</div>
      <div className="metric-detail">
        {trend !== undefined && (
          <span className={trend ? 'trend-up' : 'trend-down'}>{trend ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}</span>
        )}
        {detail}
      </div>
      {progress !== undefined && (
        <div className="metric-progress">
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  )
}
