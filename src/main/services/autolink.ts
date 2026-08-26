import type { Entry } from '@shared/types'
import { getDatabase } from '../db'
import { ENTRY_COLUMNS, toEntry, type EntryRow } from '../repositories/row'
import { indexTokensOf, variantsOf } from '@shared/tokens'

/**
 * 문장이 남기는 토큰 색인을 다시 만든다. 문장 본문이 바뀌면 색인도 갈아끼워야 한다.
 */
export function reindexSentence(sentence: Entry): void {
  const database = getDatabase()
  database.prepare(`DELETE FROM sentence_tokens WHERE sentence_id = ?`).run(sentence.id)

  const insert = database.prepare(
    `INSERT OR IGNORE INTO sentence_tokens (sentence_id, token) VALUES (?, ?)`
  )
  for (const token of indexTokensOf(sentence.text)) {
    insert.run(sentence.id, token)
  }
}

/**
 * 단어 하나를 기준으로, 그 단어가 든 문장을 전부 자동 연결한다.
 *
 * 손으로 건 연결은 건드리지 않는다. 지웠다 다시 그리는 건 origin='auto' 뿐이다.
 */
export function autolinkWord(word: Entry): void {
  const database = getDatabase()
  database.prepare(`DELETE FROM links WHERE parent_id = ? AND origin = 'auto'`).run(word.id)

  for (const sentenceId of sentencesContaining(word.normalized)) {
    linkAuto(word.id, sentenceId)
  }
}

/**
 * 문장 하나를 기준으로, 그 문장에 든 단어를 전부 자동 연결한다.
 */
export function autolinkSentence(sentence: Entry): void {
  const database = getDatabase()
  database.prepare(`DELETE FROM links WHERE child_id = ? AND origin = 'auto'`).run(sentence.id)

  for (const wordId of wordsInside(sentence.normalized)) {
    linkAuto(wordId, sentence.id)
  }
}

/**
 * 자동 연결을 새로 만든다. 이미 손으로 이어둔 연결이면 그대로 둔다.
 * 사람이 끊어둔 연결도 다시 만들지 않는다. 자동 판정이 사람의 판단을 덮어써서는 안 된다.
 */
function linkAuto(wordId: number, sentenceId: number): void {
  getDatabase()
    .prepare(
      `INSERT INTO links (parent_id, child_id, origin)
       SELECT ?, ?, 'auto'
       WHERE NOT EXISTS (
         SELECT 1 FROM dismissed_links WHERE parent_id = ? AND child_id = ?
       )
       ON CONFLICT (parent_id, child_id) DO NOTHING`
    )
    .run(wordId, sentenceId, wordId, sentenceId)
}

/** 이 단어가 든 문장들. 색인을 뒤지므로 문장 수가 늘어도 훑지 않는다. */
function sentencesContaining(wordNormalized: string): number[] {
  const database = getDatabase()

  // "pull request" 처럼 띄어쓴 표제어는 토큰 색인으로 찾을 수 없다. 문장 본문에서 직접 찾는다.
  if (wordNormalized.includes(' ')) {
    const rows = database
      .prepare(
        `SELECT id FROM entries
         WHERE layer = 'sentence' AND instr(' ' || normalized || ' ', ' ' || ? || ' ') > 0`
      )
      .all(wordNormalized) as { id: number }[]
    return rows.map((row) => row.id)
  }

  const variants = variantsOf(wordNormalized)
  const placeholders = variants.map(() => '?').join(', ')
  const rows = database
    .prepare(
      `SELECT DISTINCT sentence_id AS id FROM sentence_tokens WHERE token IN (${placeholders})`
    )
    .all(...variants) as { id: number }[]

  return rows.map((row) => row.id)
}

/**
 * 이 문장에 든 단어들.
 *
 * 등록된 단어를 모두 꺼내 변형까지 펼쳐서 맞춰본다. 색인 쪽에서만 변형을 펼치면
 * 문장에 "run" 이 있고 단어가 "runs" 로 등록된 경우를 놓친다. 양쪽을 같은 방식으로
 * 펼쳐야 어느 쪽을 먼저 등록하든 결과가 같다.
 */
function wordsInside(sentenceNormalized: string): number[] {
  const tokens = new Set(indexTokensOf(sentenceNormalized))
  const padded = ` ${sentenceNormalized} `

  const words = getDatabase()
    .prepare(`SELECT id, normalized FROM entries WHERE layer = 'word'`)
    .all() as { id: number; normalized: string }[]

  const matched: number[] = []
  for (const word of words) {
    if (word.normalized.includes(' ')) {
      if (padded.includes(` ${word.normalized} `)) matched.push(word.id)
      continue
    }
    if (variantsOf(word.normalized).some((variant) => tokens.has(variant))) matched.push(word.id)
  }

  return matched
}

/**
 * 색인이 비어 있는 문장을 찾아 다시 훑는다.
 *
 * 시드 스크립트나 sqlite3 로 직접 넣은 문장은 앱을 거치지 않았으므로 토큰이 없다.
 * 앱을 켤 때 한 번 메워두면 그런 문장도 자동 연결에 참여한다.
 */
export function backfillSentenceTokens(): number {
  const rows = getDatabase()
    .prepare(
      `SELECT ${ENTRY_COLUMNS} FROM entries e
       WHERE e.layer = 'sentence'
         AND NOT EXISTS (SELECT 1 FROM sentence_tokens t WHERE t.sentence_id = e.id)`
    )
    .all() as EntryRow[]

  for (const row of rows) {
    const sentence = toEntry(row)
    reindexSentence(sentence)
    autolinkSentence(sentence)
  }

  return rows.length
}
