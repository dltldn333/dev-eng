import type { Entry } from '@shared/types'
import { VisitMeter } from './VisitMeter'

interface Props {
  entry: Entry
  /** 목록 안에서의 최대 방문 수. 막대의 눈금이 된다. */
  maxVisits: number
  onOpen: (id: number) => void
}

export function EntryListItem({ entry, maxVisits, onOpen }: Props): React.JSX.Element {
  // 문장은 길어서 목록에서 줄바꿈되면 훑기 어렵다. 한 줄로 자른다.
  const single = entry.layer === 'sentence'

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(entry.id)}
        className="group flex w-full items-baseline gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-100"
      >
        <span
          className={
            single
              ? 'min-w-0 flex-1 truncate text-[15px] text-neutral-800'
              : 'min-w-0 flex-1 truncate text-[15px] font-medium text-neutral-900'
          }
        >
          {entry.text}
        </span>

        {entry.tags.length > 0 && (
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500"
              >
                {tag}
              </span>
            ))}
          </span>
        )}

        {entry.memo && (
          <span className="hidden max-w-[30%] shrink-0 truncate text-sm text-neutral-400 sm:block">
            {entry.memo}
          </span>
        )}

        <VisitMeter count={entry.visitCount} max={maxVisits} />
      </button>
    </li>
  )
}
