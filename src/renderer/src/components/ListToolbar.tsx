import type { EntrySort } from '@shared/schemas'
import { useListPreferences } from '../preferences/context'

const SORT_LABEL: Record<EntrySort, string> = {
  text: '표기',
  created: '등록일',
  visits: '방문 수'
}

const SELECT =
  'rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-600 outline-none focus:border-neutral-400'

export function ListToolbar(): React.JSX.Element {
  const { sort, direction, set } = useListPreferences()

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="정렬 기준"
        value={sort}
        onChange={(event) => set({ sort: event.target.value as EntrySort })}
        className={SELECT}
      >
        {(Object.keys(SORT_LABEL) as EntrySort[]).map((option) => (
          <option key={option} value={option}>
            {SORT_LABEL[option]}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label={direction === 'asc' ? '오름차순' : '내림차순'}
        title={direction === 'asc' ? '오름차순' : '내림차순'}
        onClick={() => set({ direction: direction === 'asc' ? 'desc' : 'asc' })}
        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-600 transition-colors hover:border-neutral-400"
      >
        {direction === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  )
}
