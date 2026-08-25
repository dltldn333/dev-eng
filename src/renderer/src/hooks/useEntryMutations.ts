import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { Layer } from '@shared/layer'
import type { CreateEntryInput, UpdateEntryInput } from '@shared/schemas'
import type { Entry } from '@shared/types'
import { entryKeys } from './useEntries'

export function useCreateEntry(): UseMutationResult<Entry, Error, CreateEntryInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEntryInput) => window.api.entries.create(input),
    onSuccess: (entry) => {
      void client.invalidateQueries({ queryKey: entryKeys.list(entry.layer) })
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
