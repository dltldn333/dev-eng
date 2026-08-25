import { app, dialog, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { closeDatabase, describeSchema, initDatabase } from './db'

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

  // 외부 링크는 앱 안에서 열지 않고 기본 브라우저로 넘긴다.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
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
    if (!app.isPackaged) {
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
