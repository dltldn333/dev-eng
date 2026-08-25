// 개발용 예시 데이터를 앱 DB에 넣는다. 시스템 sqlite3 를 사용한다.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const APP_NAME = 'dev-eng'

function userDataDir() {
  if (process.platform === 'darwin')
    return join(homedir(), 'Library', 'Application Support', APP_NAME)
  if (process.platform === 'win32') return join(process.env.APPDATA ?? homedir(), APP_NAME)
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), APP_NAME)
}

const database = join(userDataDir(), `${APP_NAME}.db`)

if (!existsSync(database)) {
  console.error(`DB가 아직 없습니다: ${database}`)
  console.error('먼저 `npm run dev` 로 앱을 한 번 실행해주세요.')
  process.exit(1)
}

execFileSync('sqlite3', [database], {
  input: (await import('node:fs')).readFileSync(new URL('./seed.sql', import.meta.url), 'utf8'),
  stdio: ['pipe', 'inherit', 'inherit']
})

console.log(`예시 데이터를 넣었습니다: ${database}`)
