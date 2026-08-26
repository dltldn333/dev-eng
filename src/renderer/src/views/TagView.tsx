import { LAYERS, LAYER_LABEL, type Layer } from '@shared/layer'
import type { Entry } from '@shared/types'
import { BodyPartition } from '../components/BodyPartition'
import { EmptyState } from '../components/EmptyState'
import { Partition } from '../components/Partition'
import { useEntries, useTag } from '../hooks/useEntries'
import { useUpdateTag } from '../hooks/useTagMutations'
import { useNavigation } from '../navigation/context'

export function TagView({ id }: { id: number }): React.JSX.Element {
  const { canGoBack, back, go } = useNavigation()
  const { data: tag, isPending, error } = useTag(id)
  const update = useUpdateTag()

  // 태그는 레이어를 가로지른다. 세 목록을 각각 가져와 나눠 보여준다.
  const roots = useEntries({ layer: 'root', tagIds: [id] })
  const words = useEntries({ layer: 'word', tagIds: [id] })
  const sentences = useEntries({ layer: 'sentence', tagIds: [id] })
  const byLayer: Record<Layer, Entry[]> = {
    root: roots.data ?? [],
    word: words.data ?? [],
    sentence: sentences.data ?? []
  }

  if (error) return <EmptyState title="태그를 불러오지 못했습니다" hint={String(error)} />
  if (isPending) return <EmptyState title="불러오는 중…" />
  if (!tag) return <EmptyState title="삭제되었거나 존재하지 않는 태그입니다" />

  const total = LAYERS.reduce((sum, layer) => sum + byLayer[layer].length, 0)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-3 py-4">
        {canGoBack && (
          <button
            type="button"
            onClick={back}
            className="rounded-lg px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            ← 뒤로
          </button>
        )}
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
          태그
        </span>
        <span className="text-xs text-neutral-400 tabular-nums">{total}개 항목</span>
      </div>

      <div className="mx-auto w-full max-w-3xl px-3 pb-12">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">{tag.name}</h2>

        <div className="mt-5 border-t border-neutral-100 pt-4">
          <BodyPartition
            value={tag.memo}
            isPending={update.isPending}
            error={update.error?.message ?? null}
            onReset={() => update.reset()}
            onSave={(memo) => update.mutateAsync({ id: tag.id, memo })}
            emptyLabel="이 태그로 무엇을 묶는지 적어두세요"
          />
        </div>

        <div className="mt-8 grid gap-8 border-t border-neutral-100 pt-6 md:grid-cols-3">
          {LAYERS.map((layer) => (
            <Partition
              key={layer}
              title={LAYER_LABEL[layer]}
              count={byLayer[layer].length}
              accent={`var(--color-layer-${layer})`}
            >
              {byLayer[layer].length === 0 ? (
                <p className="px-2 py-2 text-sm text-neutral-400">없습니다</p>
              ) : (
                <ul className="flex flex-col">
                  {byLayer[layer].map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => go({ kind: 'detail', id: entry.id })}
                        className="w-full truncate rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        {entry.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Partition>
          ))}
        </div>
      </div>
    </div>
  )
}
