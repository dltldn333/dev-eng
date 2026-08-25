import type { Layer } from '@shared/layer'
import { normalize } from '@shared/normalize'
import type { CreateEntryInput, UpdateEntryInput } from '@shared/schemas'
import type { Entry } from '@shared/types'
import { getDatabase } from '../db'
import { autolinkSentence, autolinkWord, reindexSentence } from '../services/autolink'
import { toEntry, ENTRY_COLUMNS, type EntryRow } from './row'

export function listEntries(layer: Layer): Entry[] {
  const rows = getDatabase()
    .prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE layer = ? ORDER BY normalized`)
    .all(layer) as EntryRow[]

  return rows.map(toEntry)
}

export function getEntry(id: number): Entry | null {
  const row = getDatabase().prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`).get(id) as
    EntryRow | undefined

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
      return entry
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
