import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { TopNav } from '../components/TopNav'

export const Profile = () => {
  const { user, profile, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [fontScale, setFontScale] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setFontScale(profile.font_scale ?? 100)
    setHighContrast(profile.high_contrast ?? false)
  }, [profile])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    const error = await updateProfile({
      full_name: fullName.trim() || null,
      font_scale: fontScale,
      high_contrast: highContrast,
    })
    setSaving(false)
    setStatus(error ?? 'Preferencias atualizadas com sucesso.')
  }

  return (
    <div className="app-shell">
      <TopNav />
      <main className="dashboard" id="main-content">
        <section className="panel">
          <header className="panel-header">
            <div>
              <h1>Perfil</h1>
              <p className="muted">
                Atualize seu nome e preferencias de acessibilidade.
              </p>
            </div>
          </header>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={user?.email ?? ''} disabled />
            </label>
            <label>
              Nome completo
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)}/>
            </label>
            <label>
              Tamanho da fonte
              <select value={fontScale} onChange={(event) => setFontScale(Number(event.target.value))}>
                <option value={100}>Normal (100%)</option>
                <option value={110}>Grande (110%)</option>
                <option value={120}>Muito grande (120%)</option>
                <option value={130}>Extra grande (130%)</option>
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)}/>
              Ativar alto contraste
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar preferencias'}
            </button>
            {status ? (
              <p className={`status ${status.includes('sucesso') ? 'success' : 'error'}`}>
                {status}
              </p>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  )
}
