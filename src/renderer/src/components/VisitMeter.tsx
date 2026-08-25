interface Props {
  count: number
  /** 지금 보고 있는 목록의 최대 방문 수. 절대값이 아니라 그 안에서의 비율을 보여준다. */
  max: number
}

/**
 * 방문 수를 목록에서 한눈에 비교할 수 있게 만든 막대.
 *
 * 눈금을 목록 최대값에 맞춘다. 3번과 40번은 절대 수치가 아니라 "이 안에서 얼마나 자주인가"로
 * 읽혀야 복습 우선순위로 쓸 수 있다.
 */
export function VisitMeter({ count, max }: Props): React.JSX.Element {
  const ratio = max > 0 ? count / max : 0

  return (
    <span
      className="flex shrink-0 items-center gap-1.5"
      title={count > 0 ? `${count}번 열어봤습니다` : '아직 열어보지 않았습니다'}
    >
      <span className="h-1 w-10 overflow-hidden rounded-full bg-neutral-100">
        <span
          className="block h-full rounded-full bg-neutral-400"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
      <span
        className={
          count > 0
            ? 'w-5 text-right text-xs text-neutral-500 tabular-nums'
            : 'w-5 text-right text-xs text-neutral-300 tabular-nums'
        }
      >
        {count}
      </span>
    </span>
  )
}
