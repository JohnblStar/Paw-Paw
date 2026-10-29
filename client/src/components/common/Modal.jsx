import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/35 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md animate-modal-in overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-1.5 rounded-full p-1.5 text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
