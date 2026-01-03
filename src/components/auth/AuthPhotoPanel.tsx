type AuthPhotoPanelProps = {
  imageUrl: string
  ariaLabel: string
  eyebrow: string
  title: string
  subtitle: string
}

export const AuthPhotoPanel = ({ imageUrl, ariaLabel, eyebrow, title, subtitle }: AuthPhotoPanelProps) => {
  return (
    <section className="auth-photo" style={{ backgroundImage: `url('${imageUrl}')` }} aria-label={ariaLabel}>
      <div className="auth-photo__content">
        <p className="auth-photo__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="auth-photo__subtitle">{subtitle}</p>
      </div>
    </section>
  )
}
