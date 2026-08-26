import { useEffect } from 'react'
import { useTags } from '../hooks/useEntries'
import { useNavigation } from '../navigation/context'
import { useListPreferences } from '../preferences/context'

/**
 * 태그를 항상 보이는 자리로 옮긴다.
 *
 * 드롭다운 안에 있으면 무슨 태그를 쌓아뒀는지 열어봐야 알 수 있다. 태그는 이 앱에서
 * 스스로 만든 분류라, 목록 자체가 "내가 무엇을 모으고 있는가"에 대한 답이다.
 */
export function TagSidebar(): React.JSX.Element {
  const { data: tags } = useTags()
  const { tagIds, set, toggleTag } = useListPreferences()
  const { go, lastLayer } = useNavigation()

  /**
   * 본문 없는 태그는 마지막 항목에서 떼는 순간 사라진다. 저장해둔 선택이 그 태그를
   * 가리키고 있으면 목록이 이유 없이 비어 보이므로, 없어진 태그는 선택에서 뺀다.
   */
  useEffect(() => {
    if (!tags || tagIds.length === 0) return
    const alive = tagIds.filter((id) => tags.some((tag) => tag.id === id))
    if (alive.length !== tagIds.length) set({ tagIds: alive })
  }, [tags, tagIds, set])

  /** 이미 고른 태그를 다시 누르면 선택이 풀린다. */
  function toggle(id: number): void {
    toggleTag(id)
    // 태그를 고르는 건 목록을 좁히겠다는 뜻이다. 디테일에 있었다면 목록으로 돌아간다.
    go({ kind: 'list', layer: lastLayer })
  }

  return (
    <aside className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 px-2 py-3">
      <div className="flex items-baseline gap-2 px-2 pb-2">
        <h2 className="text-xs font-medium text-neutral-400">태그</h2>

        {/*
          고른 태그가 없는 상태가 곧 전체다. 그래서 이건 화면의 주인공이 아니라
          "고른 걸 푼다"는 되돌리기 버튼이고, 풀 것이 있을 때만 눌린다.
        */}
        <button
          type="button"
          disabled={tagIds.length === 0}
          onClick={() => set({ tagIds: [] })}
          className="ml-auto text-xs text-neutral-400 transition-colors not-disabled:hover:text-neutral-900 not-disabled:hover:underline disabled:text-neutral-300"
        >
          {tagIds.length > 0 ? `전체 보기 (${tagIds.length} 선택됨)` : '전체 보기'}
        </button>
      </div>

      <ul className="flex flex-col">
        {(tags ?? []).map((tag) => {
          const active = tagIds.includes(tag.id)

          return (
            <li key={tag.id} className="group flex items-center gap-0.5">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(tag.id)}
                className={
                  active
                    ? 'min-w-0 flex-1 truncate rounded-lg bg-neutral-100 px-2.5 py-1.5 text-left text-sm font-medium text-neutral-900'
                    : 'min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900'
                }
              >
                {tag.name}
              </button>

              <button
                type="button"
                aria-label={`${tag.name} 태그 자세히`}
                title="태그 자세히"
                onClick={() => go({ kind: 'tag', id: tag.id })}
                className="rounded px-1.5 py-1 text-xs text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-900 focus:opacity-100"
              >
                ›
              </button>
            </li>
          )
        })}
      </ul>

      {tags?.length === 0 && (
        <p className="px-2.5 py-2 text-xs leading-relaxed text-neutral-400">
          아직 없습니다. 항목을 열어 태그를 붙여보세요.
        </p>
      )}
    </aside>
  )
}
