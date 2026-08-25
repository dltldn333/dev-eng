import type { Layer } from '@shared/layer'
import type { Entry, LinkedEntry, LinkOrigin } from '@shared/types'

/** 태그 이름 구분자. 이름에 들어갈 일이 없는 제어문자를 쓴다. */
const TAG_SEPARATOR = String.fromCharCode(31)

const TAG_NAMES = `
  (SELECT group_concat(name, char(31)) FROM (
     SELECT t.name FROM entry_tags et JOIN tags t ON t.id = et.tag_id
     WHERE et.entry_id = e.id ORDER BY t.name
   )) AS tag_names
`

export const ENTRY_COLUMNS = `
  e.id, e.layer, e.text, e.normalized, e.memo,
  e.visit_count, e.visited_at, e.created_at, e.updated_at,
  ${TAG_NAMES}
`

export const LINKED_COLUMNS = `${ENTRY_COLUMNS}, l.origin`

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
  tag_names: string | null
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
    updatedAt: row.updated_at,
    tags: row.tag_names ? row.tag_names.split(TAG_SEPARATOR) : []
  }
}

export function toLinkedEntry(row: LinkedEntryRow): LinkedEntry {
  return { ...toEntry(row), origin: row.origin }
}
