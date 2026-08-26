import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'
import { useEntries, useTags } from '../hooks/useEntries'

export interface EntryFormValues {
  text: string
  memo: string
  tags: string[]
  parentIds: number[]
}

interface Props {
  layer: Layer
  initialText?: string
  initialMemo?: string
  /** 등록할 때만 태그와 어원을 함께 받는다. 수정 화면에는 각각 전용 자리가 있다. */
  withRelations?: boolean
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (values: EntryFormValues) => void
  onCancel: () => void
}

const FIELD =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400'

export function EntryForm({
  layer,
  initialText = '',
  initialMemo = '',
  withRelations = false,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel
}: Props): React.JSX.Element {
  const [text, setText] = useState(initialText)
  const [memo, setMemo] = useState(initialMemo)
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [parentIds, setParentIds] = useState<number[]>([])

  const tagListId = useId()
  const { data: knownTags } = useTags()
  // 어원은 추정하지 않는 관계라, 단어를 등록하는 이 순간이 이어붙이기 가장 좋은 때다.
  const linkable = withRelations && layer === 'word'
  const { data: roots } = useEntries({ layer: 'root' })

  const multiline = layer === 'sentence'
  const canSubmit = text.trim().length > 0 && !pending

  function send(): void {
    if (!canSubmit) return
    // 입력창에 남은 태그도 놓치지 않고 함께 보낸다.
    const draft = tagDraft.trim()
    const allTags = draft && !tags.includes(draft) ? [...tags, draft] : tags
    onSubmit({ text: text.trim(), memo, tags: allTags, parentIds })
  }

  function submit(event: FormEvent): void {
    event.preventDefault()
    send()
  }

  function addTag(name: string): void {
    const trimmed = name.trim()
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed])
    setTagDraft('')
  }

  /**
   * 한 줄 입력은 Enter로 제출한다. 한글 입력 중의 Enter는 조합을 확정하는 키라서 넘긴다.
   */
  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.nativeEvent.isComposing) return

    if (event.key === 'Enter' || event.key === ',') {
      // 태그 칸의 Enter는 태그를 확정하는 뜻이지 등록하겠다는 뜻이 아니다.
      event.preventDefault()
      addTag(tagDraft)
      return
    }
    if (event.key === 'Backspace' && !tagDraft && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  // 문장은 줄바꿈을 써야 하므로 Enter로 제출하지 않는다. ⌘/Ctrl+Enter로 받는다.
  function onTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  const selectedRoots = (roots ?? []).filter((root) => parentIds.includes(root.id))
  const selectableRoots = (roots ?? []).filter((root) => !parentIds.includes(root.id))

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

      {withRelations && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">태그</span>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1.5 focus-within:border-neutral-400">
            {tags.map((tag) => (
              <Chip key={tag} label={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))} />
            ))}
            <input
              list={tagListId}
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => addTag(tagDraft)}
              placeholder={tags.length === 0 ? '입력하거나 기존 태그에서 고르세요' : ''}
              className="min-w-32 flex-1 px-1 py-0.5 text-sm outline-none placeholder:text-neutral-400"
            />
            <datalist id={tagListId}>
              {(knownTags ?? [])
                .filter((tag) => !tags.includes(tag.name))
                .map((tag) => (
                  <option key={tag.id} value={tag.name} />
                ))}
            </datalist>
          </div>
        </div>
      )}

      {linkable && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">어원</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedRoots.map((root) => (
              <Chip
                key={root.id}
                label={root.text}
                onRemove={() => setParentIds(parentIds.filter((id) => id !== root.id))}
              />
            ))}
            <select
              aria-label="어원 연결"
              value=""
              onChange={(event) =>
                event.target.value && setParentIds([...parentIds, Number(event.target.value)])
              }
              disabled={selectableRoots.length === 0}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-600 outline-none focus:border-neutral-400 disabled:text-neutral-400"
            >
              <option value="">
                {selectableRoots.length === 0 ? '고를 어원이 없습니다' : '+ 어원 고르기'}
              </option>
              {selectableRoots.map((root) => (
                <option key={root.id} value={root.id}>
                  {root.text}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-1 pr-1.5 pl-2.5 text-xs text-neutral-600">
      {label}
      <button
        type="button"
        aria-label={`${label} 빼기`}
        onClick={onRemove}
        className="rounded-full px-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
      >
        ×
      </button>
    </span>
  )
}
