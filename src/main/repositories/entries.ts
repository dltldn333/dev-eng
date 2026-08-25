import type { Layer } from '@shared/layer'
import { normalize } from '@shared/normalize'
import type { CreateEntryInput, UpdateEntryInput } from '@shared/schemas'
import type { Entry } from '@shared/types'
import { getDatabase } from '../db'
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

  try {
    const result = getDatabase()
      .prepare(`INSERT INTO entries (layer, text, normalized, memo) VALUES (?, ?, ?, ?)`)
      .run(input.layer, input.text.trim(), normalized, input.memo)

    return getEntry(Number(result.lastInsertRowid))!
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

  try {
    getDatabase()
      .prepare(`UPDATE entries SET text = ?, normalized = ?, memo = ? WHERE id = ?`)
      .run(text, normalized, memo, input.id)
  } catch (error) {
    throw translateConstraintError(error, existing.layer)
  }

  return getEntry(input.id)!
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
