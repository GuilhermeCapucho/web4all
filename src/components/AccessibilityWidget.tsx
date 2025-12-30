import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { buildAccessibilityVoiceCommands } from '../voice/accessibilityVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand } from '../voice/voiceCommands'
import { useVoiceCommandListener } from '../voice/useVoiceCommandListener'

const fontSteps = [100, 110, 120, 130]

export const AccessibilityWidget = () => {
  const { user, profile, updateProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const fontScale = profile?.font_scale ?? 100
  const highContrast = profile?.high_contrast ?? false
  const reduceMotion = profile?.reduce_motion ?? false

  const fontLabel = useMemo(() => {
    const scaleLabel = fontScale === 100 ? 'Normal' : fontScale === 110 ? 'Grande' : fontScale === 120 ? 'Muito grande' : 'Extra grande'
    return `${scaleLabel} (${fontScale}%)`
  }, [fontScale])

  const adjustFontScale = useCallback(async (direction: -1 | 1) => {
    const index = Math.max(fontSteps.indexOf(fontScale), 0)
    const nextScale = fontSteps[Math.min(Math.max(index + direction, 0), fontSteps.length - 1)]
    if (nextScale === fontScale) return
    await updateProfile({ font_scale: nextScale })
  }, [fontScale, updateProfile])

  const toggleHighContrast = useCallback(async () => {
    await updateProfile({ high_contrast: !highContrast })
  }, [highContrast, updateProfile])

  const toggleReduceMotion = useCallback(async () => {
    await updateProfile({ reduce_motion: !reduceMotion })
  }, [reduceMotion, updateProfile])

  const voiceCommands = useMemo<VoiceCommand[]>(() => {
    return buildAccessibilityVoiceCommands({
      updateProfile,
      profile,
    })
  }, [profile, updateProfile])

  const handleVoiceCommand = useCallback(async (transcript: string) => {
    if (!user) return
    const normalized = normalizeVoiceText(transcript)
    if (!normalized) return
    await runVoiceCommands(voiceCommands, { transcript, normalized })
  }, [user, voiceCommands])

  useVoiceCommandListener(handleVoiceCommand)

  if (!user) return null

  return (
    <div className={`accessibility-widget${isOpen ? ' is-open' : ''}`}>
      <button type="button" className="accessibility-toggle" onClick={() => setIsOpen((current) => !current)} aria-label={isOpen ? 'Fechar acessibilidade' : 'Abrir acessibilidade'} aria-expanded={isOpen} aria-controls="accessibility-panel">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1em" height="1em" aria-hidden="true" focusable="false">
          <title>Acessibilidade</title>
          <path
            fill="currentColor"
            d="M50 8.1c23.2 0 41.9 18.8 41.9 41.9 0 23.2-18.8 41.9-41.9 41.9C26.8 91.9 8.1 73.2 8.1 50S26.8 8.1 50 8.1M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 11.3c-21.4 0-38.7 17.3-38.7 38.7S28.6 88.7 50 88.7 88.7 71.4 88.7 50 71.4 11.3 50 11.3zm0 8.9c4 0 7.3 3.2 7.3 7.3S54 34.7 50 34.7s-7.3-3.2-7.3-7.3 3.3-7.2 7.3-7.2zm23.7 19.7c-5.8 1.4-11.2 2.6-16.6 3.2.2 20.4 2.5 24.8 5 31.4.7 1.9-.2 4-2.1 4.7-1.9.7-4-.2-4.7-2.1-1.8-4.5-3.4-8.2-4.5-15.8h-2c-1 7.6-2.7 11.3-4.5 15.8-.7 1.9-2.8 2.8-4.7 2.1-1.9-.7-2.8-2.8-2.1-4.7 2.6-6.6 4.9-11 5-31.4-5.4-.6-10.8-1.8-16.6-3.2-1.7-.4-2.8-2.1-2.4-3.9.4-1.7 2.1-2.8 3.9-2.4 19.5 4.6 25.1 4.6 44.5 0 1.7-.4 3.5.7 3.9 2.4.7 1.8-.3 3.5-2.1 3.9z"
          />
        </svg>
      </button>
      <div id="accessibility-panel" className="accessibility-panel" role="dialog" aria-label="Preferencias de acessibilidade" aria-hidden={!isOpen}>
        <h3>Acessibilidade</h3>
        <div className="accessibility-section">
          <span className="accessibility-label" id="font-scale-floating-label">Tamanho da fonte</span>
          <span className="font-value" aria-live="polite" aria-atomic="true">
            {fontLabel}
          </span>
          <div className="font-buttons font-buttons--stacked" role="group" aria-labelledby="font-scale-floating-label">
            <button type="button" className="ghost" onClick={() => adjustFontScale(-1)} disabled={fontScale <= fontSteps[0]} aria-label="Diminuir tamanho da fonte">
              A-
            </button>
            <button type="button" className="ghost" onClick={() => adjustFontScale(1)} disabled={fontScale >= fontSteps[fontSteps.length - 1]} aria-label="Aumentar tamanho da fonte">
              A+
            </button>
          </div>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
          Alto contraste
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={reduceMotion} onChange={toggleReduceMotion} />
          Reduzir animacoes
        </label>
      </div>
    </div>
  )
}
