import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthHeader } from '../components/auth/AuthHeader'
import { AuthPhotoPanel } from '../components/auth/AuthPhotoPanel'
import { AuthStatusMessage } from '../components/auth/AuthStatusMessage'
import { VerificationNotice } from '../components/auth/VerificationNotice'
import { useTransientStatus } from '../hooks/useTransientStatus'

export const Register = () => {
  const navigate = useNavigate()
  const { signUp, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { status, setStatus, visible: statusVisible } = useTransientStatus()
  const [loading, setLoading] = useState(false)
  const [showVerificationNotice, setShowVerificationNotice] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatus(null)
    const error = await signUp(email, password, fullName)
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
    <main className="auth-layout auth-layout--split">
      <section className="auth-card">
        <AuthHeader title="Criar conta" subtitle="Cadastre-se para acessar todos os recursos da plataforma" />
        <form id="register-form" onSubmit={handleSubmit} className="form-grid">
          <label>
            Nome completo
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name"/>
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
          <AuthStatusMessage message={status} visible={statusVisible} />
        </form>
        <footer>
          <span className="muted">Ja tem conta?</span>
          <Link to="/login">Entrar</Link>
        </footer>
      </section>
      <AuthPhotoPanel
        imageUrl="/students/register-image.jpg"
        ariaLabel="Aprendizado acessível para todos"
        eyebrow="Web4All"
        title="Aprendizado acessível para todos"
        subtitle="Cadastre sua conta e acompanhe o desenvolvimento com mais autonomia e inclusão."
      />
      <VerificationNotice
        open={showVerificationNotice}
        onDismiss={() => {
          setShowVerificationNotice(false)
          navigate('/login', { replace: true })
        }}
        onConfirm={() => {
          setShowVerificationNotice(false)
          navigate('/login', { replace: true })
        }}
      />
    </main>
  )
}

