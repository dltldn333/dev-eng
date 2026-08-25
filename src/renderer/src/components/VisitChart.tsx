import { LAYER_LABEL, type Layer } from '@shared/layer'
import { useEntries } from '../hooks/useEntries'

interface Props {
  layer: Layer
  onOpen: (id: number) => void
}

const TOP_COUNT = 8

/**
 * 자주 다시 찾아본 항목을 위에서부터 보여준다.
 * 목록 정렬과 따로 두는 이유는, 정렬을 바꾸지 않고도 "뭘 복습할까"를 볼 수 있어야 해서다.
 */
export function VisitChart({ layer, onOpen }: Props): React.JSX.Element {
  const { data: entries } = useEntries({ layer, sort: 'visits', direction: 'desc' })

  const top = (entries ?? []).filter((entry) => entry.visitCount > 0).slice(0, TOP_COUNT)
  const max = top[0]?.visitCount ?? 0

  return (
    <div className="mb-2 rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <h2 className="mb-2 text-xs font-medium text-neutral-400">
        자주 찾아본 {LAYER_LABEL[layer]}
      </h2>

      {top.length === 0 ? (
        <p className="py-2 text-sm text-neutral-400">
          아직 열어본 항목이 없습니다. 디테일 뷰를 열면 여기에 쌓입니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {top.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpen(entry.id)}
                className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-neutral-100"
              >
                <span className="w-40 shrink-0 truncate text-sm text-neutral-700">
                  {entry.text}
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className="block h-full rounded-full bg-neutral-800"
                    style={{ width: `${Math.round((entry.visitCount / max) * 100)}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
                  {entry.visitCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
