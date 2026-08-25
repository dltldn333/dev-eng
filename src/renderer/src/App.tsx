import { useEffect, useState } from 'react'
import { LAYERS, LAYER_LABEL, type Layer } from '@shared/layer'

type Counts = Record<Layer, number>

export default function App(): React.JSX.Element {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load(): Promise<void> {
      const entries = await Promise.all(LAYERS.map((layer) => window.api.entries.list(layer)))
      setCounts(
        Object.fromEntries(LAYERS.map((layer, index) => [layer, entries[index].length])) as Counts
      )
    }

    load().catch((cause: unknown) => setError(String(cause)))
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-6">
        <h1 className="text-sm font-semibold tracking-tight">dev-eng</h1>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold">데이터 통로 연결됨</p>
          <p className="mt-2 text-sm text-neutral-500">
            {error ?? '다음 단계에서 리스트 뷰를 붙입니다'}
          </p>

          <div className="mt-8 flex justify-center gap-2">
            {LAYERS.map((layer) => (
              <span
                key={layer}
                className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm text-neutral-600"
              >
                {LAYER_LABEL[layer]}
                <span className="ml-2 font-medium text-neutral-900 tabular-nums">
                  {counts ? counts[layer] : '…'}
                </span>
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
