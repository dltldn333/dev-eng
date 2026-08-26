import type { TagAssignInput, TagUpdateInput } from '@shared/schemas'
import type { Tag } from '@shared/types'
import { getDatabase } from '../db'

const TAG_COLUMNS = `id, name, memo`

/**
 * 필터에 올릴 태그들.
 *
 * 아무 항목에도 붙어 있지 않은 태그는 숨기되, 본문을 적어둔 태그는 남긴다.
 * 설명을 써둔 태그가 마지막 항목을 떼는 순간 사라지면 그 글도 함께 사라진다.
 */
export function listTags(): Tag[] {
  return getDatabase()
    .prepare(
      `SELECT ${TAG_COLUMNS} FROM tags t
       WHERE EXISTS (SELECT 1 FROM entry_tags et WHERE et.tag_id = t.id) OR t.memo <> ''
       ORDER BY t.name`
    )
    .all() as Tag[]
}

export function getTag(id: number): Tag | null {
  const tag = getDatabase().prepare(`SELECT ${TAG_COLUMNS} FROM tags WHERE id = ?`).get(id) as
    Tag | undefined

  return tag ?? null
}

export function updateTag(input: TagUpdateInput): Tag | null {
  getDatabase().prepare(`UPDATE tags SET memo = ? WHERE id = ?`).run(input.memo, input.id)
  return getTag(input.id)
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
 * 태그를 떼고, 빈 껍데기가 된 태그는 정리한다.
 * 오타로 만든 태그가 목록에 영영 남지 않게 하되, 본문을 적어둔 태그는 지우지 않는다.
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
         WHERE name = ? AND memo = ''
           AND NOT EXISTS (SELECT 1 FROM entry_tags WHERE tag_id = tags.id)`
      )
      .run(input.name)
  })()
}
