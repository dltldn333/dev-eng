import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'

interface Props {
  layer: Layer
  initialText?: string
  initialMemo?: string
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (values: { text: string; memo: string }) => void
  onCancel: () => void
}

const FIELD =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400'

export function EntryForm({
  layer,
  initialText = '',
  initialMemo = '',
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel
}: Props): React.JSX.Element {
  const [text, setText] = useState(initialText)
  const [memo, setMemo] = useState(initialMemo)

  const multiline = layer === 'sentence'
  const canSubmit = text.trim().length > 0 && !pending

  function send(): void {
    if (!canSubmit) return
    onSubmit({ text: text.trim(), memo })
  }

  function submit(event: FormEvent): void {
    event.preventDefault()
    send()
  }

  /**
   * 한 줄 입력은 Enter로 제출한다. 폼의 암묵적 제출에 기대지 않고 직접 처리한다.
   * 한글 입력 중의 Enter는 조합을 확정하는 키라서, isComposing 이면 넘긴다.
   */
  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  // 문장은 줄바꿈을 써야 하므로 Enter로 제출하지 않는다. ⌘/Ctrl+Enter로 받는다.
  function onTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-neutral-500">{LAYER_LABEL[layer]}</span>
        {multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onTextareaKeyDown}
            placeholder="읽다가 만난 문장을 그대로 붙여넣으세요"
            className={`${FIELD} resize-y leading-relaxed`}
          />
        ) : (
          <input
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={layer === 'root' ? 'spect — to look' : 'inspect'}
            className={FIELD}
          />
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-neutral-500">메모</span>
        <textarea
          rows={2}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="뜻, 뉘앙스, 헷갈린 이유 등"
          className={`${FIELD} resize-y`}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {pending ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
