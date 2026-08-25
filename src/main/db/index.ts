import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { MIGRATIONS } from './migrations'

let connection: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (connection) return connection

  const file = join(app.getPath('userData'), 'dev-eng.db')
  const database = new Database(file)

  // WAL: 읽기와 쓰기가 서로를 막지 않는다. 데스크탑 앱에서는 사실상 기본값.
  database.pragma('journal_mode = WAL')
  // 외래키는 SQLite에서 연결당 기본 OFF다. 켜지 않으면 ON DELETE CASCADE가 동작하지 않는다.
  database.pragma('foreign_keys = ON')

  migrate(database)

  connection = database
  return connection
}

export function getDatabase(): Database.Database {
  if (!connection) {
    throw new Error('DB가 초기화되지 않았습니다. initDatabase()를 먼저 호출하세요.')
  }
  return connection
}

export function closeDatabase(): void {
  connection?.close()
  connection = null
}

/**
 * 적용된 스키마 버전은 PRAGMA user_version 에 담는다.
 * DB 헤더에 들어가는 값이라 트랜잭션 안에서 SQL과 함께 커밋/롤백된다.
 */
function migrate(database: Database.Database): void {
  const current = database.pragma('user_version', { simple: true }) as number
  const pending = MIGRATIONS.filter((migration) => migration.version > current).sort(
    (a, b) => a.version - b.version
  )

  for (const migration of pending) {
    database.transaction(() => {
      database.exec(migration.up)
      database.pragma(`user_version = ${migration.version}`)
    })()
  }
}

/** 개발 중 스키마가 의도대로 올라갔는지 확인하기 위한 요약. */
export function describeSchema(database: Database.Database): {
  path: string
  version: number
  tables: string[]
} {
  const rows = database
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all() as { name: string }[]

  return {
    path: database.name,
    version: database.pragma('user_version', { simple: true }) as number,
    tables: rows.map((row) => row.name)
  }
}
