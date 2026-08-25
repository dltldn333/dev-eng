import { createContext, useContext } from 'react'
import type { EntrySort, SortDirection } from '@shared/schemas'

export interface ListPreferences {
  sort: EntrySort
  direction: SortDirection
  tagId: number | null
}

export interface PreferencesStore extends ListPreferences {
  set: (patch: Partial<ListPreferences>) => void
}

export const PreferencesContext = createContext<PreferencesStore | null>(null)

export function useListPreferences(): PreferencesStore {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('PreferencesProvider 안에서만 사용할 수 있습니다')
  return value
}

export const DEFAULT_PREFERENCES: ListPreferences = {
  sort: 'text',
  direction: 'asc',
  tagId: null
}
