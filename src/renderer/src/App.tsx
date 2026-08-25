import { LAYERS, LAYER_LABEL } from '@shared/layer'

export default function App(): React.JSX.Element {
  // 브라우저에서 단독으로 열면 preload가 없다. 화면 확인용으로 열 때를 대비한다.
  const electronVersion = window.api?.version() ?? '—'

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-6">
        <h1 className="text-sm font-semibold tracking-tight">dev-eng</h1>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold">뼈대 준비 완료</p>
          <p className="mt-2 text-sm text-neutral-500">
            Electron {electronVersion} · 다음 단계에서 SQLite를 붙입니다
          </p>
          <div className="mt-8 flex justify-center gap-2">
            {LAYERS.map((layer) => (
              <span
                key={layer}
                className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm text-neutral-600"
              >
                {LAYER_LABEL[layer]}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
