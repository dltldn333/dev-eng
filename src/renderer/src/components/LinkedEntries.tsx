import type { LinkedEntry } from '@shared/types'

interface Props {
  entries: LinkedEntry[]
  emptyText: string
  onOpen: (id: number) => void
}

export function LinkedEntries({ entries, emptyText, onOpen }: Props): React.JSX.Element {
  if (entries.length === 0) {
    return <p className="px-2 py-2 text-sm text-neutral-400">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            onClick={() => onOpen(entry.id)}
            className="w-full rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            {entry.text}
          </button>
        </li>
      ))}
    </ul>
  )
}
