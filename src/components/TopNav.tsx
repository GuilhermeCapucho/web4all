import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const TopNav = () => {
  const { signOut, profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="top-nav">
      <div className="brand">
        <NavLink to="/app" aria-label="Ir para pagina principal">
          <img className="brand-logo" src="/favicon.svg" alt="Web4All" />
        </NavLink>
      </div>
      <nav className="nav-links" aria-label="Navegacao principal">
        <NavLink to="/app">Atividades</NavLink>
        {isTeacher ? <NavLink to="/students">Alunos</NavLink> : null}
        <NavLink to="/profile">Perfil</NavLink>
      </nav>
      <div className="nav-actions">
        <button type="button" className="ghost" onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </header>
  )
}
