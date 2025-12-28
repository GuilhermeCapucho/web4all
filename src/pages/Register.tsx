import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Register = () => {
  const navigate = useNavigate()
  const { signUp, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatus(null)
    const error = await signUp(email, password)
    if (error) {
      setStatus(error)
      setLoading(false)
      return
    }

    if (fullName.trim()) {
      await updateProfile({ full_name: fullName.trim() })
    }

    setLoading(false)
    navigate('/app', { replace: true })
  }

  return (
    <main className="auth-layout">
      <a className="skip-link" href="#register-form">
        Pular para o formulario
      </a>
      <section className="auth-card">
        <header>
          <h1>Criar conta</h1>
          <p className="muted">
            Configure seu perfil e personalize acessibilidade em poucos passos.
          </p>
        </header>
        <form id="register-form" onSubmit={handleSubmit} className="form-grid">
          <label>
            Nome completo
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name"/>
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email"/>
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password"/>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
          {status ? (
            <p className="status error" role="alert">
              {status}
            </p>
          ) : null}
        </form>
        <footer>
          <span className="muted">Ja tem conta?</span>
          <Link to="/login">Entrar</Link>
        </footer>
      </section>
    </main>
  )
}
