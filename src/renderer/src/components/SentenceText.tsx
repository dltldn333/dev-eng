import { useMemo, useState } from 'react'
import { segmentByKnown, variantsOf } from '@shared/tokens'
import type { LinkedEntry } from '@shared/types'

interface Props {
  text: string
  /** 이 문장에 연결된 단어들. 문장 안에서 이들을 찾아 표시한다. */
  words: LinkedEntry[]
  onOpen: (id: number) => void
}

/**
 * 문장을 보여주되, 이미 등록해둔 단어는 눌러서 넘어갈 수 있게 한다.
 *
 * 문장을 읽다가 아는 단어가 뭐였는지 확인하려고 아래 파티션까지 내려갔다 오는 일이 잦다.
 * 문장 안에서 바로 짚을 수 있으면 그 왕복이 사라진다.
 */
export function SentenceText({ text, words, onOpen }: Props): React.JSX.Element {
  const [openId, setOpenId] = useState<number | null>(null)

  const byKey = useMemo(() => {
    const index = new Map<string, LinkedEntry>()
    for (const word of words) {
      for (const variant of variantsOf(word.normalized)) {
        // 먼저 등록된 단어를 이긴 것으로 둔다. 변형이 겹칠 때 표시가 흔들리지 않게 한다.
        if (!index.has(variant)) index.set(variant, word)
      }
    }
    return index
  }, [words])

  const segments = useMemo(() => segmentByKnown(text, new Set(byKey.keys())), [text, byKey])

  return (
    <span>
      {segments.map((segment, index) => {
        const word = segment.key ? byKey.get(segment.key) : undefined
        if (!word) return <span key={index}>{segment.text}</span>

        return (
          <span key={index} className="relative inline-block">
            <button
              type="button"
              onClick={() => onOpen(word.id)}
              onMouseEnter={() => setOpenId(word.id)}
              onMouseLeave={() => setOpenId(null)}
              onFocus={() => setOpenId(word.id)}
              onBlur={() => setOpenId(null)}
              className="cursor-pointer rounded-sm bg-amber-200/70 px-1 decoration-amber-500 underline-offset-4 transition-colors hover:bg-amber-300/80 hover:underline"
            >
              {segment.text}
            </button>

            {openId === word.id && <WordPreview word={word} />}
          </span>
        )
      })}
    </span>
  )
}

function WordPreview({ word }: { word: LinkedEntry }): React.JSX.Element {
  return (
    <span className="absolute top-full left-0 z-20 mt-1 block w-64 rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-lg">
      <span className="block text-sm font-semibold text-neutral-900">{word.text}</span>

      <span className="mt-1 line-clamp-3 block text-xs leading-relaxed text-neutral-500">
        {word.memo || '본문 없음'}
      </span>

      {word.tags.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1">
          {word.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </span>
      )}

      <span className="mt-2 block text-[11px] text-neutral-400">
        {word.origin === 'auto' ? '자동으로 연결됨' : '직접 연결함'} · 눌러서 열기
      </span>
    </span>
  )
}
