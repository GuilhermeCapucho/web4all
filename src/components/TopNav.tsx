import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const TopNav = () => {
  const { signOut, profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
  }

  return (
    <header className={`top-nav${menuOpen ? ' is-open' : ''}`}>
      <div className="brand">
        <NavLink to="/app" aria-label="Ir para pagina principal">
          <img className="brand-logo" src="/favicon.svg" alt="Web4All" />
        </NavLink>
        <div className="braille-tagline">
          <span className="braille-text" aria-hidden="true">
            ⠁⠍⠃⠊⠑⠝⠞⠑ ⠁⠉⠑⠎⠎⠊⠧⠑⠇ ⠋⠑⠊⠞⠕ ⠏⠁⠗⠁ ⠞⠕⠙⠕⠎⠲
          </span>
          <span className="sr-only">Ambiente acessível feito para todos.</span>
        </div>
      </div>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="primary-nav"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span className="sr-only">{menuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
        <span aria-hidden="true" className="nav-toggle__bar" />
      </button>
      <div className="nav-menu" id="primary-nav">
        <nav className="nav-links" aria-label="Navegacao principal">
          <NavLink to="/app" onClick={() => setMenuOpen(false)}>Atividades</NavLink>
          {isTeacher ? <NavLink to="/students" onClick={() => setMenuOpen(false)}>Alunos</NavLink> : null}
          <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Perfil</NavLink>
        </nav>
        <div className="nav-actions">
          <button type="button" className="ghost" onClick={handleSignOut}>
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
