import { LAYER_LABEL, type Layer } from '@shared/layer'
import { EmptyState } from '../components/EmptyState'
import { EntryListItem } from '../components/EntryListItem'
import { LayerTabs } from '../components/LayerTabs'
import { useEntries } from '../hooks/useEntries'
import { useNavigation } from '../navigation/context'

const EMPTY_HINT: Record<Layer, string> = {
  root: '어원은 직접 등록하고 단어에 연결합니다',
  word: '읽다가 막힌 단어를 등록해보세요',
  sentence: '단어를 만난 문장을 그대로 넣어두면 나중에 맥락이 남습니다'
}

export function ListView({ layer }: { layer: Layer }): React.JSX.Element {
  const { go } = useNavigation()
  const { data: entries, isPending, error } = useEntries(layer)

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3 py-4">
        <LayerTabs active={layer} onSelect={(next) => go({ kind: 'list', layer: next })} />
        <span className="text-sm text-neutral-400 tabular-nums">
          {entries ? `${entries.length}개` : ''}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-3 pb-6">
        {error && <EmptyState title="목록을 불러오지 못했습니다" hint={String(error)} />}

        {!error && isPending && <EmptyState title="불러오는 중…" />}

        {!error && entries?.length === 0 && (
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
    </div>
  )
}
