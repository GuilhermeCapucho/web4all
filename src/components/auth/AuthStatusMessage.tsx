type AuthStatusMessageProps = {
  message: string | null
  visible: boolean
}

export const AuthStatusMessage = ({ message, visible }: AuthStatusMessageProps) => {
  if (!message) return null

  return (
    <p className={`status error${visible ? '' : ' is-hidden'}`} role="alert">
      {message}
    </p>
  )
}
