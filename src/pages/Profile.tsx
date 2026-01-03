import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TopNav } from '../components/TopNav'
import { buildCommonVoiceCommands } from '../voice/commonVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand } from '../voice/voiceCommands'
import { useVoiceCommandListener } from '../voice/useVoiceCommandListener'
import { useTransientStatus } from '../hooks/useTransientStatus'

export const Profile = () => {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const { status, setStatus, visible: statusVisible } = useTransientStatus()
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
  }, [profile])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    const error = await updateProfile({
      full_name: fullName.trim() || null,
    })
    setSaving(false)
    setStatusTone(error ? 'error' : 'success')
    setStatus(error ?? 'Perfil atualizado com sucesso.')
  }

  const voiceCommands = useMemo<VoiceCommand[]>(() => {
    const notify = (message: string, tone: 'info' | 'success' | 'warning' = 'info') => {
      if (tone === 'info') return
      setStatusTone(tone === 'success' ? 'success' : 'error')
      setStatus(message)
    }

    return buildCommonVoiceCommands({
      navigate,
      signOut,
      notify,
    })
  }, [navigate, signOut])

  const handleVoiceCommand = useCallback(async (transcript: string) => {
    const normalized = normalizeVoiceText(transcript)
    if (!normalized) return
    await runVoiceCommands(voiceCommands, { transcript, normalized })
  }, [voiceCommands])

  useVoiceCommandListener(handleVoiceCommand)

  return (
    <div className="app-shell">
      <TopNav />
      <main className="dashboard" id="main-content">
        <section className="panel">
          <header className="panel-header">
            <div>
              <h1>Perfil</h1>
              <p className="muted">
                Atualize seu nome.
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
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {status ? (
              <p className={`status ${statusTone === 'success' ? 'success' : 'error'}${statusVisible ? '' : ' is-hidden'}`} role={statusTone === 'success' ? 'status' : 'alert'} aria-live="polite" aria-atomic="true">
                {status}
              </p>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  )
}
