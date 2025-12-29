import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Register = () => {
  const navigate = useNavigate()
  const { signUp, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [statusVisible, setStatusVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showVerificationNotice, setShowVerificationNotice] = useState(false)
  const noticeButtonRef = useRef<HTMLButtonElement | null>(null)

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

  useEffect(() => {
    if (!showVerificationNotice) return
    const focusTimer = window.setTimeout(() => {
      noticeButtonRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(focusTimer)
  }, [showVerificationNotice])

  useEffect(() => {
    if (!showVerificationNotice) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setShowVerificationNotice(false)
      navigate('/login', { replace: true })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, showVerificationNotice])

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
    setShowVerificationNotice(true)
  }

  return (
    <main className="auth-layout">
      <a className="skip-link" href="#register-form">
        Pular para o formulario
      </a>
      <section className="auth-card">
        <header>
          <img className="auth-logo" src="/favicon.svg" alt="Web4All"/>
          <h1 className="auth-title">Criar conta</h1>
          <p className="auth-subtitle">
            Cadastre-se para acessar todos os recursos da plataforma
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
            <p className={`status error${statusVisible ? '' : ' is-hidden'}`} role="alert">
              {status}
            </p>
          ) : null}
        </form>
        <footer>
          <span className="muted">Ja tem conta?</span>
          <Link to="/login">Entrar</Link>
        </footer>
      </section>
      {showVerificationNotice ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="verification-title" aria-describedby="verification-description">
          <div className="modal-card">
            <h2 id="verification-title">Confirmacao de email</h2>
            <p className="muted" id="verification-description">
              Enviamos um email para voce confirmar sua conta. Verifique sua caixa de entrada.
            </p>
            <div className="modal-actions">
              <button type="button" ref={noticeButtonRef}
                onClick={() => {
                  setShowVerificationNotice(false)
                  navigate('/login', { replace: true })
                }}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
