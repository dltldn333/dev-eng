import type { LinkInput, UnlinkInput } from '@shared/schemas'
import type { LinkedEntry } from '@shared/types'
import { getDatabase } from '../db'
import { toLinkedEntry, type LinkedEntryRow } from './row'

const LINKED_COLUMNS = `
  e.id, e.layer, e.text, e.normalized, e.memo,
  e.visit_count, e.visited_at, e.created_at, e.updated_at,
  l.origin
`

/** 한 항목의 상위 레이어 이웃. 단어 → 어원, 문장 → 단어. */
export function listParents(childId: number): LinkedEntry[] {
  const rows = getDatabase()
    .prepare(
      `SELECT ${LINKED_COLUMNS}
       FROM links l
       JOIN entries e ON e.id = l.parent_id
       WHERE l.child_id = ?
       ORDER BY e.normalized`
    )
    .all(childId) as LinkedEntryRow[]

  return rows.map(toLinkedEntry)
}

/** 한 항목의 하위 레이어 이웃. 어원 → 단어, 단어 → 문장. */
export function listChildren(parentId: number): LinkedEntry[] {
  const rows = getDatabase()
    .prepare(
      `SELECT ${LINKED_COLUMNS}
       FROM links l
       JOIN entries e ON e.id = l.child_id
       WHERE l.parent_id = ?
       ORDER BY e.normalized`
    )
    .all(parentId) as LinkedEntryRow[]

  return rows.map(toLinkedEntry)
}

/**
 * 레이어 순서가 맞는지는 DB 트리거가 판정한다.
 * 이미 있는 연결이면 조용히 넘어가되, 수동 연결이 자동으로 덮이지는 않게 한다.
 */
export function createLink(input: LinkInput): void {
  try {
    getDatabase()
      .prepare(
        `INSERT INTO links (parent_id, child_id, origin) VALUES (?, ?, ?)
         ON CONFLICT (parent_id, child_id) DO UPDATE SET
           origin = CASE WHEN links.origin = 'manual' THEN 'manual' ELSE excluded.origin END`
      )
      .run(input.parentId, input.childId, input.origin)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new Error('존재하지 않는 항목입니다', { cause: error })
    }
    throw error
  }
}

export function deleteLink(input: UnlinkInput): void {
  getDatabase()
    .prepare(`DELETE FROM links WHERE parent_id = ? AND child_id = ?`)
    .run(input.parentId, input.childId)
}
