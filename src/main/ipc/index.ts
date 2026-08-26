import { ipcMain } from 'electron'
import { z } from 'zod'
import { CHANNELS } from '@shared/channels'
import {
  createEntrySchema,
  entryIdSchema,
  linkSchema,
  listEntriesSchema,
  tagAssignSchema,
  tagUpdateSchema,
  unlinkSchema,
  updateEntrySchema
} from '@shared/schemas'
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  recordVisit,
  updateEntry
} from '../repositories/entries'
import { createLink, deleteLink, listChildren, listParents } from '../repositories/links'
import { assignTag, getTag, listTags, unassignTag, updateTag } from '../repositories/tags'

/**
 * 렌더러가 보낸 값은 전부 여기서 스키마로 걸러낸 뒤에야 리포지토리로 들어간다.
 * 검증을 각 핸들러에 흩어놓지 않으려고 감싸는 함수를 하나 둔다.
 */
function handle<Schema extends z.ZodType, Result>(
  channel: string,
  schema: Schema,
  handler: (payload: z.infer<Schema>) => Result
): void {
  ipcMain.handle(channel, (_event, payload: unknown) => {
    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(', ')
      throw new Error(`잘못된 요청입니다: ${message}`)
    }
    return handler(parsed.data)
  })
}

export function registerIpcHandlers(): void {
  handle(CHANNELS.entriesList, listEntriesSchema, listEntries)
  handle(CHANNELS.entriesGet, entryIdSchema, getEntry)
  handle(CHANNELS.entriesCreate, createEntrySchema, createEntry)
  handle(CHANNELS.entriesUpdate, updateEntrySchema, updateEntry)
  handle(CHANNELS.entriesDelete, entryIdSchema, deleteEntry)
  handle(CHANNELS.entriesVisit, entryIdSchema, recordVisit)

  handle(CHANNELS.linksParents, entryIdSchema, listParents)
  handle(CHANNELS.linksChildren, entryIdSchema, listChildren)
  handle(CHANNELS.linksCreate, linkSchema, createLink)
  handle(CHANNELS.linksDelete, unlinkSchema, deleteLink)

  handle(CHANNELS.tagsList, z.undefined(), listTags)
  handle(CHANNELS.tagsGet, entryIdSchema, getTag)
  handle(CHANNELS.tagsUpdate, tagUpdateSchema, updateTag)
  handle(CHANNELS.tagsAssign, tagAssignSchema, assignTag)
  handle(CHANNELS.tagsUnassign, tagAssignSchema, unassignTag)
}
