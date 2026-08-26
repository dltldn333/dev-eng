import { useEffect } from 'react'
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { Layer } from '@shared/layer'
import type { CreateEntryPayload, UpdateEntryInput } from '@shared/schemas'
import type { Entry } from '@shared/types'
import { entryKeys } from './useEntries'

export function useCreateEntry(): UseMutationResult<Entry, Error, CreateEntryPayload> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEntryPayload) => window.api.entries.create(input),
    onSuccess: (entry) => {
      void client.invalidateQueries({ queryKey: entryKeys.list(entry.layer) })
      // 등록과 함께 태그나 연결이 붙었을 수 있다.
      void client.invalidateQueries({ queryKey: ['links'] })
      void client.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}

export function useUpdateEntry(): UseMutationResult<Entry, Error, UpdateEntryInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEntryInput) => window.api.entries.update(input),
    onSuccess: (entry) => {
      void client.invalidateQueries({ queryKey: entryKeys.detail(entry.id) })
      void client.invalidateQueries({ queryKey: entryKeys.list(entry.layer) })
      // 표기가 바뀌면 다른 항목의 디테일 뷰에 걸려 있는 이름도 낡는다.
      void client.invalidateQueries({ queryKey: ['links'] })
    }
  })
}

export function useDeleteEntry(): UseMutationResult<void, Error, { id: number; layer: Layer }> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number; layer: Layer }) => window.api.entries.remove(id),
    onSuccess: (_result, { layer }) => {
      void client.invalidateQueries({ queryKey: entryKeys.list(layer) })
      // 삭제되면 연결도 함께 사라진다(CASCADE). 연결 목록을 전부 다시 부른다.
      void client.invalidateQueries({ queryKey: ['links'] })
    }
  })
}

/**
 * 디테일 뷰에 들어온 사실을 기록한다.
 *
 * 몇 번 셀지는 메인 프로세스가 정한다(30초 쿨다운). 화면은 "열렸다"만 알리고,
 * 개발 모드에서 효과가 두 번 실행되는 것도 그 쿨다운이 함께 흡수한다.
 */
export function useRecordVisit(id: number): void {
  const client = useQueryClient()

  useEffect(() => {
    let cancelled = false

    void window.api.entries.visit(id).then((entry) => {
      if (cancelled || !entry) return
      void client.invalidateQueries({ queryKey: entryKeys.detail(id) })
      void client.invalidateQueries({ queryKey: entryKeys.list(entry.layer) })
    })

    return () => {
      cancelled = true
    }
  }, [id, client])
}
