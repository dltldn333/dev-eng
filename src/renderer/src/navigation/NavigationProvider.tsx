import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { NavigationContext, type Navigation, type Route } from './context'

/**
 * 라우터 라이브러리를 쓰지 않는다. 화면이 목록과 디테일 둘뿐이고,
 * 필요한 건 URL이 아니라 "타고 들어간 경로를 되짚는" 스택뿐이다.
 */
export function NavigationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [stack, setStack] = useState<Route[]>([{ kind: 'list', layer: 'word' }])

  const go = useCallback((route: Route) => {
    setStack((current) => [...current, route])
  }, [])

  const back = useCallback(() => {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : current))
  }, [])

  const value = useMemo<Navigation>(
    () => ({ route: stack[stack.length - 1], canGoBack: stack.length > 1, go, back }),
    [stack, go, back]
  )

  return <NavigationContext value={value}>{children}</NavigationContext>
}
