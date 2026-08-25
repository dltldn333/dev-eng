import { z } from 'zod'
import { LAYERS } from './layer'

/**
 * 렌더러에서 오는 입력은 신뢰하지 않는다. IPC 경계에서 전부 이 스키마로 검증한다.
 */
export const layerSchema = z.enum(LAYERS, { message: '알 수 없는 레이어입니다' })

export const entryIdSchema = z.number().int().positive({ message: '항목 번호가 올바르지 않습니다' })

export const createEntrySchema = z.object({
  layer: layerSchema,
  text: z.string().trim().min(1, '내용을 입력해주세요'),
  memo: z.string().default('')
})

export const updateEntrySchema = z
  .object({
    id: entryIdSchema,
    text: z.string().trim().min(1, '내용을 입력해주세요').optional(),
    memo: z.string().optional()
  })
  .refine((value) => value.text !== undefined || value.memo !== undefined, {
    message: '수정할 내용이 없습니다'
  })

export const linkSchema = z.object({
  parentId: entryIdSchema,
  childId: entryIdSchema,
  origin: z.enum(['auto', 'manual']).default('manual')
})

export const unlinkSchema = z.object({
  parentId: entryIdSchema,
  childId: entryIdSchema
})

export type CreateEntryInput = z.infer<typeof createEntrySchema>
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>
export type LinkInput = z.infer<typeof linkSchema>
export type UnlinkInput = z.infer<typeof unlinkSchema>
