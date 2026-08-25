import type { ReactNode } from 'react'

interface Props {
  title: string
  count?: number
  action?: ReactNode
  children: ReactNode
}

export function Partition({ title, count, action, children }: Props): React.JSX.Element {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-xs font-medium text-neutral-400">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-neutral-400 tabular-nums">{count}</span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}
