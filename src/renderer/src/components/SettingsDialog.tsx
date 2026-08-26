import { LAYERS, LAYER_LABEL } from '@shared/layer'
import { DEFAULT_COLORS, useListPreferences, type ColorKey } from '../preferences/context'
import { Modal } from './Modal'

const LABEL: Record<ColorKey, string> = {
  root: LAYER_LABEL.root,
  word: LAYER_LABEL.word,
  sentence: LAYER_LABEL.sentence,
  highlight: '문장 속 단어'
}

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: Props): React.JSX.Element {
  const { colors, setColor, resetColors } = useListPreferences()

  const changed = (Object.keys(DEFAULT_COLORS) as ColorKey[]).some(
    (key) => colors[key] !== DEFAULT_COLORS[key]
  )

  return (
    <Modal open={open} title="설정" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-neutral-500">분류색</h3>
          <p className="text-xs leading-relaxed text-neutral-400">
            디테일 뷰에서 어느 갈래인지 구분하는 데 쓰입니다.
          </p>

          {LAYERS.map((layer) => (
            <ColorRow key={layer} name={layer} value={colors[layer]} onChange={setColor} />
          ))}
        </section>

        <section className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-medium text-neutral-500">하이라이트</h3>
          <p className="text-xs leading-relaxed text-neutral-400">
            문장 안에서 이미 등록한 단어에 칠하는 색입니다.
          </p>

          <ColorRow name="highlight" value={colors.highlight} onChange={setColor} />
        </section>

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            disabled={!changed}
            onClick={resetColors}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors not-disabled:hover:bg-neutral-100 not-disabled:hover:text-neutral-900 disabled:text-neutral-300"
          >
            기본값으로
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ColorRow({
  name,
  value,
  onChange
}: {
  name: ColorKey
  value: string
  onChange: (key: ColorKey, value: string) => void
}): React.JSX.Element {
  return (
    <label className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="size-7 cursor-pointer rounded border border-neutral-200 bg-white p-0.5"
      />
      <span className="flex-1 text-sm text-neutral-700">{LABEL[name]}</span>
      <span className="font-mono text-xs text-neutral-400 uppercase">{value}</span>
    </label>
  )
}
