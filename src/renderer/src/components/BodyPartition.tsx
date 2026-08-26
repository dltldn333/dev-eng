import { useState, type KeyboardEvent } from 'react'
import { Markdown } from './Markdown'
import { Partition } from './Partition'

interface Props {
  value: string
  isPending: boolean
  error: string | null
  /** 저장이 끝나야 편집기를 닫으므로 완료를 알 수 있어야 한다. */
  onSave: (value: string) => Promise<unknown>
  /** 편집을 열거나 접을 때 이전 실패를 지운다. */
  onReset: () => void
  emptyLabel?: string
}

/**
 * 마크다운 본문을 보여주고 그 자리에서 고친다.
 *
 * 항목과 태그가 같은 편집기를 쓴다. 한쪽만 마크다운이거나 한쪽만 단축키가 다르면
 * 같은 자리에서 같은 일을 하는데 매번 다시 배워야 한다.
 */
export function BodyPartition({
  value,
  isPending,
  error,
  onSave,
  onReset,
  emptyLabel = '아직 없습니다'
}: Props): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function open(): void {
    setDraft(value)
    onReset()
    setEditing(true)
  }

  function close(): void {
    onReset()
    setEditing(false)
  }

  async function save(): Promise<void> {
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      // 실패하면 편집기를 열어둔다. 쓴 글을 잃지 않아야 다시 시도할 수 있다.
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.nativeEvent.isComposing) return

    // 본문은 여러 줄이라 Enter 는 줄바꿈으로 둔다.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void save()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return (
    <Partition
      title="본문"
      action={
        !editing && (
          <button
            type="button"
            onClick={open}
            className="rounded px-1.5 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            {value ? '본문 수정' : '+ 본문'}
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
            className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => void save()}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isPending ? '저장 중…' : '저장'}
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
      ) : value ? (
        <div className="px-2">
          <Markdown>{value}</Markdown>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className="rounded-lg px-2 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          {emptyLabel}
        </button>
      )}
    </Partition>
  )
}
