import { app, dialog, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { closeDatabase, describeSchema, initDatabase } from './db'
import { registerIpcHandlers } from './ipc'
import { backfillSentenceTokens } from './services/autolink'

/** 앱이 열어줄 만한 주소인지 가려서 기본 브라우저로 넘긴다. */
function openExternally(url: string): void {
  const scheme = URL.parse(url)?.protocol
  if (scheme !== 'http:' && scheme !== 'https:') {
    if (!app.isPackaged) console.log(`[link] 열지 않음: ${url}`)
    return
  }

  if (!app.isPackaged) console.log(`[link] 기본 브라우저로: ${url}`)
  void shell.openExternal(url)
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 흰 화면 깜빡임을 피하려고 첫 페인트 후에 띄운다.
  window.on('ready-to-show', () => window.show())

  // 렌더러 콘솔을 터미널로 끌어온다. 개발 중 DevTools를 열지 않고도 오류를 본다.
  if (!app.isPackaged) {
    window.webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => {
      const where = sourceId ? ` (${sourceId}:${lineNumber})` : ''
      console.log(`[renderer:${level}] ${message}${where}`)
    })
  }

  // 외부 링크는 앱 안에서 열지 않고 기본 브라우저로 넘긴다.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })

  // target 없이 걸린 링크는 창을 새로 열지 않고 지금 화면을 덮어버린다.
  // 그러면 앱으로 돌아올 길이 없으므로, 앱 밖으로 나가는 이동은 전부 여기서 가로챈다.
  window.webContents.on('will-navigate', (event, url) => {
    if (url === window.webContents.getURL()) return
    event.preventDefault()
    openExternally(url)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  try {
    const database = initDatabase()
    const indexed = backfillSentenceTokens()
    if (!app.isPackaged) {
      if (indexed > 0) console.log(`[db] 색인이 없던 문장 ${indexed}개를 훑었습니다`)
      const schema = describeSchema(database)
      console.log(`[db] ${schema.path} (v${schema.version})`)
      console.log(`[db] tables: ${schema.tables.join(', ')}`)
    }
  } catch (error) {
    // DB 없이는 아무것도 할 수 없다. 조용히 빈 창을 띄우는 것보다 이유를 보여주고 끝내는 게 낫다.
    dialog.showErrorBox('데이터베이스를 열지 못했습니다', String(error))
    app.quit()
    return
  }

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  closeDatabase()
})
