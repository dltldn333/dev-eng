import { useMemo, useState } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'
import type { Entry } from '@shared/types'
import { Modal } from './Modal'

interface Props {
  open: boolean
  layer: Layer
  candidates: Entry[]
  pending: boolean
  onPick: (entry: Entry) => void
  onClose: () => void
}

export function LinkPicker({
  open,
  layer,
  candidates,
  pending,
  onPick,
  onClose
}: Props): React.JSX.Element {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return candidates.slice(0, 50)
    return candidates.filter((entry) => entry.text.toLowerCase().includes(needle)).slice(0, 50)
  }, [candidates, query])

  return (
    <Modal open={open} title={`${LAYER_LABEL[layer]} 연결`} onClose={onClose}>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="검색"
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
      />

      <div className="mt-3 max-h-72 overflow-y-auto">
        {candidates.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">
            연결할 수 있는 {LAYER_LABEL[layer]}이 없습니다
          </p>
        )}

        {candidates.length > 0 && matches.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">검색 결과가 없습니다</p>
        )}

        <ul className="flex flex-col">
          {matches.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => onPick(entry)}
                className="w-full truncate rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
              >
                {entry.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
