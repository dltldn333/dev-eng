import { contextBridge } from 'electron'

/**
 * 렌더러에 노출하는 유일한 통로.
 * DB 접근은 전부 메인 프로세스에 두고, 여기서는 타입이 붙은 호출만 넘긴다.
 */
const api = {
  version: (): string => process.versions.electron
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
