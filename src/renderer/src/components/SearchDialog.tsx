import { useEffect, useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LAYERS, LAYER_LABEL, type Layer } from '@shared/layer'
import type { Entry } from '@shared/types'
import { useCreateEntry } from '../hooks/useEntryMutations'
import { useNavigation } from '../navigation/context'
import { EntryForm } from './EntryForm'
import { Modal } from './Modal'

interface Props {
  onClose: () => void
}

/**
 * 열려 있는 동안에만 화면에 붙어 있다. 닫으면 통째로 사라지므로
 * 입력값이나 등록 중이던 상태를 손으로 되돌릴 일이 없다.
 */
export function SearchDialog({ onClose }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [composing, setComposing] = useState<Layer | null>(null)
  const { go } = useNavigation()
  const create = useCreateEntry()

  // 글자를 칠 때마다 조회하지 않는다. 손이 멈춘 뒤에 한 번 찾는다.
  const settled = useDebounced(query, 200)
  const trimmed = settled.trim()

  const { data: results } = useQuery({
    queryKey: ['entries', 'search', trimmed],
    queryFn: () => window.api.entries.search({ query: trimmed }),
    enabled: trimmed.length > 0
  })

  function openEntry(entry: Entry): void {
    onClose()
    go({ kind: 'detail', id: entry.id })
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    const first = results?.[0]
    if (first) openEntry(first)
  }

  if (composing) {
    return (
      <Modal open title={`${LAYER_LABEL[composing]} 등록`} onClose={onClose}>
        <EntryForm
          layer={composing}
          initialText={trimmed}
          withRelations
          submitLabel="등록"
          pending={create.isPending}
          error={create.error?.message ?? null}
          onCancel={() => {
            setComposing(null)
            create.reset()
          }}
          onSubmit={(values) =>
            create.mutate(
              { layer: composing, ...values },
              {
                onSuccess: (entry) => {
                  onClose()
                  go({ kind: 'detail', id: entry.id })
                }
              }
            )
          }
        />
      </Modal>
    )
  }

  const empty = trimmed.length > 0 && results?.length === 0

  return (
    <Modal open title="검색" onClose={onClose}>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="표기나 본문에서 찾기"
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
      />

      <div className="mt-3 max-h-80 overflow-y-auto">
        {trimmed.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">
            찾을 말을 입력하세요. 뜻으로도 찾을 수 있습니다.
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="flex flex-col">
            {results.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100"
                >
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--color-layer-${entry.layer})` }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">
                    {entry.text}
                  </span>
                  {entry.memo && (
                    <span className="hidden max-w-[45%] shrink-0 truncate text-xs text-neutral-400 sm:block">
                      {entry.memo}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/*
          찾다가 없다는 걸 알게 되는 순간이 등록하기 가장 좋은 때다.
          창을 닫고 탭을 옮겨 다시 입력하게 만들지 않는다.
        */}
        {empty && (
          <div className="px-2 py-5 text-center">
            <p className="text-sm text-neutral-500">
              <span className="font-medium text-neutral-900">{trimmed}</span> — 아직 없습니다
            </p>
            <p className="mt-1 text-xs text-neutral-400">어느 갈래로 등록할까요?</p>

            <div className="mt-3 flex justify-center gap-2">
              {LAYERS.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setComposing(layer)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                >
                  {LAYER_LABEL[layer]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
