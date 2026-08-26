import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { TagAssignInput, TagUpdateInput } from '@shared/schemas'
import type { Tag } from '@shared/types'

function useTagMutation(
  action: (input: TagAssignInput) => Promise<void>
): UseMutationResult<void, Error, TagAssignInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      // 태그가 붙거나 떨어지면 목록의 태그 필터 결과도, 항목 자체도 낡는다.
      void client.invalidateQueries({ queryKey: ['entries'] })
      void client.invalidateQueries({ queryKey: ['links'] })
      void client.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}

export function useAssignTag(): UseMutationResult<void, Error, TagAssignInput> {
  return useTagMutation((input) => window.api.tags.assign(input))
}

export function useUnassignTag(): UseMutationResult<void, Error, TagAssignInput> {
  return useTagMutation((input) => window.api.tags.unassign(input))
}

export function useUpdateTag(): UseMutationResult<Tag | null, Error, TagUpdateInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: TagUpdateInput) => window.api.tags.update(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}
