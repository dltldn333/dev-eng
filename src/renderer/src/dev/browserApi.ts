import type { Layer } from '@shared/layer'
import type {
  CreateEntryPayload,
  ListEntriesInput,
  TagAssignInput,
  UpdateEntryInput
} from '@shared/schemas'
import { normalize } from '@shared/normalize'
import type { Entry, LinkedEntry, LinkOrigin, Tag } from '@shared/types'

/**
 * 브라우저에서 화면을 띄워보기 위한 가짜 API.
 *
 * Electron 밖에서는 preload가 없어 window.api 가 비어 있다. 레이아웃과 흐름을 손볼 때마다
 * 앱을 띄우지 않아도 되도록, 개발 모드에서만 메모리에 얹은 스텁을 꽂는다.
 * 실제 앱에서는 window.api 가 항상 있으므로 이 코드는 실행되지 않는다.
 *
 * 등록·수정·삭제도 그대로 흉내낸다. 중복 검사처럼 DB가 막아주는 규칙도 같이 흉내내야
 * 브라우저에서 본 흐름과 앱에서의 흐름이 어긋나지 않는다. 새로고침하면 초기 상태로 돌아간다.
 */
export function installBrowserApiStub(): void {
  if (!import.meta.env.DEV || window.api) return

  let nextId = 1
  const entries: Entry[] = FIXTURES.map((fixture) => toEntry(fixture, nextId++))
  const links: { parentId: number; childId: number; origin: LinkOrigin }[] = []

  const idOf = (text: string): number => entries.find((entry) => entry.text === text)!.id
  for (const [parent, child, origin] of FIXTURE_LINKS) {
    links.push({ parentId: idOf(parent), childId: idOf(child), origin })
  }

  let nextTagId = 1
  const tagList: Tag[] = []
  for (const [text, ...names] of FIXTURE_TAGS) {
    const entry = entries.find((candidate) => candidate.text === text)
    if (!entry) continue
    entry.tags = names
    for (const name of names) {
      if (!tagList.some((tag) => tag.name === name)) tagList.push({ id: nextTagId++, name })
    }
  }
  tagList.sort((a, b) => a.name.localeCompare(b.name))

  const tagNameOf = (id: number): string | null =>
    tagList.find((tag) => tag.id === id)?.name ?? null
  const find = (id: number): Entry | undefined => entries.find((entry) => entry.id === id)
  const withOrigin = (id: number, origin: LinkOrigin): LinkedEntry => ({ ...find(id)!, origin })
  const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

  window.api = {
    platform: 'darwin',

    entries: {
      list: async ({ layer, sort = 'text', direction = 'asc', tagId }: ListEntriesInput) => {
        const tagName = tagId ? tagNameOf(tagId) : null
        const rank = (entry: Entry): string | number =>
          sort === 'created'
            ? entry.createdAt
            : sort === 'visits'
              ? entry.visitCount
              : entry.normalized

        return entries
          .filter((entry) => entry.layer === layer)
          .filter((entry) => !tagName || entry.tags.includes(tagName))
          .sort((a, b) => {
            const left = rank(a)
            const right = rank(b)
            const compared =
              typeof left === 'number' && typeof right === 'number'
                ? left - right
                : String(left).localeCompare(String(right))
            return (
              (direction === 'desc' ? -compared : compared) ||
              a.normalized.localeCompare(b.normalized)
            )
          })
      },

      get: async (id: number) => find(id) ?? null,

      create: async (input: CreateEntryPayload) => {
        const normalized = normalize(input.text)
        if (entries.some((entry) => entry.layer === input.layer && entry.normalized === normalized))
          throw new Error(`이미 등록된 ${LAYER_NOUN[input.layer]}입니다`)

        const entry: Entry = {
          id: nextId++,
          layer: input.layer,
          text: input.text.trim(),
          normalized,
          memo: input.memo ?? '',
          visitCount: 0,
          visitedAt: null,
          createdAt: now(),
          updatedAt: now(),
          tags: [...(input.tags ?? [])].sort((a, b) => a.localeCompare(b))
        }
        entries.push(entry)

        for (const name of entry.tags) {
          if (!tagList.some((tag) => tag.name === name)) tagList.push({ id: nextTagId++, name })
        }
        for (const parentId of input.parentIds ?? []) {
          links.push({ parentId, childId: entry.id, origin: 'manual' })
        }

        return entry
      },

      update: async (input: UpdateEntryInput) => {
        const entry = find(input.id)
        if (!entry) throw new Error('존재하지 않는 항목입니다')

        const text = input.text?.trim() ?? entry.text
        const normalized = normalize(text)
        if (
          entries.some(
            (other) =>
              other.id !== entry.id &&
              other.layer === entry.layer &&
              other.normalized === normalized
          )
        )
          throw new Error(`이미 등록된 ${LAYER_NOUN[entry.layer]}입니다`)

        entry.text = text
        entry.normalized = normalized
        entry.memo = input.memo ?? entry.memo
        entry.updatedAt = now()
        return entry
      },

      visit: async (id: number) => {
        const entry = find(id)
        if (!entry) return null
        entry.visitCount += 1
        entry.visitedAt = now()
        return entry
      },

      remove: async (id: number) => {
        const index = entries.findIndex((entry) => entry.id === id)
        if (index >= 0) entries.splice(index, 1)
        // DB의 ON DELETE CASCADE 를 흉내낸다.
        for (let i = links.length - 1; i >= 0; i -= 1) {
          if (links[i].parentId === id || links[i].childId === id) links.splice(i, 1)
        }
      }
    },

    tags: {
      list: async () => tagList,
      assign: async ({ entryId, name }: TagAssignInput) => {
        const entry = find(entryId)
        if (!entry || entry.tags.includes(name)) return
        entry.tags = [...entry.tags, name].sort((a, b) => a.localeCompare(b))
        if (!tagList.some((tag) => tag.name === name)) tagList.push({ id: nextTagId++, name })
      },
      unassign: async ({ entryId, name }: TagAssignInput) => {
        const entry = find(entryId)
        if (!entry) return
        entry.tags = entry.tags.filter((tag) => tag !== name)
        // 아무 항목에도 남지 않은 태그는 목록에서 뺀다.
        if (!entries.some((other) => other.tags.includes(name))) {
          const index = tagList.findIndex((tag) => tag.name === name)
          if (index >= 0) tagList.splice(index, 1)
        }
      }
    },

    links: {
      parentsOf: async (id: number) =>
        links
          .filter((link) => link.childId === id)
          .map((link) => withOrigin(link.parentId, link.origin)),
      childrenOf: async (id: number) =>
        links
          .filter((link) => link.parentId === id)
          .map((link) => withOrigin(link.childId, link.origin)),
      create: async ({ parentId, childId, origin }) => {
        if (!links.some((link) => link.parentId === parentId && link.childId === childId)) {
          links.push({ parentId, childId, origin })
        }
      },
      remove: async ({ parentId, childId }) => {
        const index = links.findIndex(
          (link) => link.parentId === parentId && link.childId === childId
        )
        if (index >= 0) links.splice(index, 1)
      }
    }
  }
}

const LAYER_NOUN: Record<Layer, string> = { root: '어원', word: '단어', sentence: '문장' }

interface Fixture {
  layer: Layer
  text: string
  memo?: string
  visits?: number
}

const FIXTURES: Fixture[] = [
  { layer: 'root', text: 'spect — to look', memo: '보다' },
  { layer: 'root', text: 'struct — to build', memo: '쌓다, 짓다' },
  { layer: 'root', text: 'port — to carry', memo: '나르다' },
  { layer: 'word', text: 'inspect', memo: '자세히 들여다보다', visits: 12 },
  { layer: 'word', text: 'spectator', visits: 3 },
  { layer: 'word', text: 'infrastructure', visits: 7 },
  { layer: 'word', text: 'export', visits: 1 },
  { layer: 'word', text: 'portable' },
  { layer: 'sentence', text: 'Let me inspect the log before we deploy.' },
  { layer: 'sentence', text: 'The infrastructure team owns this pipeline.' },
  { layer: 'sentence', text: 'Export the report as CSV.' }
]

const FIXTURE_LINKS: [string, string, LinkOrigin][] = [
  ['spect — to look', 'inspect', 'manual'],
  ['spect — to look', 'spectator', 'manual'],
  ['struct — to build', 'infrastructure', 'manual'],
  ['port — to carry', 'export', 'manual'],
  ['port — to carry', 'portable', 'manual'],
  ['inspect', 'Let me inspect the log before we deploy.', 'auto'],
  ['infrastructure', 'The infrastructure team owns this pipeline.', 'auto'],
  ['export', 'Export the report as CSV.', 'auto']
]

function toEntry(fixture: Fixture, id: number): Entry {
  return {
    id,
    layer: fixture.layer,
    text: fixture.text,
    normalized: normalize(fixture.text),
    memo: fixture.memo ?? '',
    visitCount: fixture.visits ?? 0,
    visitedAt: null,
    createdAt: `2026-08-${String(10 + id).padStart(2, '0')} 09:00:00`,
    updatedAt: '2026-08-25 00:00:00',
    tags: []
  }
}

const FIXTURE_TAGS: string[][] = [
  ['inspect', '디버깅'],
  ['infrastructure', '인프라'],
  ['export', '빌드'],
  ['spectator', '헷갈림']
]
