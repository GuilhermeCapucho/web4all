import { useEffect } from 'react'

type VoiceCommandDetail = {
  transcript?: string
}

export const useVoiceCommandListener = (onCommand: (transcript: string) => void) => {
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<VoiceCommandDetail>
      const transcript = customEvent.detail?.transcript
      if (!transcript) return
      onCommand(transcript)
    }

    window.addEventListener('voice-command', handler)
    return () => window.removeEventListener('voice-command', handler)
  }, [onCommand])
}
