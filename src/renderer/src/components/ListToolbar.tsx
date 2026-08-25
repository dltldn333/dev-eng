import { useEffect } from 'react'
import type { EntrySort } from '@shared/schemas'
import type { Tag } from '@shared/types'
import { useListPreferences } from '../preferences/context'

const SORT_LABEL: Record<EntrySort, string> = {
  text: '표기',
  created: '등록일',
  visits: '방문 수'
}

const SELECT =
  'rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-600 outline-none focus:border-neutral-400'

export function ListToolbar({ tags }: { tags: Tag[] | undefined }): React.JSX.Element {
  const { sort, direction, tagId, set } = useListPreferences()

  /**
   * 마지막 항목에서 태그를 떼면 그 태그는 사라진다. 저장해둔 필터가 그 태그를 가리키고 있으면
   * 목록이 이유 없이 비어 보이므로, 없는 태그를 가리키게 된 필터는 풀어준다.
   */
  useEffect(() => {
    if (!tags || tagId === null) return
    if (!tags.some((tag) => tag.id === tagId)) set({ tagId: null })
  }, [tags, tagId, set])

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="태그 필터"
        value={tagId ?? ''}
        onChange={(event) => set({ tagId: event.target.value ? Number(event.target.value) : null })}
        className={SELECT}
      >
        <option value="">태그 전체</option>
        {(tags ?? []).map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

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
