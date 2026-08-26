import { createContext, useContext } from 'react'
import type { EntrySort, SortDirection } from '@shared/schemas'

export interface ListPreferences {
  sort: EntrySort
  direction: SortDirection
  tagIds: number[]
}

export interface PreferencesStore extends ListPreferences {
  set: (patch: Partial<ListPreferences>) => void
  /**
   * 태그 하나를 켜고 끈다.
   * 직전 상태를 읽어서 뒤집기 때문에, 연달아 누른 선택이 서로를 덮어쓰지 않는다.
   */
  toggleTag: (id: number) => void
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
  tagIds: []
}
