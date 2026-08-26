import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Layer } from '@shared/layer'
import type { ListEntriesInput } from '@shared/schemas'
import type { Entry, LinkedEntry, Tag } from '@shared/types'

export const entryKeys = {
  /** 레이어까지만 담은 접두사. 정렬·필터가 무엇이든 이 레이어의 목록을 한 번에 무효화한다. */
  list: (layer: Layer) => ['entries', 'list', layer] as const,
  listWith: (input: ListEntriesInput) =>
    ['entries', 'list', input.layer, input.sort, input.direction, input.tagId ?? null] as const,
  detail: (id: number) => ['entries', 'detail', id] as const,
  parents: (id: number) => ['links', 'parents', id] as const,
  children: (id: number) => ['links', 'children', id] as const
}

export function useEntries(input: ListEntriesInput): UseQueryResult<Entry[]> {
  return useQuery({
    queryKey: entryKeys.listWith(input),
    queryFn: () => window.api.entries.list(input)
  })
}

export function useTags(): UseQueryResult<Tag[]> {
  return useQuery({ queryKey: ['tags'], queryFn: () => window.api.tags.list() })
}

export function useTag(id: number): UseQueryResult<Tag | null> {
  return useQuery({ queryKey: ['tags', id], queryFn: () => window.api.tags.get(id) })
}

export function useEntry(id: number): UseQueryResult<Entry | null> {
  return useQuery({
    queryKey: entryKeys.detail(id),
    queryFn: () => window.api.entries.get(id)
  })
}

export function useParents(id: number): UseQueryResult<LinkedEntry[]> {
  return useQuery({
    queryKey: entryKeys.parents(id),
    queryFn: () => window.api.links.parentsOf(id)
  })
}

export function useChildren(id: number): UseQueryResult<LinkedEntry[]> {
  return useQuery({
    queryKey: entryKeys.children(id),
    queryFn: () => window.api.links.childrenOf(id)
  })
}
