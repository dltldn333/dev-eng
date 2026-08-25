import type { Layer } from '@shared/layer'
import type { Entry, LinkedEntry, LinkOrigin } from '@shared/types'

export const ENTRY_COLUMNS = `
  id, layer, text, normalized, memo, visit_count, visited_at, created_at, updated_at
`

export interface EntryRow {
  id: number
  layer: Layer
  text: string
  normalized: string
  memo: string
  visit_count: number
  visited_at: string | null
  created_at: string
  updated_at: string
}

export interface LinkedEntryRow extends EntryRow {
  origin: LinkOrigin
}

/** DB는 snake_case, 화면은 camelCase. 경계를 여기 한 곳으로 모은다. */
export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    layer: row.layer,
    text: row.text,
    normalized: row.normalized,
    memo: row.memo,
    visitCount: row.visit_count,
    visitedAt: row.visited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function toLinkedEntry(row: LinkedEntryRow): LinkedEntry {
  return { ...toEntry(row), origin: row.origin }
}
