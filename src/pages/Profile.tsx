import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TopNav } from '../components/TopNav'
import { buildCommonVoiceCommands } from '../voice/commonVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand } from '../voice/voiceCommands'
import { useVoiceCommandListener } from '../voice/useVoiceCommandListener'

export const Profile = () => {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [fontScale, setFontScale] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success')
  const [statusVisible, setStatusVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setFontScale(profile.font_scale ?? 100)
    setHighContrast(profile.high_contrast ?? false)
    setReduceMotion(profile.reduce_motion ?? false)
  }, [profile])

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

  const fontSteps = useMemo(() => [100, 110, 120, 130], [])

  const adjustFontScale = (direction: -1 | 1) => {
    setFontScale((current) => {
      const index = fontSteps.findIndex((value) => value === current)
      const safeIndex = index === -1 ? 0 : index
      const nextIndex = Math.min(Math.max(safeIndex + direction, 0), fontSteps.length - 1)
      return fontSteps[nextIndex]
    })
  }

  const fontLabel = useMemo(() => {
    const scaleLabel = fontScale === 100 ? 'Normal' : fontScale === 110 ? 'Grande' : fontScale === 120 ? 'Muito grande' : 'Extra grande'
    return `${scaleLabel} (${fontScale}%)`
  }, [fontScale])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    const error = await updateProfile({
      full_name: fullName.trim() || null,
      font_scale: fontScale,
      high_contrast: highContrast,
      reduce_motion: reduceMotion,
    })
    setSaving(false)
    setStatusTone(error ? 'error' : 'success')
    setStatus(error ?? 'Preferencias atualizadas com sucesso.')
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
      updateProfile,
      profile,
      notify,
    })
  }, [navigate, profile, signOut, updateProfile])

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
            <fieldset className="accessibility-group">
              <legend>Preferencias de acessibilidade</legend>
              <div className="font-control">
                <span id="font-scale-label">Tamanho da fonte</span>
                <div className="font-buttons" role="group" aria-labelledby="font-scale-label">
                  <button type="button" className="ghost" onClick={() => adjustFontScale(-1)} disabled={fontScale <= fontSteps[0]} aria-label="Diminuir tamanho da fonte">
                    A-
                  </button>
                  <span className="font-value" aria-live="polite" aria-atomic="true">
                    {fontLabel}
                  </span>
                  <button type="button" className="ghost" onClick={() => adjustFontScale(1)} disabled={fontScale >= fontSteps[fontSteps.length - 1]} aria-label="Aumentar tamanho da fonte">
                    A+
                  </button>
                </div>
              </div>
              <label className="checkbox">
                <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)}/>
                Ativar alto contraste
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)}/>
                Reduzir animacoes
              </label>
            </fieldset>
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar preferencias'}
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
