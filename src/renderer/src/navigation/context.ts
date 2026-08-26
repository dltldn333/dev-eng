import { createContext, useContext } from 'react'
import type { Layer } from '@shared/layer'

export type Route =
  { kind: 'list'; layer: Layer } | { kind: 'detail'; id: number } | { kind: 'tag'; id: number }

export interface Navigation {
  route: Route
  /** 뒤로 갈 곳이 있는지. 어원 → 단어 → 문장으로 타고 들어간 뒤 되돌아올 때 쓴다. */
  canGoBack: boolean
  go: (route: Route) => void
  back: () => void
}

export const NavigationContext = createContext<Navigation | null>(null)

export function useNavigation(): Navigation {
  const value = useContext(NavigationContext)
  if (!value) throw new Error('NavigationProvider 안에서만 사용할 수 있습니다')
  return value
}
