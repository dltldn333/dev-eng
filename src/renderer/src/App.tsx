import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavigationProvider } from './navigation/NavigationProvider'
import { PreferencesProvider } from './preferences/PreferencesProvider'
import { useNavigation } from './navigation/context'
import { DetailView } from './views/DetailView'
import { ListView } from './views/ListView'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 데이터는 이 앱 안에서만 바뀐다. 창을 다시 볼 때마다 다시 부를 이유가 없다.
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <NavigationProvider>
          <Shell />
        </NavigationProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  )
}

function Shell(): React.JSX.Element {
  const { route } = useNavigation()

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-neutral-200 px-6">
        <h1 className="text-sm font-semibold tracking-tight text-neutral-900">dev-eng</h1>
      </header>

      <main className="min-h-0 flex-1">
        {route.kind === 'list' ? <ListView layer={route.layer} /> : <DetailView id={route.id} />}
      </main>
    </div>
  )
}
