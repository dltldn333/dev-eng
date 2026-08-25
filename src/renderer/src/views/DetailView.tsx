import { LAYER_LABEL } from '@shared/layer'
import { EmptyState } from '../components/EmptyState'
import { useEntry } from '../hooks/useEntries'
import { useNavigation } from '../navigation/context'

export function DetailView({ id }: { id: number }): React.JSX.Element {
  const { canGoBack, back } = useNavigation()
  const { data: entry, isPending, error } = useEntry(id)

  if (error) return <EmptyState title="항목을 불러오지 못했습니다" hint={String(error)} />
  if (isPending) return <EmptyState title="불러오는 중…" />
  if (!entry) return <EmptyState title="삭제되었거나 존재하지 않는 항목입니다" />

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
          {LAYER_LABEL[entry.layer]}
        </span>
      </div>

      <div className="mx-auto w-full max-w-3xl px-3 pb-10">
        <h2
          className={
            entry.layer === 'sentence'
              ? 'text-xl leading-relaxed font-normal text-neutral-900'
              : 'text-2xl font-semibold tracking-tight text-neutral-900'
          }
        >
          {entry.text}
        </h2>

        <p className="mt-3 text-sm whitespace-pre-wrap text-neutral-500">
          {entry.memo || '메모 없음'}
        </p>

        <p className="mt-10 text-xs text-neutral-400">
          연결된 항목은 7단계에서 이 아래에 파티션으로 붙습니다
        </p>
      </div>
    </div>
  )
}
