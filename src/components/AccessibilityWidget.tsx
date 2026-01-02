import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ToastStack } from './dashboard/ToastStack'
import { buildAccessibilityVoiceCommands } from '../voice/accessibilityVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand } from '../voice/voiceCommands'
import { useVoiceCommandListener } from '../voice/useVoiceCommandListener'
import { ScreenReader } from './ScreenReader'
import { ContentMagnifier } from './ContentMagnifier'
import { LinkHighlightToggle } from './LinkHighlightToggle'
import { LetterSpacingControl } from './LetterSpacingControl'

const fontSteps = [100, 110, 120, 130]
type ToastTone = 'info' | 'success' | 'warning'
type Toast = {
  id: string
  message: string
  tone: ToastTone
}

export const AccessibilityWidget = () => {
  const { user, profile, updateProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false)
  const lastAnnouncedScreenReaderState = useRef<boolean | null>(null)
  const hasToggledScreenReader = useRef(false)

  const fontScale = profile?.font_scale ?? 100
  const highContrast = profile?.high_contrast ?? false
  const reduceMotion = profile?.reduce_motion ?? false
  const persistedScreenReaderEnabled = profile?.screen_reader_enabled ?? false
  const colorBlindness = profile?.color_blindness ?? 'none'
  const isContentMagnifierEnabled = profile?.content_magnifier_enabled ?? false
  const isLinkHighlightEnabled = profile?.link_highlight_enabled ?? false

  const fontLabel = useMemo(() => {
    const scaleLabel = fontScale === 100 ? 'Normal' : fontScale === 110 ? 'Grande' : fontScale === 120 ? 'Muito grande' : 'Extra grande'
    return `${scaleLabel} (${fontScale}%)`
  }, [fontScale])

  const voiceCommandSections = useMemo(
    () => [
      {
        title: 'Navegacão',
        commands: ['"Abrir atividades"', '"Abrir alunos"', '"Abrir perfil"'],
      },
      {
        title: 'Atividades',
        commands: [
          '"Concluir atividade {nome}"',
          '"Concluir subtarefa {nome}"',
          '"Pedir ajuda na atividade {nome}"',
          '"Retomar atividade {nome}"',
          '"Filtrar por hoje"',
          '"Filtrar por lista"',
          '"Filtrar por semana"',
        ],
      },
      {
        title: 'Conta',
        commands: ['"Sair"', '"Fazer logout"'],
      },
      {
        title: 'Acessibilidade',
        commands: [
          '"Aumentar fonte"',
          '"Diminuir fonte"',
          '"Contraste Alto"',
          '"Contraste Baixo"',
          '"Reduzir animações"',
          '"Ligar animações"',
          '"Habilitar leitor de tela"',
          '"Desligar leitor de tela"',
          '"Ligar lupa"',
          '"Desabilitar lupa"',
          '"Destacar links"',
          '"Desabilitar links"',
          '"Aumentar espaço entre letras"',
          '"Diminuir espaço entre letras"',
        ],
      },
    ],
    [],
  )

  const adjustFontScale = useCallback(async (direction: -1 | 1) => {
    const index = Math.max(fontSteps.indexOf(fontScale), 0)
    const nextScale = fontSteps[Math.min(Math.max(index + direction, 0), fontSteps.length - 1)]
    if (nextScale === fontScale) return
    await updateProfile({ font_scale: nextScale })
  }, [fontScale, updateProfile])

  const updateLetterSpacing = useCallback(async (value: number) => {
    await updateProfile({ letter_spacing: value })
  }, [updateProfile])

  const toggleHighContrast = useCallback(async () => {
    await updateProfile({ high_contrast: !highContrast })
  }, [highContrast, updateProfile])

  const toggleReduceMotion = useCallback(async () => {
    await updateProfile({ reduce_motion: !reduceMotion })
  }, [reduceMotion, updateProfile])

  const updateColorBlindness = useCallback(
    async (value: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia') => {
      await updateProfile({ color_blindness: value })
    },
    [updateProfile],
  )

  const toggleContentMagnifier = useCallback(async () => {
    await updateProfile({ content_magnifier_enabled: !isContentMagnifierEnabled })
  }, [isContentMagnifierEnabled, updateProfile])

  const toggleLinkHighlight = useCallback(async () => {
    await updateProfile({ link_highlight_enabled: !isLinkHighlightEnabled })
  }, [isLinkHighlightEnabled, updateProfile])

  const addToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}`
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const toggleScreenReader = useCallback(async () => {
    const isSupported = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
    if (!isScreenReaderEnabled && !isSupported) {
      addToast('Leitor de tela nao suportado neste navegador.', 'warning')
      return
    }
    hasToggledScreenReader.current = true
    const next = !isScreenReaderEnabled
    setIsScreenReaderEnabled(next)
    await updateProfile({ screen_reader_enabled: next })
  }, [addToast, isScreenReaderEnabled, updateProfile])

  useEffect(() => {
    if (!hasToggledScreenReader.current) return
    if (lastAnnouncedScreenReaderState.current === isScreenReaderEnabled) return
    lastAnnouncedScreenReaderState.current = isScreenReaderEnabled
    addToast(isScreenReaderEnabled ? 'Leitor de tela ativado.' : 'Leitor de tela desativado.')
  }, [addToast, isScreenReaderEnabled])

  useEffect(() => {
    setIsScreenReaderEnabled(persistedScreenReaderEnabled)
  }, [persistedScreenReaderEnabled])

  const voiceCommands = useMemo<VoiceCommand[]>(() => {
    return buildAccessibilityVoiceCommands({
      updateProfile,
      profile,
      notify: addToast,
    })
  }, [addToast, profile, updateProfile])

  const handleVoiceCommand = useCallback(async (transcript: string) => {
    if (!user) return
    const normalized = normalizeVoiceText(transcript)
    if (!normalized) return
    await runVoiceCommands(voiceCommands, { transcript, normalized })
  }, [user, voiceCommands])

  useVoiceCommandListener(handleVoiceCommand)

  if (!user) return null

  return (
    <>
      <div className={`accessibility-widget${isOpen ? ' is-open' : ''}`} data-lupa-ignore="true">
        <div className="accessibility-actions">
          <button type="button" className="accessibility-toggle" onClick={() => setIsOpen((current) => !current)} aria-label={isOpen ? 'Fechar acessibilidade' : 'Abrir acessibilidade'} aria-expanded={isOpen} aria-controls="accessibility-panel">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1em" height="1em" aria-hidden="true" focusable="false">
              <title>Acessibilidade</title>
              <path
                fill="currentColor"
                d="M50 8.1c23.2 0 41.9 18.8 41.9 41.9 0 23.2-18.8 41.9-41.9 41.9C26.8 91.9 8.1 73.2 8.1 50S26.8 8.1 50 8.1M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 11.3c-21.4 0-38.7 17.3-38.7 38.7S28.6 88.7 50 88.7 88.7 71.4 88.7 50 71.4 11.3 50 11.3zm0 8.9c4 0 7.3 3.2 7.3 7.3S54 34.7 50 34.7s-7.3-3.2-7.3-7.3 3.3-7.2 7.3-7.2zm23.7 19.7c-5.8 1.4-11.2 2.6-16.6 3.2.2 20.4 2.5 24.8 5 31.4.7 1.9-.2 4-2.1 4.7-1.9.7-4-.2-4.7-2.1-1.8-4.5-3.4-8.2-4.5-15.8h-2c-1 7.6-2.7 11.3-4.5 15.8-.7 1.9-2.8 2.8-4.7 2.1-1.9-.7-2.8-2.8-2.1-4.7 2.6-6.6 4.9-11 5-31.4-5.4-.6-10.8-1.8-16.6-3.2-1.7-.4-2.8-2.1-2.4-3.9.4-1.7 2.1-2.8 3.9-2.4 19.5 4.6 25.1 4.6 44.5 0 1.7-.4 3.5.7 3.9 2.4.7 1.8-.3 3.5-2.1 3.9z"
              />
            </svg>
          </button>
          <button type="button" className="accessibility-toggle" onClick={() => setIsVoiceHelpOpen((current) => !current)} aria-label="Abrir comandos de voz">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
              <title>Comandos de voz</title>
              <path
                fill="currentColor"
                d="M4 3h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 4h10a1 1 0 1 0 0-2H7a1 1 0 0 0 0 2zm0 4h8a1 1 0 1 0 0-2H7a1 1 0 0 0 0 2z"
              />
            </svg>
          </button>
      </div>
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
        <LetterSpacingControl value={profile?.letter_spacing ?? 0} onChange={updateLetterSpacing} />
        <label className="checkbox">
          <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
          Alto contraste
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={reduceMotion} onChange={toggleReduceMotion} />
          Reduzir animações
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={isScreenReaderEnabled} onChange={toggleScreenReader} />
          Leitor de tela
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={isContentMagnifierEnabled} onChange={toggleContentMagnifier} />
          Lupa de Conteudo
        </label>
        <LinkHighlightToggle enabled={isLinkHighlightEnabled} onToggle={toggleLinkHighlight} />
        <div className="accessibility-section">
          <label className="accessibility-label" htmlFor="color-blindness-select">
            Daltonismo
          </label>
          <select
            id="color-blindness-select"
            value={colorBlindness}
            onChange={(event) => updateColorBlindness(event.target.value as typeof colorBlindness)}
          >
            <option value="none">Desativado</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="protanopia">Protanopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </div>
      </div>
      </div>
      {isVoiceHelpOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Comandos de voz" onClick={() => setIsVoiceHelpOpen(false)} data-lupa-ignore="true">
          <div className="modal-card modal-card--wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Comandos de voz</h2>
              <p className="muted">Fale uma frase parecida para executar a ação.</p>
            </div>
            <div className="voice-commands">
              {voiceCommandSections.map((section) => (
                <div
                  key={section.title}
                  className={`voice-command-section${section.title === 'Acessibilidade' ? ' voice-command-section--break' : ''}`}
                >
                  <h3>{section.title}</h3>
                  <ul className="voice-command-list">
                    {section.commands.map((command) => (
                      <li key={command}>{command}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setIsVoiceHelpOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ContentMagnifier enabled={isContentMagnifierEnabled} />
      <ScreenReader enabled={isScreenReaderEnabled} />
      <ToastStack toasts={toasts} />
    </>
  )
}
