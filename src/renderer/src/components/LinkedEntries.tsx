import type { LinkedEntry } from '@shared/types'

interface Props {
  entries: LinkedEntry[]
  emptyText: string
  onOpen: (id: number) => void
  onRemove: (entry: LinkedEntry) => void
}

export function LinkedEntries({ entries, emptyText, onOpen, onRemove }: Props): React.JSX.Element {
  if (entries.length === 0) {
    return <p className="px-2 py-2 text-sm text-neutral-400">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li key={entry.id} className="group flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpen(entry.id)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <span className="min-w-0 flex-1 truncate">{entry.text}</span>
            <OriginBadge origin={entry.origin} />
          </button>

          <button
            type="button"
            aria-label="연결 끊기"
            title="연결 끊기"
            onClick={() => onRemove(entry)}
            className="rounded-lg px-2 py-1 text-sm text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * 규칙이 건 연결과 사람이 건 연결을 구분해 보여준다.
 * 자동 연결은 틀릴 수 있다는 사실이 화면에 남아 있어야 끊을지 말지 판단할 수 있다.
 */
function OriginBadge({ origin }: { origin: LinkedEntry['origin'] }): React.JSX.Element {
  return origin === 'auto' ? (
    <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-400">
      자동
    </span>
  ) : (
    <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] text-white">
      직접
    </span>
  )
}
