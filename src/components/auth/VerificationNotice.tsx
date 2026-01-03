import { useEffect, useRef } from 'react'

type VerificationNoticeProps = {
  open: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export const VerificationNotice = ({ open, onConfirm, onDismiss }: VerificationNoticeProps) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const focusTimer = window.setTimeout(() => {
      buttonRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onDismiss()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss, open])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
      aria-describedby="verification-description"
    >
      <div className="modal-card">
        <h2 id="verification-title">Confirmacao de email</h2>
        <p className="muted" id="verification-description">
          Enviamos um email para voce confirmar sua conta. Verifique sua caixa de entrada.
        </p>
        <div className="modal-actions">
          <button type="button" ref={buttonRef} onClick={onConfirm}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
