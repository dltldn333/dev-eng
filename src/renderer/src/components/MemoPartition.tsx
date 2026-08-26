import { useState, type KeyboardEvent } from 'react'
import type { Entry } from '@shared/types'
import { useUpdateEntry } from '../hooks/useEntryMutations'
import { Markdown } from './Markdown'
import { Partition } from './Partition'

/**
 * 메모만 따로 고친다.
 *
 * 메모는 항목에서 가장 자주 손보는 자리인데, 전체 수정 화면을 거치면 표제어까지
 * 편집 가능한 상태가 되어 실수로 건드리기 쉽다. 여기서는 메모만 바꿀 수 있다.
 */
export function MemoPartition({ entry }: { entry: Entry }): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.memo)
  const update = useUpdateEntry()

  function open(): void {
    setDraft(entry.memo)
    update.reset()
    setEditing(true)
  }

  function close(): void {
    update.reset()
    setEditing(false)
  }

  function save(): void {
    update.mutate({ id: entry.id, memo: draft }, { onSuccess: close })
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.nativeEvent.isComposing) return

    // 메모는 여러 줄이라 Enter 는 줄바꿈으로 둔다.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      save()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return (
    <Partition
      title="메모"
      action={
        !editing && (
          <button
            type="button"
            onClick={open}
            className="rounded px-1.5 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            {entry.memo ? '메모 수정' : '+ 메모'}
          </button>
        )
      }
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            rows={8}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              '마크다운을 쓸 수 있습니다\n\n- **굵게**, `코드`, [링크](https://…)\n- 목록, > 인용, ## 제목'
            }
            className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />

          {update.error && <p className="text-sm text-red-600">{update.error.message}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={update.isPending}
              onClick={save}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {update.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              취소
            </button>
            <span className="ml-auto text-xs text-neutral-400">⌘↵ 저장 · Esc 취소</span>
          </div>
        </div>
      ) : entry.memo ? (
        <div className="px-2">
          <Markdown>{entry.memo}</Markdown>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className="rounded-lg px-2 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          아직 없습니다
        </button>
      )}
    </Partition>
  )
}
