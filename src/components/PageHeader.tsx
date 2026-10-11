import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  titleStart: string
  titleHighlight: string
  copy: string
  action?: ReactNode
}

/** Shared heading block for the Overview welcome and the three inner pages. */
export default function PageHeader({ eyebrow, titleStart, titleHighlight, copy, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div>
        <h1>{titleStart}<br /><span>{titleHighlight}</span></h1>
        <p className="welcome-copy">{copy}</p>
      </div>
      {action}
    </div>
  )
}
