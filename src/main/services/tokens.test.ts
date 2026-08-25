import { describe, expect, it } from 'vitest'
import { indexTokensOf, tokenize, variantsOf } from './tokens'

describe('tokenize', () => {
  it('구두점을 걷어내고 소문자 토큰으로 쪼갠다', () => {
    expect(tokenize('Let me inspect the log!').sort()).toEqual(
      ['let', 'me', 'inspect', 'the', 'log'].sort()
    )
  })

  it('하이픈으로 이어진 말은 통째로도, 조각으로도 남긴다', () => {
    expect(tokenize('a well-known bug')).toContain('well-known')
    expect(tokenize('a well-known bug')).toContain('well')
    expect(tokenize('a well-known bug')).toContain('known')
  })

  it('같은 낱말이 여러 번 나와도 한 번만 센다', () => {
    expect(tokenize('log the log')).toEqual(['log', 'the'])
  })

  it('알파벳이 없으면 빈 배열', () => {
    expect(tokenize('...')).toEqual([])
  })
})

describe('variantsOf', () => {
  const has = (token: string, expected: string): boolean => variantsOf(token).includes(expected)

  it('복수형에서 원형을 찾아낸다', () => {
    expect(has('runs', 'run')).toBe(true)
    expect(has('boxes', 'box')).toBe(true)
    expect(has('studies', 'study')).toBe(true)
  })

  it('과거형에서 원형을 찾아낸다', () => {
    expect(has('walked', 'walk')).toBe(true)
    expect(has('used', 'use')).toBe(true)
    expect(has('stopped', 'stop')).toBe(true)
  })

  it('진행형에서 원형을 찾아낸다', () => {
    expect(has('reading', 'read')).toBe(true)
    expect(has('making', 'make')).toBe(true)
    expect(has('running', 'run')).toBe(true)
  })

  it('소유격과 축약형을 벗겨낸다', () => {
    expect(has("team's", 'team')).toBe(true)
    expect(has("don't", 'dont')).toBe(true)
  })

  it('토큰 자신은 언제나 후보에 남는다', () => {
    expect(has('inspect', 'inspect')).toBe(true)
    expect(has('ss', 'ss')).toBe(true)
  })

  it('짧은 낱말을 과하게 깎지 않는다', () => {
    expect(has('is', 'i')).toBe(false)
    expect(has('less', 'les')).toBe(false)
  })
})

describe('indexTokensOf', () => {
  it('문장이 남기는 색인에 원형이 포함된다', () => {
    const tokens = indexTokensOf('He runs fast.')
    expect(tokens).toContain('runs')
    expect(tokens).toContain('run')
  })
})
