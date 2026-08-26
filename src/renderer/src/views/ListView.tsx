import { useState } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'
import { EmptyState } from '../components/EmptyState'
import { EntryForm } from '../components/EntryForm'
import { EntryListItem } from '../components/EntryListItem'
import { LayerTabs } from '../components/LayerTabs'
import { ListToolbar } from '../components/ListToolbar'
import { Modal } from '../components/Modal'
import { VisitChart } from '../components/VisitChart'
import { useEntries } from '../hooks/useEntries'
import { useCreateEntry } from '../hooks/useEntryMutations'
import { useNavigation } from '../navigation/context'
import { useListPreferences } from '../preferences/context'

const EMPTY_HINT: Record<Layer, string> = {
  root: '어원은 직접 등록하고 단어에 연결합니다',
  word: '읽다가 막힌 단어를 등록해보세요',
  sentence: '단어를 만난 문장을 그대로 넣어두면 나중에 맥락이 남습니다'
}

export function ListView({ layer }: { layer: Layer }): React.JSX.Element {
  const { go } = useNavigation()
  const { sort, direction, tagIds } = useListPreferences()
  const { data: entries, isPending, error } = useEntries({ layer, sort, direction, tagIds })
  const [composing, setComposing] = useState(false)
  const [showingChart, setShowingChart] = useState(false)
  const create = useCreateEntry()

  // 막대의 눈금은 지금 보이는 목록 안에서 정한다. 필터를 걸면 그 안에서의 비율로 다시 그려진다.
  const maxVisits = Math.max(0, ...(entries ?? []).map((entry) => entry.visitCount))

  function closeForm(): void {
    setComposing(false)
    create.reset()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3 py-4">
        <LayerTabs active={layer} onSelect={(next) => go({ kind: 'list', layer: next })} />
        <div className="flex items-center gap-2">
          <ListToolbar />
          <button
            type="button"
            aria-pressed={showingChart}
            onClick={() => setShowingChart((current) => !current)}
            className={
              showingChart
                ? 'rounded-lg border border-neutral-400 bg-white px-2 py-1 text-sm text-neutral-900'
                : 'rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-600 transition-colors hover:border-neutral-400'
            }
          >
            복습 순위
          </button>
          <span className="pl-1 text-sm text-neutral-400 tabular-nums">
            {entries ? `${entries.length}개` : ''}
          </span>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            {LAYER_LABEL[layer]} 등록
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-3 pb-6">
        {showingChart && <VisitChart layer={layer} onOpen={(id) => go({ kind: 'detail', id })} />}

        {error && <EmptyState title="목록을 불러오지 못했습니다" hint={String(error)} />}

        {!error && isPending && <EmptyState title="불러오는 중…" />}

        {!error && entries?.length === 0 && tagIds.length > 0 && (
          <EmptyState
            title={
              tagIds.length === 1
                ? '이 태그가 붙은 항목이 없습니다'
                : '고른 태그를 모두 가진 항목이 없습니다'
            }
            hint="사이드바에서 태그를 다시 눌러 선택을 풀 수 있습니다"
          />
        )}

        {!error && entries?.length === 0 && tagIds.length === 0 && (
          <EmptyState title={`등록된 ${LAYER_LABEL[layer]}이 없습니다`} hint={EMPTY_HINT[layer]} />
        )}

        {!error && entries && entries.length > 0 && (
          <ul className="flex flex-col">
            {entries.map((entry) => (
              <EntryListItem
                key={entry.id}
                entry={entry}
                maxVisits={maxVisits}
                onOpen={(id) => go({ kind: 'detail', id })}
              />
            ))}
          </ul>
        )}
      </div>

      <Modal open={composing} title={`${LAYER_LABEL[layer]} 등록`} onClose={closeForm}>
        {composing && (
          <EntryForm
            layer={layer}
            withRelations
            submitLabel="등록"
            pending={create.isPending}
            error={create.error?.message ?? null}
            onCancel={closeForm}
            onSubmit={(values) =>
              create.mutate({ layer, ...values }, { onSuccess: () => closeForm() })
            }
          />
        )}
      </Modal>
    </div>
  )
}
