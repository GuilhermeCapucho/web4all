import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <main className="auth-layout">
      <a className="skip-link" href="#login-form">
        Pular para o formulario
      </a>
      <section className="auth-card">
        <header>
          <h1>Bem-vindo de volta</h1>
          <p className="muted">
            Entre para acessar suas atividades e preferencias de acessibilidade.
          </p>
        </header>
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
          {status ? (
            <p className="status error" role="alert">
              {status}
            </p>
          ) : null}
        </form>
        <footer>
          <span className="muted">Ainda nao tem conta?</span>
          <Link to="/register">Criar conta</Link>
        </footer>
      </section>
    </main>
  )
}
