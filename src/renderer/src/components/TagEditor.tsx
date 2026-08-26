import { useState, type KeyboardEvent } from 'react'
import type { Entry } from '@shared/types'
import { useTags } from '../hooks/useEntries'
import { useAssignTag, useUnassignTag } from '../hooks/useTagMutations'
import { useNavigation } from '../navigation/context'

export function TagEditor({ entry }: { entry: Entry }): React.JSX.Element {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const assign = useAssignTag()
  const unassign = useUnassignTag()
  const { go } = useNavigation()
  const { data: allTags } = useTags()

  function commit(): void {
    const trimmed = name.trim()
    if (!trimmed) return
    assign.mutate({ entryId: entry.id, name: trimmed })
    setName('')
    setAdding(false)
  }

  // 태그 이름은 한글로 적는 일이 많다. 조합 중의 Enter는 글자를 확정하는 키다.
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
    if (event.key === 'Escape') {
      setName('')
      setAdding(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entry.tags.map((tag) => (
        <span
          key={tag}
          className="group inline-flex items-center gap-1 rounded-full bg-neutral-100 py-1 pr-1.5 pl-2.5 text-xs text-neutral-600"
        >
          <button
            type="button"
            title="태그 열기"
            onClick={() => {
              const found = allTags?.find((candidate) => candidate.name === tag)
              if (found) go({ kind: 'tag', id: found.id })
            }}
            className="transition-colors hover:text-neutral-900 hover:underline"
          >
            {tag}
          </button>
          <button
            type="button"
            aria-label={`${tag} 태그 떼기`}
            onClick={() => unassign.mutate({ entryId: entry.id, name: tag })}
            className="rounded-full px-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
          >
            ×
          </button>
        </span>
      ))}

      {adding ? (
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder="태그"
          className="w-24 rounded-full border border-neutral-300 px-2.5 py-1 text-xs outline-none focus:border-neutral-500"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          + 태그
        </button>
      )}

      {(assign.error ?? unassign.error) && (
        <span className="text-xs text-red-600">{(assign.error ?? unassign.error)?.message}</span>
      )}
    </div>
  )
}
