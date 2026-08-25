import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * 브라우저 기본 <dialog>를 쓴다. 포커스 가두기와 Esc 닫기를 직접 만들 이유가 없다.
 */
export function Modal({ open, title, onClose, children }: Props): React.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="m-auto w-[32rem] max-w-[calc(100vw-3rem)] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/20"
    >
      <div className="border-b border-neutral-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  )
}
