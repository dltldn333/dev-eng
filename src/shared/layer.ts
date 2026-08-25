/** 어원 → 단어 → 문장. 인접한 레이어끼리만 연결할 수 있다. */
export const LAYERS = ['root', 'word', 'sentence'] as const

export type Layer = (typeof LAYERS)[number]

export const LAYER_LABEL: Record<Layer, string> = {
  root: '어원',
  word: '단어',
  sentence: '문장'
}
