import { normalize } from '@shared/normalize'

/**
 * 문장을 자동 연결의 단위로 쪼갠다.
 * normalize 가 구두점을 이미 걷어냈으므로 여기서는 공백과 하이픈만 다룬다.
 */
export function tokenize(text: string): string[] {
  const normalized = normalize(text)
  if (!normalized) return []

  const tokens = new Set<string>()

  for (const chunk of normalized.split(' ')) {
    const token = chunk.replace(/^[-']+|[-']+$/g, '')
    if (!token) continue

    tokens.add(token)

    // well-known 은 통째로도, well/known 으로도 걸려야 한다.
    if (token.includes('-')) {
      for (const part of token.split('-')) {
        if (part) tokens.add(part)
      }
    }
  }

  return [...tokens]
}

/**
 * 한 토큰이 가리킬 수 있는 원형 후보들. 토큰 자신을 항상 포함한다.
 *
 * 문장을 넣을 때도, 단어를 찾을 때도 같은 함수를 통과시킨다.
 * 양쪽이 같은 방식으로 넓어지므로 "inspects" 가 든 문장과 단어 "inspect" 가,
 * "running" 이 든 문장과 단어 "run" 이 서로 만난다.
 *
 * 사전 없이 규칙만 쓰기 때문에 없는 형태도 만들어낸다("makes" → "mak").
 * 그런 후보는 실제로 등록된 단어와 겹치지 않으므로 연결로 이어지지 않는다.
 * 반대로 불규칙 변화(go/went, be/was)는 잡지 못한다. 그건 손으로 연결한다.
 */
export function variantsOf(token: string): string[] {
  const variants = new Set<string>([token])

  const add = (candidate: string): void => {
    if (candidate.length >= 2) variants.add(candidate)
  }

  // team's → team
  if (token.endsWith("'s")) add(token.slice(0, -2))

  const bare = token.replace(/'/g, '')
  if (bare !== token) add(bare)

  for (const base of [...variants]) {
    if (base.endsWith('ies') && base.length > 4) add(`${base.slice(0, -3)}y`)

    if (base.endsWith('es') && base.length > 3) {
      add(base.slice(0, -2))
      add(base.slice(0, -1))
    }

    if (base.endsWith('s') && !base.endsWith('ss') && base.length > 3) add(base.slice(0, -1))

    // used(4자)까지 잡아야 하므로 3자 초과. bed, fed 같은 3자 낱말은 건드리지 않는다.
    if (base.endsWith('ed') && base.length > 3) {
      add(base.slice(0, -2)) // walked → walk
      add(base.slice(0, -1)) // used → use
      add(undouble(base.slice(0, -2))) // stopped → stop
    }

    if (base.endsWith('ing') && base.length > 5) {
      const stem = base.slice(0, -3)
      add(stem) // reading → read
      add(`${stem}e`) // making → make
      add(undouble(stem)) // running → run
    }
  }

  return [...variants]
}

/** 자음이 겹쳐 끝나면 하나로 줄인다. runn → run, stopp → stop */
function undouble(stem: string): string {
  const last = stem.at(-1)
  const previous = stem.at(-2)
  if (last && last === previous && !'aeiou'.includes(last)) return stem.slice(0, -1)
  return stem
}

/** 문장 하나가 인덱스에 남길 모든 토큰. */
export function indexTokensOf(text: string): string[] {
  const tokens = new Set<string>()
  for (const token of tokenize(text)) {
    for (const variant of variantsOf(token)) tokens.add(variant)
  }
  return [...tokens]
}
