import { useState } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'
import type { Entry, LinkedEntry } from '@shared/types'
import { useEntries } from '../hooks/useEntries'
import { useCreateLink, useDeleteLink } from '../hooks/useLinkMutations'
import { LinkedEntries } from './LinkedEntries'
import { LinkPicker } from './LinkPicker'
import { Partition } from './Partition'

interface Props {
  entry: Entry
  /** 이웃이 사슬의 위쪽인지 아래쪽인지. 연결의 방향을 정한다. */
  side: 'upper' | 'lower'
  neighborLayer: Layer
  linked: LinkedEntry[]
  emptyText: string
  onOpen: (id: number) => void
}

export function LinkPartition({
  entry,
  side,
  neighborLayer,
  linked,
  emptyText,
  onOpen
}: Props): React.JSX.Element {
  const [picking, setPicking] = useState(false)
  // 연결 후보는 정렬·필터와 무관하게 표기순 전체를 보여준다.
  const { data: neighbors } = useEntries({ layer: neighborLayer })
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()

  const linkedIds = new Set(linked.map((item) => item.id))
  const candidates = (neighbors ?? []).filter((candidate) => !linkedIds.has(candidate.id))

  /** 연결은 언제나 상위 → 하위 방향으로 저장한다. */
  const edgeWith = (neighborId: number): { parentId: number; childId: number } =>
    side === 'upper'
      ? { parentId: neighborId, childId: entry.id }
      : { parentId: entry.id, childId: neighborId }

  return (
    <Partition
      title={LAYER_LABEL[neighborLayer]}
      count={linked.length}
      accent={`var(--color-layer-${neighborLayer})`}
      action={
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="rounded px-1.5 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          + 연결
        </button>
      }
    >
      <LinkedEntries
        entries={linked}
        emptyText={emptyText}
        onOpen={onOpen}
        onRemove={(item) => deleteLink.mutate(edgeWith(item.id))}
      />

      <LinkPicker
        open={picking}
        layer={neighborLayer}
        candidates={candidates}
        pending={createLink.isPending}
        onClose={() => setPicking(false)}
        onPick={(candidate) =>
          createLink.mutate(
            { ...edgeWith(candidate.id), origin: 'manual' },
            { onSuccess: () => setPicking(false) }
          )
        }
      />

      {(createLink.error ?? deleteLink.error) && (
        <p className="px-2 pt-1 text-xs text-red-600">
          {(createLink.error ?? deleteLink.error)?.message}
        </p>
      )}
    </Partition>
  )
}
