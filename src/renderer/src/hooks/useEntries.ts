import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Layer } from '@shared/layer'
import type { Entry, LinkedEntry } from '@shared/types'

export const entryKeys = {
  list: (layer: Layer) => ['entries', 'list', layer] as const,
  detail: (id: number) => ['entries', 'detail', id] as const,
  parents: (id: number) => ['links', 'parents', id] as const,
  children: (id: number) => ['links', 'children', id] as const
}

export function useEntries(layer: Layer): UseQueryResult<Entry[]> {
  return useQuery({
    queryKey: entryKeys.list(layer),
    queryFn: () => window.api.entries.list(layer)
  })
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
