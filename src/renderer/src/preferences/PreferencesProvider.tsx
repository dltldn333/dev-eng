import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  type ListPreferences,
  type PreferencesStore
} from './context'

const STORAGE_KEY = 'dev-eng.list-preferences'

/**
 * 정렬과 필터는 탭을 옮기거나 디테일을 다녀와도 그대로여야 한다.
 * 화면 상태로 두면 라우팅할 때마다 초기화되므로 위에 올려두고, 앱을 다시 켜도 남게 저장한다.
 */
export function PreferencesProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [preferences, setPreferences] = useState<ListPreferences>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const set = useCallback((patch: Partial<ListPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }))
  }, [])

  const toggleTag = useCallback((id: number) => {
    setPreferences((current) => ({
      ...current,
      tagIds: current.tagIds.includes(id)
        ? current.tagIds.filter((tagId) => tagId !== id)
        : [...current.tagIds, id]
    }))
  }, [])

  const value = useMemo<PreferencesStore>(
    () => ({ ...preferences, set, toggleTag }),
    [preferences, set, toggleTag]
  )

  return <PreferencesContext value={value}>{children}</PreferencesContext>
}

function load(): ListPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFERENCES
    // 저장된 값은 이전 버전이 남긴 것일 수 있다. 아는 필드만 받아들인다.
    const parsed = JSON.parse(stored) as Partial<ListPreferences>
    return {
      sort: parsed.sort ?? DEFAULT_PREFERENCES.sort,
      direction: parsed.direction ?? DEFAULT_PREFERENCES.direction,
      tagIds: Array.isArray(parsed.tagIds) ? parsed.tagIds : []
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}
