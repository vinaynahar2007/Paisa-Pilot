// PaisaPilot financial engine: single source of truth for every figure.
// Model: available = income - expenses - savingsTransfers (never clamped).
// Upcoming = active commitments due today or later (counted exactly once).
// Forecast = available - upcoming - expectedDaily x remainingDays (estimate).
export const TOTAL_DAYS = 30;
export const BASELINE_DAILY_SPEND = 200;
export const MIN_HISTORY_DAYS = 3;
export const STORAGE_KEY = 'paisapilot-state-v2';
export type TxKind = 'expense' | 'income' | 'saving';
export type Tx = { id: string; title: string; category: string; amount: number; day: number; kind: TxKind };
export type Commitment = { id: string; name: string; amount: number; day: number; active: boolean; kind: 'bill' | 'subscription' };
export type Goal = { id: string; name: string; target: number; saved: number; color: string };
export type FinanceState = { version: 2; transactions: Tx[]; commitments: Commitment[]; goals: Goal[]; day: number };
export type DecisionKind = 'purchase' | 'unexpected' | 'saving' | 'income' | 'subscription';
export type DecisionInput = { kind: DecisionKind; amount: number; title: string; category: string; goalId?: string; dueDay?: number };
export type RiskLevel = 'Low' | 'Watch' | 'High';
export type HealthStatus = 'Healthy' | 'Caution' | 'At Risk';
export interface Snapshot { available: number; upcoming: number; spendable: number; daily: number; remainingDays: number; forecast: number; expectedDaily: number; usedBaseline: boolean; savedTotal: number; goalSaved: number | null; risk: RiskLevel; health: HealthStatus }
export interface HealthReport { status: HealthStatus; reasons: string[]; suggestions: string[] }
export interface ForecastAssumptions { available: number; upcoming: number; expectedDaily: number; usedBaseline: boolean; remainingDays: number; forecast: number }
export interface Preview { before: Snapshot; after: Snapshot; deltas: { available: number; daily: number; forecast: number; upcoming: number; goal: number | null }; headline: string; blocksDecision: string | null }
export const money = (n: number): string => (n < 0 ? '-₹' : '₹') + Math.round(Math.abs(n)).toLocaleString('en-IN');
export const uid = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
export function demoState(): FinanceState {
  return { version: 2, day: 8,
    transactions: [
      { id: 'tx-opening', title: 'Monthly allowance', category: 'Income', amount: 10000, day: 1, kind: 'income' },
      { id: 'tx-2', title: 'Groceries & essentials', category: 'Food', amount: 480, day: 2, kind: 'expense' },
      { id: 'tx-3', title: 'Metro recharge', category: 'Transport', amount: 300, day: 3, kind: 'expense' },
      { id: 'tx-4', title: 'Coffee with friends', category: 'Lifestyle', amount: 160, day: 4, kind: 'expense' },
      { id: 'tx-5', title: 'Lunch', category: 'Food', amount: 130, day: 5, kind: 'expense' },
      { id: 'tx-6', title: 'Streaming subscription', category: 'Subscriptions', amount: 199, day: 6, kind: 'expense' },
      { id: 'tx-7', title: 'Groceries', category: 'Food', amount: 360, day: 7, kind: 'expense' },
      { id: 'tx-8', title: 'Weekend plans', category: 'Lifestyle', amount: 220, day: 8, kind: 'expense' },
      { id: 'tx-9', title: 'Emergency cushion contribution', category: 'Savings', amount: 1200, day: 7, kind: 'saving' },
    ],
    commitments: [
      { id: 'c-1', name: 'Phone recharge', amount: 299, day: 12, active: true, kind: 'bill' },
      { id: 'c-2', name: 'Music subscription', amount: 119, day: 15, active: true, kind: 'subscription' },
      { id: 'c-3', name: 'Shared utilities', amount: 650, day: 20, active: true, kind: 'bill' },
      { id: 'c-4', name: 'Video streaming', amount: 199, day: 24, active: true, kind: 'subscription' },
    ],
    goals: [
      { id: 'g-1', name: 'Emergency cushion', target: 2000, saved: 1200, color: '#c8f36b' },
      { id: 'g-2', name: 'New headphones', target: 3000, saved: 0, color: '#b8a4ff' },
    ] };
}
function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
export function validateState(raw: unknown): FinanceState | null {
  try {
    if (!isRecord(raw)) return null;
    const day = Number(raw.day);
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) return null;
    if (!Array.isArray(raw.transactions) || !Array.isArray(raw.commitments) || !Array.isArray(raw.goals)) return null;
    const seen = new Set<string>();
    const transactions: Tx[] = [];
    for (const t of raw.transactions as unknown[]) {
      if (!isRecord(t)) return null;
      const id = String(t.id ?? '');
      if (!id || seen.has(id)) return null; seen.add(id);
      const amount = Number(t.amount); const d = Number(t.day); const kind = String(t.kind);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;
      if (!Number.isInteger(d) || d < 1 || d > TOTAL_DAYS) return null;
      if (kind !== 'expense' && kind !== 'income' && kind !== 'saving') return null;
      transactions.push({ id, title: String(t.title ?? 'Transaction').slice(0, 60) || 'Transaction', category: String(t.category ?? 'Other').slice(0, 24) || 'Other', amount: Math.round(amount), day: d, kind: kind as TxKind });
    }
    const commitments: Commitment[] = [];
    for (const c of raw.commitments as unknown[]) {
      if (!isRecord(c)) return null;
      const id = String(c.id ?? '');
      if (!id || seen.has(id)) return null; seen.add(id);
      const amount = Number(c.amount); const d = Number(c.day);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;
      if (!Number.isInteger(d) || d < 1 || d > TOTAL_DAYS) return null;
      commitments.push({ id, name: String(c.name ?? 'Commitment').slice(0, 60) || 'Commitment', amount: Math.round(amount), day: d, active: c.active !== false, kind: c.kind === 'subscription' ? 'subscription' : 'bill' });
    }
    const goalsOut: Goal[] = [];
    for (const g of raw.goals as unknown[]) {
      if (!isRecord(g)) return null;
      const id = String(g.id ?? '');
      if (!id || seen.has(id)) return null; seen.add(id);
      const target = Number(g.target); const saved = Number(g.saved);
      if (!Number.isFinite(target) || target <= 0 || target > 1000000) return null;
      if (!Number.isFinite(saved) || saved < 0 || saved > target) return null;
      goalsOut.push({ id, name: String(g.name ?? 'Goal').slice(0, 60) || 'Goal', target: Math.round(target), saved: Math.round(saved), color: typeof g.color === 'string' ? g.color.slice(0, 24) : '#c8f36b' });
    }
    if (transactions.length === 0 || goalsOut.length === 0) return null;
    if (!transactions.some((t) => t.kind === 'income' && t.day === 1)) return null;
    return { version: 2, transactions, commitments, goals: goalsOut, day };
  } catch { return null; }
}
export function migrateLegacy(raw: unknown): FinanceState | null {
  try {
    if (!isRecord(raw)) return null;
    if ((raw as Record<string, unknown>).version === 2) return validateState(raw);
    if (!Array.isArray(raw.transactions) || !Array.isArray(raw.commitments) || !Array.isArray(raw.goals)) return null;
    let n = 0;
    const nid = (p: string): string => `${p}-${Date.now()}-${n++}`;
    const txs = (raw.transactions as Record<string, unknown>[]).map((t) => ({ id: typeof t.id === 'string' ? t.id : nid('tx'), title: String(t.title ?? 'Transaction').slice(0, 60), category: String(t.category ?? 'Other').slice(0, 24), amount: Math.round(Number(t.amount)), day: Math.min(30, Math.max(1, Number(t.day) || 1)), kind: (['expense', 'income', 'saving'] as string[]).includes(String(t.kind)) ? (t.kind as TxKind) : 'expense' as TxKind }));
    const cms = (raw.commitments as Record<string, unknown>[]).map((c) => ({ id: typeof c.id === 'string' ? c.id : nid('c'), name: String(c.name ?? 'Commitment').slice(0, 60), amount: Math.round(Number(c.amount)), day: Math.min(30, Math.max(1, Number(c.day) || 1)), active: c.active !== false, kind: (c.kind === 'subscription' ? 'subscription' : 'bill') as 'bill' | 'subscription' }));
    const gls = (raw.goals as Record<string, unknown>[]).map((g) => ({ id: typeof g.id === 'string' ? g.id : nid('g'), name: String(g.name ?? 'Goal').slice(0, 60), target: Math.round(Number(g.target)), saved: Math.min(Math.round(Number(g.target)), Math.max(0, Math.round(Number(g.saved)))), color: typeof g.color === 'string' ? g.color : '#c8f36b' }));
    const day = Number(raw.day);
    return validateState({ version: 2, day: Math.min(30, Math.max(1, Number.isFinite(day) ? day : 8)), transactions: txs, commitments: cms, goals: gls });
  } catch { return null; }
}
export function loadPersisted(): FinanceState {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) { const p = validateState(JSON.parse(v2)); if (p) return p; }
    const v1 = localStorage.getItem('paisapilot-state-v1');
    if (v1) { const m = migrateLegacy(JSON.parse(v1)); if (m) return m; }
  } catch { /* demo fallback */ }
  return demoState();
}
export function incomeTotal(s: FinanceState): number { return s.transactions.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0); }
export function expenseTotal(s: FinanceState): number { return s.transactions.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0); }
export function savingsTransfers(s: FinanceState): number { return s.transactions.filter((t) => t.kind === 'saving').reduce((a, t) => a + t.amount, 0); }
export function availableCash(s: FinanceState): number { return incomeTotal(s) - expenseTotal(s) - savingsTransfers(s); }
export function savedTotal(s: FinanceState): number { return s.goals.reduce((a, g) => a + g.saved, 0); }
export function upcomingTotal(s: FinanceState): number { return s.commitments.filter((c) => c.active && c.day >= s.day).reduce((a, c) => a + c.amount, 0); }
export function remainingDays(s: FinanceState): number { return Math.max(0, TOTAL_DAYS - s.day + 1); }
export function spendableCash(s: FinanceState): number { return availableCash(s) - upcomingTotal(s); }
export function dailyAllowance(s: FinanceState): number { const r = remainingDays(s); if (r <= 0) return spendableCash(s); return spendableCash(s) / r; }
export function expectedDailySpend(s: FinanceState): { value: number; usedBaseline: boolean } {
  const elapsed = Math.max(1, Math.min(s.day, TOTAL_DAYS));
  const spent = expenseTotal(s);
  if (s.day >= MIN_HISTORY_DAYS && spent > 0) return { value: spent / elapsed, usedBaseline: false };
  return { value: BASELINE_DAILY_SPEND, usedBaseline: true };
}
export function monthEndForecast(s: FinanceState): ForecastAssumptions {
  const avail = availableCash(s); const up = upcomingTotal(s); const r = remainingDays(s);
  const ex = expectedDailySpend(s);
  return { available: avail, upcoming: up, expectedDaily: ex.value, usedBaseline: ex.usedBaseline, remainingDays: r, forecast: avail - up - ex.value * r };
}
export function riskLevel(s: FinanceState): RiskLevel {
  const avail = availableCash(s); const up = upcomingTotal(s);
  const daily = dailyAllowance(s); const fc = monthEndForecast(s).forecast;
  if (avail < 0 || avail < up || fc < 0) return 'High';
  const ratio = avail > 0 ? up / avail : 1;
  if (ratio > 0.35 || daily < 100) return 'Watch';
  return 'Low';
}
export function healthReport(s: FinanceState): HealthReport {
  const avail = availableCash(s); const up = upcomingTotal(s);
  const daily = dailyAllowance(s); const r = remainingDays(s);
  const fc = monthEndForecast(s).forecast;
  const totalTarget = s.goals.reduce((a, g) => a + g.target, 0);
  const progress = totalTarget > 0 ? savedTotal(s) / totalTarget : 0;
  const reasons: string[] = []; const suggestions: string[] = [];
  let status: HealthStatus = 'Healthy';
  if (avail < 0) { status = 'At Risk'; reasons.push(`Available cash is ${money(avail)} — spending has exceeded income.`); suggestions.push('Pause non-essential spending and review recent activity.'); }
  else if (avail < up) { status = 'At Risk'; reasons.push(`${money(up)} in upcoming commitments exceeds ${money(avail)} available.`); suggestions.push('Pause a subscription before spending more.'); }
  else reasons.push(`${money(up)} in commitments is covered by ${money(avail)} available.`);
  if (fc < 0) { status = 'At Risk'; reasons.push(`At your current pace you end at ${money(fc)} (shortfall).`); suggestions.push(`Trim about ${money(Math.ceil(Math.abs(fc) / Math.max(1, r)))} per day or reduce a commitment.`); }
  else if (fc < 500) { if (status === 'Healthy') status = 'Caution'; reasons.push(`Month-end buffer is thin at ${money(fc)}.`); suggestions.push('Keep spending near the daily guide.'); }
  else reasons.push(`Projected month-end balance is ${money(fc)}.`);
  if (daily < 0) { if (status !== 'At Risk') status = 'Caution'; reasons.push('Daily allowance is negative — commitments exceed cash.'); }
  else if (daily < 100) { if (status === 'Healthy') status = 'Caution'; reasons.push(`Daily allowance is tight at ${money(daily)} per day.`); suggestions.push('Favour low-cost days for a while.'); }
  if (progress <= 0.05) { reasons.push('Savings goals are just getting started.'); if (status === 'Healthy') suggestions.push('A small recurring contribution builds momentum safely.'); }
  else reasons.push(`${Math.round(progress * 100)}% saved toward your goals.`);
  if (suggestions.length === 0) suggestions.push('You are on track — simulate decisions before acting.');
  return { status, reasons, suggestions };
}
export function snapshot(s: FinanceState, goalId?: string | null): Snapshot {
  const f = monthEndForecast(s);
  const goal = goalId ? s.goals.find((g) => g.id === goalId) ?? null : null;
  return { available: availableCash(s), upcoming: upcomingTotal(s), spendable: spendableCash(s), daily: dailyAllowance(s), remainingDays: remainingDays(s), forecast: f.forecast, expectedDaily: f.expectedDaily, usedBaseline: f.usedBaseline, savedTotal: savedTotal(s), goalSaved: goal ? goal.saved : null, risk: riskLevel(s), health: healthReport(s).status };
}
export function projectionSeries(s: FinanceState): { day: string; balance: number; raw: number }[] {
  const avail = availableCash(s);
  const expected = expectedDailySpend(s).value;
  const due = new Map<number, number>();
  for (const c of s.commitments) { if (!c.active || c.day < s.day) continue; due.set(c.day, (due.get(c.day) ?? 0) + c.amount); }
  const rows: { day: string; balance: number; raw: number }[] = [];
  for (let d = s.day; d <= TOTAL_DAYS; d++) {
    const i = d - s.day;
    let dd = 0;
    for (let k = s.day + 1; k <= d; k++) dd += due.get(k) ?? 0;
    const raw = Math.round(avail - expected * i - dd);
    rows.push({ day: `D${d}`, balance: raw, raw });
  }
  return rows;
}
export function validateDecision(s: FinanceState, input: DecisionInput): string | null {
  const amt = input.amount;
  if (!Number.isFinite(amt) || amt <= 0) return 'Enter an amount greater than ₹0.';
  if (Math.round(amt) !== amt) return 'Use a whole-rupee amount.';
  if (amt > 100000) return 'That amount is too large for this 30-day plan.';
  const avail = availableCash(s);
  if (input.kind === 'purchase' || input.kind === 'unexpected') {
    if (amt > avail) return `This ${money(amt)} move exceeds your ${money(avail)} available. Try a smaller amount.`;
    return null;
  }
  if (input.kind === 'saving') {
    const goal = s.goals.find((g) => g.id === input.goalId) ?? s.goals[0];
    if (!goal) return 'Pick a savings goal first.';
    const room = goal.target - goal.saved;
    if (room <= 0) return `"${goal.name}" is already fully funded.`;
    if (amt > room) return `Only ${money(room)} fits in "${goal.name}". Try ${money(room)} or less.`;
    if (amt > avail) return `This exceeds your ${money(avail)} available. Try a smaller contribution.`;
    return null;
  }
  if (input.kind === 'income') return null;
  const due = input.dueDay ?? 20;
  if (!Number.isInteger(due) || due < 1 || due > TOTAL_DAYS) return 'Pick a due day between 1 and 30.';
  if (!input.title.trim()) return 'Give the commitment a name.';
  return null;
}
export function previewDecision(s: FinanceState, input: DecisionInput): Preview {
  const goalId = input.kind === 'saving' ? (input.goalId ?? s.goals[0]?.id ?? null) : null;
  const before = snapshot(s, goalId);
  const h: FinanceState = JSON.parse(JSON.stringify(s)) as FinanceState;
  if (input.kind === 'purchase' || input.kind === 'unexpected' || input.kind === 'income') {
    h.transactions.push({ id: 'preview', title: input.title || 'Preview', category: input.category || 'Other', amount: Math.round(input.amount), day: h.day, kind: input.kind === 'income' ? 'income' : 'expense' });
  } else if (input.kind === 'saving') {
    h.transactions.push({ id: 'preview', title: input.title || 'Saving', category: 'Savings', amount: Math.round(input.amount), day: h.day, kind: 'saving' });
    const g = h.goals.find((x) => x.id === goalId);
    if (g) g.saved = Math.min(g.target, g.saved + Math.round(input.amount));
  } else {
    h.commitments.push({ id: 'preview', name: input.title || 'Commitment', amount: Math.round(input.amount), day: input.dueDay ?? 20, active: true, kind: 'subscription' });
  }
  const after = snapshot(h, goalId);
  const label = input.kind === 'purchase' ? 'Buying this' : input.kind === 'unexpected' ? 'This unexpected expense' : input.kind === 'saving' ? 'Saving this' : input.kind === 'income' ? 'Adding this income' : 'Adding this commitment';
  const nm = input.title.trim() ? ` "${input.title.trim()}"` : '';
  const headline = input.kind === 'subscription'
    ? `${label}${nm} for ${money(input.amount)} reserves ${money(after.upcoming - before.upcoming)} more, moves daily allowance to ${money(after.daily)}, and changes month-end by ${money(after.forecast - before.forecast)}.`
    : `${label}${nm} for ${money(input.amount)} leaves ${money(after.available)} available, moves daily allowance to ${money(after.daily)}, and changes month-end by ${money(after.forecast - before.forecast)}.`;
  return { before, after, deltas: { available: after.available - before.available, daily: after.daily - before.daily, forecast: after.forecast - before.forecast, upcoming: after.upcoming - before.upcoming, goal: after.goalSaved != null && before.goalSaved != null ? after.goalSaved - before.goalSaved : null }, headline, blocksDecision: validateDecision(s, input) };
}
export function applyDecision(s: FinanceState, input: DecisionInput): FinanceState {
  const err = validateDecision(s, input);
  if (err) throw new Error(err);
  const amount = Math.round(input.amount);
  if (input.kind === 'subscription') return { ...s, commitments: [...s.commitments, { id: uid(), name: input.title.trim() || 'New commitment', amount, day: input.dueDay ?? 20, active: true, kind: 'subscription' }] };
  const kind: TxKind = input.kind === 'income' ? 'income' : input.kind === 'saving' ? 'saving' : 'expense';
  const category = input.kind === 'income' ? 'Income' : input.kind === 'saving' ? 'Savings' : input.kind === 'unexpected' ? 'Unexpected' : (input.category || 'Other');
  const fallback = input.kind === 'unexpected' ? 'Unexpected expense' : input.kind === 'saving' ? 'Savings contribution' : input.kind === 'income' ? 'Extra income' : 'Purchase';
  const goalId = input.kind === 'saving' ? (input.goalId ?? s.goals[0]?.id) : undefined;
  const tx: Tx = { id: uid(), title: input.title.trim() || fallback, category, amount, day: s.day, kind };
  return { ...s, transactions: [...s.transactions, tx], goals: input.kind === 'saving' ? s.goals.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g)) : s.goals };
}
export function expensesByCategory(s: FinanceState): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const t of s.transactions) { if (t.kind !== 'expense') continue; acc[t.category] = (acc[t.category] ?? 0) + t.amount; }
  return acc;
}
export function toCsv(s: FinanceState): string {
  const rows: (string | number)[][] = [['ID', 'Day', 'Title', 'Category', 'Amount', 'Type']];
  const sorted = [...s.transactions].sort((a, b) => a.day - b.day || (a.id < b.id ? -1 : 1));
  for (const t of sorted) rows.push([t.id, t.day, t.title, t.category, t.amount, t.kind]);
  return rows.map((row) => row.map((v) => `"${String(v).split('"').join('""')}"`).join(',')).join('\n');
}
