import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const TopNav = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="top-nav">
      <div className="brand">
        <div>
          <strong>Web4All</strong>
        </div>
      </div>
      <nav className="nav-links" aria-label="Navegacao principal">
        <NavLink to="/app">Atividades</NavLink>
        <NavLink to="/profile">Perfil</NavLink>
      </nav>
      <div className="nav-actions">
        <span className="muted">{user?.email}</span>
        <button type="button" className="ghost" onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </header>
  )
}
