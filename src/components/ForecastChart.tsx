import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { money, monthEndForecast, projectionSeries, type FinanceState } from '../finance'

/**
 * Forecast chart for the Overview page.
 * Extracted so it can be code-split (recharts is the largest dependency)
 * and given an accessible text summary for screen readers.
 */
export default function ForecastChart({ state }: { state: FinanceState }) {
  const projected = projectionSeries(state)
  const forecast = monthEndForecast(state)
  const last = projected[projected.length - 1]
  const summary = last
    ? `Projected balance moves from ${money(projected[0]?.raw ?? 0)} on day ${state.day} to ${money(last.raw)} by day 30, at an estimated ${money(forecast.expectedDaily)} per day with ${money(forecast.upcoming)} in commitments reserved.`
    : 'No forecast data available for the remaining days.'

  return (
    <figure className="chart-figure">
      <div
        className="chart-area"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projected} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b7e86a" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#b7e86a" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9ece4" />
            <XAxis
              dataKey="day" tickLine={false} axisLine={false}
              tick={{ fontSize: 11, fill: '#66705e' }}
              interval={Math.max(0, Math.floor(projected.length / 6) - 1)}
            />
            <YAxis
              tickLine={false} axisLine={false} width={46}
              tick={{ fontSize: 11, fill: '#66705e' }}
              tickFormatter={v => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`)}
            />
            <Tooltip
              formatter={(v) => [money(Number(v)), 'Projected balance']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e6e9e1', fontSize: 13, boxShadow: '0 8px 30px #17210c12' }}
            />
            <Area type="monotone" dataKey="balance" stroke="#7fae37" strokeWidth={2.5} fill="url(#balanceGradient)" activeDot={{ r: 5, strokeWidth: 0, fill: '#7fae37' }} />
            {state.commitments.filter(c => c.active && c.day >= state.day).map(c => (
              <ReferenceDot key={c.id} x={`D${c.day}`} y={projected.find(p => p.day === `D${c.day}`)?.balance ?? 0} r={4} fill="#d4a05a" stroke="#fff" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
