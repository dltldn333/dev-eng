import type { Layer } from '@shared/layer'
import { normalize } from '@shared/normalize'
import type {
  CreateEntryInput,
  EntrySort,
  ListEntriesInput,
  UpdateEntryInput
} from '@shared/schemas'
import type { Entry } from '@shared/types'
import { getDatabase } from '../db'
import { autolinkSentence, autolinkWord, reindexSentence } from '../services/autolink'
import { createLink } from './links'
import { toEntry, ENTRY_COLUMNS, type EntryRow } from './row'
import { assignTag } from './tags'

/**
 * 정렬 기준별 컬럼. 사용자가 고른 값은 zod 로 이미 걸러졌지만,
 * 문자열을 SQL에 그대로 끼워 넣지 않도록 여기서 한 번 더 표로 옮긴다.
 */
const ORDER_COLUMN: Record<EntrySort, string> = {
  text: 'e.normalized',
  created: 'e.created_at',
  visits: 'e.visit_count'
}

export function listEntries(
  input: Required<Pick<ListEntriesInput, 'layer'>> & ListEntriesInput
): Entry[] {
  const { layer, sort = 'text', direction = 'asc', tagIds = [] } = input

  const column = ORDER_COLUMN[sort]
  const order = direction === 'desc' ? 'DESC' : 'ASC'
  // 같은 값끼리는 언제나 같은 순서로 보이도록 표기를 두 번째 기준으로 둔다.
  const orderBy = `ORDER BY ${column} ${order}, e.normalized ASC`

  // 태그를 여러 개 고르면 좁히는 쪽으로 동작한다. 고른 태그를 전부 가진 항목만 남는다.
  const placeholders = tagIds.map(() => '?').join(', ')
  const filter = tagIds.length
    ? `AND (
         SELECT count(DISTINCT et.tag_id) FROM entry_tags et
         WHERE et.entry_id = e.id AND et.tag_id IN (${placeholders})
       ) = ?`
    : ''

  const parameters: (string | number)[] = tagIds.length
    ? [layer, ...tagIds, tagIds.length]
    : [layer]

  const rows = getDatabase()
    .prepare(`SELECT ${ENTRY_COLUMNS} FROM entries e WHERE e.layer = ? ${filter} ${orderBy}`)
    .all(...parameters) as EntryRow[]

  return rows.map(toEntry)
}

export function getEntry(id: number): Entry | null {
  const row = getDatabase()
    .prepare(`SELECT ${ENTRY_COLUMNS} FROM entries e WHERE e.id = ?`)
    .get(id) as EntryRow | undefined

  return row ? toEntry(row) : null
}

export function createEntry(input: CreateEntryInput): Entry {
  const normalized = normalize(input.text)
  if (!normalized) {
    throw new Error('알파벳이나 숫자가 하나도 없습니다')
  }

  const database = getDatabase()

  try {
    // 등록과 자동 연결은 한 덩어리다. 연결을 거는 도중 실패하면 항목도 남기지 않는다.
    return database.transaction(() => {
      const result = database
        .prepare(`INSERT INTO entries (layer, text, normalized, memo) VALUES (?, ?, ?, ?)`)
        .run(input.layer, input.text.trim(), normalized, input.memo)

      const entry = getEntry(Number(result.lastInsertRowid))!
      relink(entry)

      for (const name of input.tags) {
        assignTag({ entryId: entry.id, name })
      }

      // 어원 연결처럼 등록 시점에 이미 알고 있는 관계는 같이 저장한다.
      // 레이어 순서가 어긋나면 트리거가 막고, 트랜잭션 전체가 되돌아간다.
      for (const parentId of input.parentIds) {
        createLink({ parentId, childId: entry.id, origin: 'manual' })
      }

      // 태그와 연결이 붙은 뒤의 모습으로 돌려준다.
      return getEntry(entry.id)!
    })()
  } catch (error) {
    throw translateConstraintError(error, input.layer)
  }
}

export function updateEntry(input: UpdateEntryInput): Entry {
  const existing = getEntry(input.id)
  if (!existing) {
    throw new Error('존재하지 않는 항목입니다')
  }

  const text = input.text?.trim() ?? existing.text
  const memo = input.memo ?? existing.memo
  const normalized = normalize(text)
  if (!normalized) {
    throw new Error('알파벳이나 숫자가 하나도 없습니다')
  }

  const database = getDatabase()
  const textChanged = text !== existing.text

  try {
    return database.transaction(() => {
      database
        .prepare(`UPDATE entries SET text = ?, normalized = ?, memo = ? WHERE id = ?`)
        .run(text, normalized, memo, input.id)

      const entry = getEntry(input.id)!
      // 메모만 고쳤다면 연결은 그대로다. 본문이 바뀐 경우에만 다시 건다.
      if (textChanged) relink(entry)
      return entry
    })()
  } catch (error) {
    throw translateConstraintError(error, existing.layer)
  }
}

/**
 * 본문이 바뀐 항목의 자동 연결을 다시 계산한다.
 * 어원은 자동 연결하지 않는다. 접사만 보고 판정하면 오탐이 너무 많아서,
 * 어원-단어는 사람이 직접 잇는 것을 원칙으로 둔다.
 */
function relink(entry: Entry): void {
  if (entry.layer === 'sentence') {
    reindexSentence(entry)
    autolinkSentence(entry)
  } else if (entry.layer === 'word') {
    autolinkWord(entry)
  }
}

/**
 * 디테일 뷰 진입을 기록한다.
 *
 * 뒤로가기로 오가며 같은 항목을 반복해서 여는 일이 잦아서, 30초 안에 다시 열면 세지 않는다.
 * 이 수치는 "무엇을 자꾸 다시 찾아보는가"를 재려는 것이지 화면 전환 횟수가 아니다.
 */
export function recordVisit(id: number): Entry | null {
  getDatabase()
    .prepare(
      `UPDATE entries
       SET visit_count = visit_count + 1, visited_at = datetime('now')
       WHERE id = ? AND (visited_at IS NULL OR visited_at <= datetime('now', '-30 seconds'))`
    )
    .run(id)

  return getEntry(id)
}

/** 연결과 토큰은 외래키 CASCADE로 함께 지워진다. */
export function deleteEntry(id: number): void {
  getDatabase().prepare(`DELETE FROM entries WHERE id = ?`).run(id)
}

const LAYER_NOUN: Record<Layer, string> = {
  root: '어원',
  word: '단어',
  sentence: '문장'
}

/** SQLite 제약 위반 메시지는 사용자에게 보여줄 수 없으므로 여기서 갈아끼운다. */
function translateConstraintError(error: unknown, layer: Layer): Error {
  const code = (error as { code?: string }).code
  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new Error(`이미 등록된 ${LAYER_NOUN[layer]}입니다`, { cause: error })
  }
  return error instanceof Error ? error : new Error(String(error))
}
