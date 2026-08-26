import { createContext, useContext } from 'react'
import type { Layer } from '@shared/layer'
import type { EntrySort, SortDirection } from '@shared/schemas'

/** 화면에서 바꿀 수 있는 색. 레이어 셋과 문장 속 단어 표시. */
export type ColorKey = Layer | 'highlight'

export type Colors = Record<ColorKey, string>

export interface ListPreferences {
  sort: EntrySort
  direction: SortDirection
  tagIds: number[]
  colors: Colors
}

export interface PreferencesStore extends ListPreferences {
  set: (patch: Partial<ListPreferences>) => void
  /**
   * 태그 하나를 켜고 끈다.
   * 직전 상태를 읽어서 뒤집기 때문에, 연달아 누른 선택이 서로를 덮어쓰지 않는다.
   */
  toggleTag: (id: number) => void
  setColor: (key: ColorKey, value: string) => void
  resetColors: () => void
}

export const PreferencesContext = createContext<PreferencesStore | null>(null)

export function useListPreferences(): PreferencesStore {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('PreferencesProvider 안에서만 사용할 수 있습니다')
  return value
}

/**
 * 기본값은 무채색 화면에 얹히는 것을 전제로 고른다.
 * 분류색은 글자를 읽는 데 방해되지 않을 만큼만 진하고, 하이라이트는 형광펜을 흉내낸다.
 */
export const DEFAULT_COLORS: Colors = {
  root: '#7c6f9b',
  word: '#3f6f8f',
  sentence: '#6f8f5f',
  highlight: '#fcd34d'
}

export const DEFAULT_PREFERENCES: ListPreferences = {
  sort: 'text',
  direction: 'asc',
  tagIds: [],
  colors: DEFAULT_COLORS
}
