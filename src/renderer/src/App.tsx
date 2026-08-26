import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsDialog } from './components/SettingsDialog'
import { TagSidebar } from './components/TagSidebar'
import { NavigationProvider } from './navigation/NavigationProvider'
import { PreferencesProvider } from './preferences/PreferencesProvider'
import { useNavigation } from './navigation/context'
import { DetailView } from './views/DetailView'
import { ListView } from './views/ListView'
import { TagView } from './views/TagView'

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
  const [settingsOpen, setSettingsOpen] = useState(false)

  // macOS 는 창 버튼을 화면 위에 겹쳐 그린다. 그 자리를 비워두지 않으면 제목과 포개진다.
  const inset = window.api.platform === 'darwin'

  return (
    <div className="flex h-screen flex-col">
      {/*
        헤더 전체를 창 끌기 영역으로 둔다. 프레임 없는 창은 이렇게 지정하지 않으면
        어디를 잡아도 창이 움직이지 않는다.
      */}
      <header
        className={
          inset
            ? 'drag-region flex h-12 shrink-0 items-center border-b border-neutral-200 pr-6 pl-20'
            : 'drag-region flex h-12 shrink-0 items-center border-b border-neutral-200 px-6'
        }
      >
        <h1 className="text-sm font-semibold tracking-tight text-neutral-900 select-none">
          dev-eng
        </h1>

        <button
          type="button"
          aria-label="설정"
          title="설정"
          onClick={() => setSettingsOpen(true)}
          className="no-drag-region ml-auto rounded-lg px-2 py-1 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          설정
        </button>
      </header>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="flex min-h-0 flex-1">
        <TagSidebar />

        <main className="min-h-0 flex-1">
          {route.kind === 'list' && <ListView layer={route.layer} />}
          {route.kind === 'detail' && <DetailView id={route.id} />}
          {route.kind === 'tag' && <TagView id={route.id} />}
        </main>
      </div>
    </div>
  )
}
