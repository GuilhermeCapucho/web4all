import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthHeader } from '../components/auth/AuthHeader'
import { AuthPhotoPanel } from '../components/auth/AuthPhotoPanel'
import { AuthStatusMessage } from '../components/auth/AuthStatusMessage'

export const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [statusVisible, setStatusVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!status) {
      return
    }
    setStatusVisible(true)
    const hideTimer = window.setTimeout(() => {
      setStatusVisible(false)
    }, 5000)
    const clearTimer = window.setTimeout(() => {
      setStatus(null)
    }, 5300)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [status])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatus(null)
    const error = await signIn(email, password)
    setLoading(false)
    if (error) {
      setStatus(error)
      return
    }
    navigate('/app', { replace: true })
  }

  return (
    <main className="auth-layout auth-layout--split">
      <section className="auth-card">
        <AuthHeader title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar" />
        <form id="login-form" onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email"/>
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password"/>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <AuthStatusMessage message={status} visible={statusVisible} />
        </form>
        <footer>
          <span className="muted">Ainda nao tem conta?</span>
          <Link to="/register">Criar conta</Link>
        </footer>
      </section>
      <AuthPhotoPanel
        imageUrl="/students/login-image.jpg"
        ariaLabel="Aprendizado acessível para todos"
        eyebrow="Web4All"
        title="Aprendizado acessível para todos"
        subtitle="Uma plataforma pensada para acolher diferentes necessidades e potencializar cada estudante."
      />
    </main>
  )
}
