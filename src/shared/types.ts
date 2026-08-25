import type { Layer } from './layer'

export type LinkOrigin = 'auto' | 'manual'

export interface Entry {
  id: number
  layer: Layer
  text: string
  normalized: string
  memo: string
  visitCount: number
  visitedAt: string | null
  createdAt: string
  updatedAt: string
}

/** 연결을 타고 가져온 항목. 자동/수동 구분을 화면에서 보여줘야 해서 origin을 얹는다. */
export interface LinkedEntry extends Entry {
  origin: LinkOrigin
}
