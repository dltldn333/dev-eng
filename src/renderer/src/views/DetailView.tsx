import { useState } from 'react'
import { LAYER_LABEL } from '@shared/layer'
import type { Entry } from '@shared/types'
import { EmptyState } from '../components/EmptyState'
import { EntryForm } from '../components/EntryForm'
import { LinkPartition } from '../components/LinkPartition'
import { MemoPartition } from '../components/MemoPartition'
import { SentenceText } from '../components/SentenceText'
import { TagEditor } from '../components/TagEditor'
import { useChildren, useEntry, useParents } from '../hooks/useEntries'
import { useDeleteEntry, useRecordVisit, useUpdateEntry } from '../hooks/useEntryMutations'
import { useNavigation } from '../navigation/context'

export function DetailView({ id }: { id: number }): React.JSX.Element {
  const { canGoBack, back, go } = useNavigation()
  const { data: entry, isPending, error } = useEntry(id)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const update = useUpdateEntry()
  const remove = useDeleteEntry()
  // 문장 본문에서 아는 단어를 짚어주기 위해 이웃을 미리 읽어둔다.
  // 아래 파티션과 같은 쿼리라 요청이 늘지 않는다.
  const { data: linkedWords } = useParents(id)

  useRecordVisit(id)

  if (error) return <EmptyState title="항목을 불러오지 못했습니다" hint={String(error)} />
  if (isPending) return <EmptyState title="불러오는 중…" />
  if (!entry) return <EmptyState title="삭제되었거나 존재하지 않는 항목입니다" />

  function leave(): void {
    if (canGoBack) back()
    else if (entry) go({ kind: 'list', layer: entry.layer })
  }

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
        <span
          className="rounded-full px-2.5 py-1 text-xs"
          style={{
            color: `var(--color-layer-${entry.layer})`,
            backgroundColor: `color-mix(in oklab, var(--color-layer-${entry.layer}) 12%, white)`
          }}
        >
          {LAYER_LABEL[entry.layer]}
        </span>
        {entry.visitCount > 0 && (
          <span
            className="text-xs text-neutral-400 tabular-nums"
            title="30초 안에 다시 열면 세지 않습니다"
          >
            {entry.visitCount}번 봄
          </span>
        )}

        {!editing && !confirmingDelete && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg px-2.5 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg px-2.5 py-1 text-sm text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {confirmingDelete && (
        <div className="mx-auto w-full max-w-3xl px-3">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="flex-1 text-sm text-red-800">
              삭제하면 이 항목에 걸린 연결도 함께 사라집니다. 진행할까요?
            </p>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-2.5 py-1 text-sm text-red-700 transition-colors hover:bg-red-100"
            >
              취소
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate({ id: entry.id, layer: entry.layer }, { onSuccess: leave })
              }
              className="rounded-lg bg-red-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-red-300"
            >
              {remove.isPending ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-3 pb-12">
        {editing ? (
          <div className="mt-2">
            <EntryForm
              layer={entry.layer}
              initialText={entry.text}
              initialMemo={entry.memo}
              submitLabel="저장"
              pending={update.isPending}
              error={update.error?.message ?? null}
              onCancel={() => {
                setEditing(false)
                update.reset()
              }}
              onSubmit={({ text, memo }) =>
                update.mutate(
                  { id: entry.id, text, memo },
                  {
                    onSuccess: () => {
                      setEditing(false)
                      update.reset()
                    }
                  }
                )
              }
            />
          </div>
        ) : (
          <>
            <h2
              className={
                entry.layer === 'sentence'
                  ? 'text-xl leading-relaxed font-normal text-neutral-900'
                  : 'text-2xl font-semibold tracking-tight text-neutral-900'
              }
            >
              {entry.layer === 'sentence' ? (
                <SentenceText
                  text={entry.text}
                  words={linkedWords ?? []}
                  onOpen={(next) => go({ kind: 'detail', id: next })}
                />
              ) : (
                entry.text
              )}
            </h2>

            <TagEditor entry={entry} />

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <MemoPartition entry={entry} />
            </div>

            <LinkPartitions entry={entry} onOpen={(next) => go({ kind: 'detail', id: next })} />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 이웃 레이어를 파티션으로 편다.
 * 어원과 문장은 사슬의 양 끝이라 이웃이 한쪽뿐이고, 단어만 위아래를 모두 갖는다.
 */
function LinkPartitions({
  entry,
  onOpen
}: {
  entry: Entry
  onOpen: (id: number) => void
}): React.JSX.Element {
  const parents = useParents(entry.id)
  const children = useChildren(entry.id)

  return (
    <div className="mt-8 grid gap-8 border-t border-neutral-100 pt-6 md:grid-cols-2">
      {entry.layer !== 'root' && (
        <LinkPartition
          entry={entry}
          side="upper"
          neighborLayer={entry.layer === 'word' ? 'root' : 'word'}
          linked={parents.data ?? []}
          emptyText={entry.layer === 'word' ? '연결된 어원이 없습니다' : '연결된 단어가 없습니다'}
          onOpen={onOpen}
        />
      )}

      {entry.layer !== 'sentence' && (
        <LinkPartition
          entry={entry}
          side="lower"
          neighborLayer={entry.layer === 'root' ? 'word' : 'sentence'}
          linked={children.data ?? []}
          emptyText={entry.layer === 'root' ? '연결된 단어가 없습니다' : '연결된 문장이 없습니다'}
          onOpen={onOpen}
        />
      )}
    </div>
  )
}
