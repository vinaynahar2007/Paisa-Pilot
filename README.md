# Paisa Pilot 💸

**Make your money make sense.**

PaisaPilot is a client-side personal finance app that helps you plan a **₹10,000 budget across a 30-day challenge**, simulate money decisions before you make them, and stay on track with a safe daily spending allowance. No backend, no sign-up — your data stays in your browser.

> A little more clarity today. A lot more freedom tomorrow.

---
## ✨ Features

- **Overview dashboard**
  - Available balance, income, spending, and savings at a glance
  - **Safe-to-spend daily allowance** (balance minus upcoming commitments, spread across remaining days)
  - Month-end forecast with a projection chart
  - Financial health report with risk level (Low / Watch / High) and suggestions
  - Budget ring showing day-by-day progress through the 30-day challenge

- **Decision simulator**
  - Preview any money move **before** committing to it: *Purchase, Unexpected expense, Save, Income, or Recurring commitment*
  - Shows before/after snapshots and how the move changes your daily allowance and month-end forecast
  - Blocks decisions that would put you at risk, then applies the decision to your plan when you're ready

- **Transactions**
  - Full activity history with filters (All / Expense / Income / Savings)
  - **Export to CSV** (`paisapilot-transactions.csv`)

- **Goals & savings**
  - Track savings goals with progress bars and contribution prompts
  - Emergency-cushion-first guidance

- **Commitments**
  - Upcoming bills and subscriptions with due days
  - Pause/activate toggles that immediately recalculate your forecast
  - Add new commitments with validation

- **Extras**
  - Persistent state via `localStorage` (with migration from the v1 storage key)
  - One-click **demo data reset**
  - Toast notifications, keyboard support (Esc closes modals), and a responsive mobile navigation drawer

---
## 🛠 Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Framework  | React 18 (TypeScript, function components)   |
| Build tool | Vite 6 (`@vitejs/plugin-react`)              |
| Charts     | Recharts (lazy-loaded via `Suspense`, main bundle ~592 KB → ~204 KB gzipped) |
| Icons      | lucide-react                                 |
| Styling    | Hand-rolled CSS (`src/styles.css`), DM Sans + Space Grotesk fonts |
| Language   | TypeScript ~5.6 (strict mode)                |
| Persistence| Browser `localStorage`                                 |

---
## 🌐 Deployment & Security Headers (Vercel)

`Vercel.json` pins routing and a strict, least-privilege Security Header set:

- **CSP** — `default-src 'self'` with `script-src 'self'`, `style-src 'self'`, `object-src 'none'`, `media-src 'none'`, `worker-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. **No `'unsafe-eval'`.**
- **Permissions-Policy** — every unused capability disabled (`geolocation=(), microphone=(), camera=()`, …).
- **Referrer-Policy** — `strict-origin-when-cross-origin`.
- **X-Content-Type-Options** — `nosniff`.
- **X-Frame-Options** — `DENY` (`frame-ancestors 'none'` in the CSP too).
- **SPA fallback** — all client-side routes rewrite to `index.html`.

---
## ♿ Accessibility & Responsiveness

- **Keyboard:** skip link, visible `focus-visible` rings, modal focus trap + Escape close + scroll lock + focus restore, drawer nav closes on Escape and restores focus, large touch targets on coarse pointers.
- **ARIA:** `aria-current`, `aria-pressed`, `aria-expanded` + `aria-controls`, `role="img"` with accessible summaries, `aria-live` regions for toasts, preserved semantics (`<nav>`, `<aside>`, `<main>`, `<button>`) — the `<aside>` is never a hidden `div`.
- **Visual:** continuous type scale via `clamp()` (no more 8–12px gaps), AA contrast, reflow-friendly grids, no pixel hacks at breakpoints.
- **Media:** `prefers-reduced-motion` support and forced-colors fallbacks.

---
### Prerequisites

- **Node.js** 18+ and **npm**

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
```

Outputs the optimized site to `dist/` (runs `tsc -b` for type checking first).

### Preview the production build

```bash
npm run preview
```

---
## 📁 Project Structure

```
paisapilot/
├── vercel.json             # Vercel config: routing + security headers
├── README.md
├── index.html
├── package.json
├── tsconfig*.json
├── vite.config.ts
├── src/
│   ├── components/         # Reusable, accessible UI primitives
│   │   ├── AddCommitmentModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ForecastChart.tsx   # Recharts lazy-loaded via Suspense
│   │   ├── MetricCard.tsx
│   │   ├── PacePanel.tsx
│   │   ├── PageHeader.tsx
│   │   ├── SimulatorModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── TransactionRow.tsx
│   │   └── index.ts
│   ├── hooks/              # Cross-cutting UI behavior
│   │   └── useDialogBehavior.ts   # Focus trap / Escape / scroll lock / focus restore
│   ├── pages/              # Route-level screens
│   │   ├── CommitmentsPage.tsx
│   │   ├── GoalsPage.tsx
│   │   ├── OverviewPage.tsx
│   │   └── TransactionsPage.tsx
│   ├── App.tsx             # Thin shell: routes + modals + toast + app state
│   ├── finance.ts          # 💰 Financial engine (pure, testable helpers)
│   └── styles.css          # All styling (mobile-first, accessible)
└── dist/                   # Production build output (gitignored)
```

### Pages & routing

| Route               | Component            |
| ------------------- | -------------------- |
| `/`                 | Overview             |
| `/transactions`     | Transactions         |
| `/goals`            | Goals & savings      |
| `/commitments`      | Commitments          |

---
## 💰 The Financial Model (`src/finance.ts`)

All figures come from a single engine — the UI never computes money math on its own.

```
available   = income − expenses − savingsTransfers      (never clamped)
upcoming    = active commitments due today or later      (counted exactly once)
spendable   = available − upcoming
daily       = spendable ÷ remaining days                 (safe-to-spend allowance)
forecast    = available − upcoming − expectedDaily × remainingDays   (estimate)
```

Key constants:

| Constant                | Value | Meaning                                  |
| ----------------------- | ----- | ---------------------------------------- |
| `TOTAL_DAYS`            | 30    | Length of the challenge                  |
| `BASELINE_DAILY_SPEND`  | 200   | Fallback daily spend estimate            |
| `MIN_HISTORY_DAYS`      | 3     | Days of history needed before using real averages |
| `STORAGE_KEY`           | `paisapilot-state-v2` | `localStorage` key (auto-migrates from `paisapilot-state-v1`) |

Risk levels: **Low**, **Watch**, **High** — derived from your forecast, upcoming commitments, and spending pace.

---
## 🗃 Data & Storage

- State is persisted to `localStorage` under `paisapilot-state-v2` on every change.
- The app seeds a **demo state** (₹10,000 income, sample transactions, goals, and commitments) so it works out of the box.
- Use **Reset demo data** in the sidebar (or the footer) to restore the sample data at any time.
- Everything runs locally — nothing is sent to a server.

---
## 📦 Scripts

| Script            | Command             | Description                                |
| ----------------- | ------------------- | ------------------------------------------ |
| `dev`             | `npm run dev`       | Start Vite dev server with HMR            |
| `build`           | `npm run build`     | Type-check (`tsc -b`) and build to `dist/` |
| `preview`         | `npm run preview`   | Serve the production build locally         |

---
## 🌐 Repository

Source: [github.com/vinaynahar2007/Paisa-Pilot](https://github.com/vinaynahar2007/Paisa-Pilot)

---
*Make your money make sense.* 🚀
