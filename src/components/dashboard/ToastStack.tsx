export type Toast = {
  id: string
  message: string
  tone: 'info' | 'success' | 'warning'
}

type ToastStackProps = {
  toasts: Toast[]
}

export const ToastStack = ({ toasts }: ToastStackProps) => {
  if (!toasts.length) return null

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
