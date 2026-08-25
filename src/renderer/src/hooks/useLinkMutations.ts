import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { LinkInput, UnlinkInput } from '@shared/schemas'

export function useCreateLink(): UseMutationResult<void, Error, LinkInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: LinkInput) => window.api.links.create(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['links'] })
    }
  })
}

export function useDeleteLink(): UseMutationResult<void, Error, UnlinkInput> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: UnlinkInput) => window.api.links.remove(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['links'] })
    }
  })
}
