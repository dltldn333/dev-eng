import { z } from 'zod'
import { LAYERS } from './layer'

/**
 * 렌더러에서 오는 입력은 신뢰하지 않는다. IPC 경계에서 전부 이 스키마로 검증한다.
 */
export const layerSchema = z.enum(LAYERS, { message: '알 수 없는 레이어입니다' })

export const entryIdSchema = z.number().int().positive({ message: '항목 번호가 올바르지 않습니다' })

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, '태그 이름을 입력해주세요')
  .max(30, '태그 이름이 너무 깁니다')

export const createEntrySchema = z.object({
  layer: layerSchema,
  text: z.string().trim().min(1, '내용을 입력해주세요'),
  memo: z.string().default(''),
  /** 등록과 동시에 붙일 태그. 없는 태그는 만들어진다. */
  tags: z.array(tagNameSchema).default([]),
  /** 등록과 동시에 이을 상위 레이어 항목. 단어라면 어원, 문장이라면 단어. */
  parentIds: z.array(entryIdSchema).default([])
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

/** 정렬 기준. 셋 다 "무엇을 먼저 볼 것인가"를 다르게 답한다. */
export const sortSchema = z.enum(['text', 'created', 'visits'])
export const directionSchema = z.enum(['asc', 'desc'])

export const listEntriesSchema = z.object({
  layer: layerSchema,
  sort: sortSchema.default('text'),
  direction: directionSchema.default('asc'),
  /** 고른 태그를 모두 가진 항목만 남긴다. 비어 있으면 전체. */
  tagIds: z.array(entryIdSchema).default([])
})

export const tagAssignSchema = z.object({
  entryId: entryIdSchema,
  name: tagNameSchema
})

export const tagUpdateSchema = z.object({
  id: entryIdSchema,
  memo: z.string()
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

export type ListEntriesInput = z.input<typeof listEntriesSchema>
export type EntrySort = z.infer<typeof sortSchema>
export type SortDirection = z.infer<typeof directionSchema>
export type TagAssignInput = z.infer<typeof tagAssignSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
export type CreateEntryInput = z.infer<typeof createEntrySchema>
/** 화면에서 넘길 때의 모양. 기본값이 있는 항목은 생략할 수 있다. */
export type CreateEntryPayload = z.input<typeof createEntrySchema>
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>
export type LinkInput = z.infer<typeof linkSchema>
export type UnlinkInput = z.infer<typeof unlinkSchema>
