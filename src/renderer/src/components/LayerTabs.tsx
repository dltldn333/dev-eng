import { LAYERS, LAYER_LABEL, type Layer } from '@shared/layer'

interface Props {
  active: Layer
  onSelect: (layer: Layer) => void
}

export function LayerTabs({ active, onSelect }: Props): React.JSX.Element {
  return (
    <nav className="flex gap-1" aria-label="레이어">
      {LAYERS.map((layer) => {
        const selected = layer === active
        return (
          <button
            key={layer}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onSelect(layer)}
            className={
              selected
                ? 'rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white'
                : 'rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900'
            }
          >
            {LAYER_LABEL[layer]}
          </button>
        )
      })}
    </nav>
  )
}
