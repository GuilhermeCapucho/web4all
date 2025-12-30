import type { ReactNode } from 'react'

type ConfirmDeleteModalProps = {
  open: boolean
  title?: ReactNode
  description?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDeleteModal = ({
  open,
  title = 'Confirmar exclusao',
  description = 'Deseja realmente excluir esta atividade?',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) => {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="modal-card">
        <header className="modal-header">
          <h2 id="confirm-delete-title">{title}</h2>
        </header>
        <p>{description}</p>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="ghost danger" onClick={onConfirm}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
