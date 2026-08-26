import type { ReactNode } from 'react'

interface Props {
  title: string
  count?: number
  /** 레이어를 구분하는 색. 제목에만 얹어서 훑을 때 갈래가 보이게 한다. */
  accent?: string
  action?: ReactNode
  children: ReactNode
}

export function Partition({ title, count, accent, action, children }: Props): React.JSX.Element {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-baseline gap-2">
        {accent && (
          <span
            aria-hidden
            className="size-1.5 self-center rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        <h3 className="text-xs font-medium" style={accent ? { color: accent } : undefined}>
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-neutral-400 tabular-nums">{count}</span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}
