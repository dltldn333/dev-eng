import { contextBridge, ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/channels'
import type {
  CreateEntryInput,
  LinkInput,
  ListEntriesInput,
  TagAssignInput,
  UnlinkInput,
  UpdateEntryInput
} from '@shared/schemas'
import type { Entry, LinkedEntry, Tag } from '@shared/types'

/**
 * ipcRenderer.invoke 가 거부되면 Electron이 채널 이름을 붙인 긴 메시지를 던진다.
 * 화면에 그대로 보여줄 수 없으므로 원래 메시지만 남긴다.
 */
async function invoke<Result>(channel: string, payload?: unknown): Promise<Result> {
  try {
    return (await ipcRenderer.invoke(channel, payload)) as Result
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error)
    // "Error invoking remote method 'links:create': SqliteError: ..." 에서 마지막 문장만 남긴다.
    throw new Error(
      message.replace(/^Error invoking remote method '[^']+':\s*(\w*Error:\s*)?/, ''),
      {
        cause: error
      }
    )
  }
}

/**
 * 렌더러가 메인 프로세스에 닿는 유일한 통로.
 * DB 핸들도 node API도 넘기지 않고, 이 함수들만 노출한다.
 */
const api = {
  /** 창 장식이 OS마다 달라서, 화면이 여백을 어디에 둘지 정하려면 이 값이 필요하다. */
  platform: process.platform,

  entries: {
    list: (input: ListEntriesInput): Promise<Entry[]> => invoke(CHANNELS.entriesList, input),
    get: (id: number): Promise<Entry | null> => invoke(CHANNELS.entriesGet, id),
    create: (input: CreateEntryInput): Promise<Entry> => invoke(CHANNELS.entriesCreate, input),
    update: (input: UpdateEntryInput): Promise<Entry> => invoke(CHANNELS.entriesUpdate, input),
    remove: (id: number): Promise<void> => invoke(CHANNELS.entriesDelete, id),
    visit: (id: number): Promise<Entry | null> => invoke(CHANNELS.entriesVisit, id)
  },
  tags: {
    list: (): Promise<Tag[]> => invoke(CHANNELS.tagsList),
    assign: (input: TagAssignInput): Promise<void> => invoke(CHANNELS.tagsAssign, input),
    unassign: (input: TagAssignInput): Promise<void> => invoke(CHANNELS.tagsUnassign, input)
  },
  links: {
    parentsOf: (id: number): Promise<LinkedEntry[]> => invoke(CHANNELS.linksParents, id),
    childrenOf: (id: number): Promise<LinkedEntry[]> => invoke(CHANNELS.linksChildren, id),
    create: (input: LinkInput): Promise<void> => invoke(CHANNELS.linksCreate, input),
    remove: (input: UnlinkInput): Promise<void> => invoke(CHANNELS.linksDelete, input)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
