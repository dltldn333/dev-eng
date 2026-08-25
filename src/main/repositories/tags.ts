import type { TagAssignInput } from '@shared/schemas'
import type { Tag } from '@shared/types'
import { getDatabase } from '../db'

/** 실제로 쓰이고 있는 태그만 돌려준다. 필터 목록에 죽은 태그를 남기지 않는다. */
export function listTags(): Tag[] {
  return getDatabase()
    .prepare(
      `SELECT t.id, t.name FROM tags t
       WHERE EXISTS (SELECT 1 FROM entry_tags et WHERE et.tag_id = t.id)
       ORDER BY t.name`
    )
    .all() as Tag[]
}

/** 없는 태그면 만들어서 붙인다. 태그를 따로 관리하게 만들 이유가 없다. */
export function assignTag(input: TagAssignInput): void {
  const database = getDatabase()

  database.transaction(() => {
    database.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(input.name)

    const tag = database.prepare(`SELECT id FROM tags WHERE name = ?`).get(input.name) as {
      id: number
    }

    database
      .prepare(`INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`)
      .run(input.entryId, tag.id)
  })()
}

/**
 * 태그를 떼고, 아무 항목에도 붙어 있지 않게 된 태그는 정리한다.
 * 오타로 만든 태그가 목록에 영영 남지 않게 한다.
 */
export function unassignTag(input: TagAssignInput): void {
  const database = getDatabase()

  database.transaction(() => {
    database
      .prepare(
        `DELETE FROM entry_tags
         WHERE entry_id = ? AND tag_id = (SELECT id FROM tags WHERE name = ?)`
      )
      .run(input.entryId, input.name)

    database
      .prepare(
        `DELETE FROM tags
         WHERE name = ? AND NOT EXISTS (SELECT 1 FROM entry_tags WHERE tag_id = tags.id)`
      )
      .run(input.name)
  })()
}
