import { useState } from 'react'
import { LAYER_LABEL, type Layer } from '@shared/layer'
import { EmptyState } from '../components/EmptyState'
import { EntryForm } from '../components/EntryForm'
import { EntryListItem } from '../components/EntryListItem'
import { LayerTabs } from '../components/LayerTabs'
import { ListToolbar } from '../components/ListToolbar'
import { Modal } from '../components/Modal'
import { useEntries, useTags } from '../hooks/useEntries'
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
  const { sort, direction, tagId } = useListPreferences()
  const { data: tags } = useTags()
  const {
    data: entries,
    isPending,
    error
  } = useEntries({ layer, sort, direction, tagId: tagId ?? undefined })
  const [composing, setComposing] = useState(false)
  const create = useCreateEntry()

  function closeForm(): void {
    setComposing(false)
    create.reset()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3 py-4">
        <LayerTabs active={layer} onSelect={(next) => go({ kind: 'list', layer: next })} />
        <div className="flex items-center gap-2">
          <ListToolbar tags={tags ?? []} />
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
        {error && <EmptyState title="목록을 불러오지 못했습니다" hint={String(error)} />}

        {!error && isPending && <EmptyState title="불러오는 중…" />}

        {!error && entries?.length === 0 && tagId !== null && (
          <EmptyState
            title="이 태그가 붙은 항목이 없습니다"
            hint="태그 필터를 '태그 전체'로 되돌려보세요"
          />
        )}

        {!error && entries?.length === 0 && tagId === null && (
          <EmptyState title={`등록된 ${LAYER_LABEL[layer]}이 없습니다`} hint={EMPTY_HINT[layer]} />
        )}

        {!error && entries && entries.length > 0 && (
          <ul className="flex flex-col">
            {entries.map((entry) => (
              <EntryListItem
                key={entry.id}
                entry={entry}
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
