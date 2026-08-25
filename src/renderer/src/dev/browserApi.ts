import type { Layer } from '@shared/layer'
import type { Entry, LinkedEntry } from '@shared/types'

/**
 * 브라우저에서 화면만 띄워보기 위한 가짜 API.
 *
 * Electron 밖에서는 preload가 없어 window.api 가 비어 있다. 레이아웃을 손볼 때마다
 * 앱을 띄우지 않아도 되도록, 개발 모드에서만 예시 데이터로 채운 스텁을 꽂는다.
 * 실제 앱에서는 window.api 가 항상 있으므로 이 코드는 실행되지 않는다.
 */
export function installBrowserApiStub(): void {
  if (!import.meta.env.DEV || window.api) return

  const entries = FIXTURES.map((fixture, index) => toEntry(fixture, index + 1))
  const byText = (text: string): Entry => entries.find((entry) => entry.text === text)!

  const links: { parent: string; child: string; origin: 'auto' | 'manual' }[] = [
    { parent: 'spect — to look', child: 'inspect', origin: 'manual' },
    { parent: 'spect — to look', child: 'spectator', origin: 'manual' },
    { parent: 'struct — to build', child: 'infrastructure', origin: 'manual' },
    { parent: 'inspect', child: 'Let me inspect the log before we deploy.', origin: 'auto' }
  ]

  const linked = (entry: Entry, origin: 'auto' | 'manual'): LinkedEntry => ({ ...entry, origin })

  window.api = {
    entries: {
      list: async (layer: Layer) => entries.filter((entry) => entry.layer === layer),
      get: async (id: number) => entries.find((entry) => entry.id === id) ?? null,
      create: async () => {
        throw new Error('브라우저 미리보기에서는 등록할 수 없습니다')
      },
      update: async () => {
        throw new Error('브라우저 미리보기에서는 수정할 수 없습니다')
      },
      remove: async () => undefined
    },
    links: {
      parentsOf: async (id: number) =>
        links
          .filter((link) => byText(link.child).id === id)
          .map((link) => linked(byText(link.parent), link.origin)),
      childrenOf: async (id: number) =>
        links
          .filter((link) => byText(link.parent).id === id)
          .map((link) => linked(byText(link.child), link.origin)),
      create: async () => undefined,
      remove: async () => undefined
    }
  }
}

interface Fixture {
  layer: Layer
  text: string
  memo?: string
}

const FIXTURES: Fixture[] = [
  { layer: 'root', text: 'spect — to look', memo: '보다' },
  { layer: 'root', text: 'struct — to build', memo: '쌓다, 짓다' },
  { layer: 'root', text: 'port — to carry', memo: '나르다' },
  { layer: 'word', text: 'inspect', memo: '자세히 들여다보다' },
  { layer: 'word', text: 'spectator' },
  { layer: 'word', text: 'infrastructure' },
  { layer: 'word', text: 'export' },
  { layer: 'word', text: 'portable' },
  { layer: 'sentence', text: 'Let me inspect the log before we deploy.' },
  { layer: 'sentence', text: 'The infrastructure team owns this pipeline.' },
  { layer: 'sentence', text: 'Export the report as CSV.' }
]

function toEntry(fixture: Fixture, id: number): Entry {
  return {
    id,
    layer: fixture.layer,
    text: fixture.text,
    normalized: fixture.text.toLowerCase(),
    memo: fixture.memo ?? '',
    visitCount: 0,
    visitedAt: null,
    createdAt: '2026-08-25 00:00:00',
    updatedAt: '2026-08-25 00:00:00'
  }
}
