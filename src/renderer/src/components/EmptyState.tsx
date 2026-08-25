interface Props {
  title: string
  hint?: string
}

export function EmptyState({ title, hint }: Props): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      {hint && <p className="mt-1 text-sm text-neutral-400">{hint}</p>}
    </div>
  )
}
