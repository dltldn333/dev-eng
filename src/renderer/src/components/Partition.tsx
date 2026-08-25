import type { ReactNode } from 'react'

interface Props {
  title: string
  count?: number
  children: ReactNode
}

export function Partition({ title, count, children }: Props): React.JSX.Element {
  return (
    <section className="flex min-w-0 flex-col">
      <h3 className="mb-2 flex items-baseline gap-2 text-xs font-medium text-neutral-400">
        {title}
        {count !== undefined && count > 0 && <span className="tabular-nums">{count}</span>}
      </h3>
      {children}
    </section>
  )
}
