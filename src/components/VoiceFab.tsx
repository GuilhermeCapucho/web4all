import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: SpeechRecognitionResultLike[]
}

type SpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognition

export const VoiceFab = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: { transcript } }))
    },
    [],
  )

  useEffect(() => {
    const constructor = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    if (!constructor) return

    const recognition = new constructor()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => {
      setListening(true)
    }
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex]
      if (!result?.isFinal) return
      const transcript = result[0]?.transcript ?? ''
      if (!transcript) return
      handleVoiceCommand(transcript)
    }
    recognition.onerror = () => {
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [handleVoiceCommand])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return
    }
    if (listening) {
      recognitionRef.current.stop()
      return
    }
    try {
      const context = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.value = 0.06
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      window.setTimeout(() => {
        oscillator.stop()
        oscillator.disconnect()
        gain.disconnect()
        context.close()
      }, 120)
    } catch {
      // Ignore audio failures; voice recognition can still run.
    }
    try {
      recognitionRef.current.start()
    } catch {
      setListening(false)
    }
  }

  const allowedPaths = new Set(['/app', '/profile', '/students'])

  useEffect(() => {
    if (!user || !allowedPaths.has(location.pathname)) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'o') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      event.preventDefault()
      toggleListening()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname, toggleListening, user])

  if (!user || !allowedPaths.has(location.pathname)) return null

  return (
    <button
      type="button"
      className={`voice-fab${listening ? ' is-listening' : ''}`}
      onClick={toggleListening}
      aria-label={listening ? 'Parar de ouvir' : 'Ouvir comandos de voz'}
      aria-pressed={listening}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 0-2 0 3 3 0 1 1-6 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.1a5 5 0 0 0 4-4.9z"
        />
      </svg>
    </button>
  )
}
