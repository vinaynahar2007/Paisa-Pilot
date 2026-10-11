import { Inbox } from 'lucide-react'

/** Friendly empty state for lists that can legitimately have no rows. */
export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true"><Inbox size={22} /></div>
      <strong>{title}</strong>
      {hint && <p>{hint}</p>}
    </div>
  )
}
