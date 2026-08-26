import type { Entry } from '@shared/types'
import { useUpdateEntry } from '../hooks/useEntryMutations'
import { BodyPartition } from './BodyPartition'

/**
 * 항목의 본문만 따로 고친다.
 *
 * 가장 자주 손보는 자리인데, 전체 수정 화면을 거치면 표제어까지 편집 가능한 상태가 된다.
 * 표제어가 바뀌면 자동 연결이 다시 계산되므로, 본문만 고치려다 연결이 흔들릴 수 있다.
 */
export function MemoPartition({ entry }: { entry: Entry }): React.JSX.Element {
  const update = useUpdateEntry()

  return (
    <BodyPartition
      value={entry.memo}
      isPending={update.isPending}
      error={update.error?.message ?? null}
      onReset={() => update.reset()}
      onSave={(memo) => update.mutateAsync({ id: entry.id, memo })}
    />
  )
}
