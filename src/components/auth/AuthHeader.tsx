type AuthHeaderProps = {
  title: string
  subtitle: string
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <header>
      <img className="auth-logo" src="/favicon.svg" alt="Web4All" />
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </header>
  )
}
