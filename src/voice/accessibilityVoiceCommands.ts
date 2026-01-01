import type { Profile } from '../types'
import type { VoiceCommand, VoiceNotifyTone } from './voiceCommands'

type AccessibilityVoiceDeps = {
  updateProfile: (updates: Partial<Profile>) => Promise<string | null>
  profile: Profile | null
  notify?: (message: string, tone?: VoiceNotifyTone) => void
}

const fontSteps = [100, 110, 120, 130]

const matchesHighContrastOn = (normalized: string) =>
  normalized.includes('contraste alto') ||
  normalized.includes('ativar modo leitura')

const matchesHighContrastOff = (normalized: string) =>
  normalized.includes('contraste baixo') ||
  normalized.includes('desativar alto contraste') ||
  normalized.includes('desligar alto contraste') ||
  normalized.includes('tirar alto contraste') ||
  normalized.includes('tirar modo leitura') ||
  normalized.includes('desligar leitura') ||
  normalized.includes('desligar modo ler')

const matchesReduceMotionOn = (normalized: string) =>
  normalized.includes('reduzir animacoes') ||
  normalized.includes('reduzir animacao') ||
  normalized.includes('tirar animacoes') ||
  normalized.includes('tirar animacao') ||
  normalized.includes('diminuir animacoes') ||
  normalized.includes('diminuir animacao') ||
  normalized.includes('desligar animacoes') ||
  normalized.includes('desligar animacao') ||
  normalized.includes('sem animacoes') ||
  normalized.includes('sem animacao')

const matchesReduceMotionOff = (normalized: string) =>
  normalized.includes('ligar animacoes') ||
  normalized.includes('ligar animacao') ||
  normalized.includes('ativar animacoes') ||
  normalized.includes('ativar animacao') ||
  normalized.includes('restaurar animacoes') ||
  normalized.includes('restaurar animacao') ||
  normalized.includes('voltar animacoes') ||
  normalized.includes('voltar animacao')

const matchesFontSizeUp = (normalized: string) =>
  normalized.includes('aumentar o tamanho da fonte') ||
  normalized.includes('aumentar tamanho da fonte') ||
  normalized.includes('aumentar fonte')

const matchesFontSizeDown = (normalized: string) =>
  normalized.includes('diminuir o tamanho da fonte') ||
  normalized.includes('diminuir tamanho da fonte') ||
  normalized.includes('diminuir fonte')

const matchesScreenReaderOn = (normalized: string) =>
  normalized.includes('habilitar leitor de tela')

const matchesScreenReaderOff = (normalized: string) =>
  normalized.includes('desligar leitor de tela')

export const isAccessibilityVoiceCommand = (normalized: string) =>
  matchesHighContrastOn(normalized) ||
  matchesHighContrastOff(normalized) ||
  matchesReduceMotionOn(normalized) ||
  matchesReduceMotionOff(normalized) ||
  matchesFontSizeUp(normalized) ||
  matchesFontSizeDown(normalized) ||
  matchesScreenReaderOn(normalized) ||
  matchesScreenReaderOff(normalized)

export const buildAccessibilityVoiceCommands = ({
  updateProfile,
  profile,
  notify,
}: AccessibilityVoiceDeps): VoiceCommand[] => [
  {
    id: 'high-contrast',
    match: matchesHighContrastOn,
    run: async () => {
      const error = await updateProfile({ high_contrast: true })
      notify?.(error ?? 'Alto contraste ativado.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'high-contrast-off',
    match: matchesHighContrastOff,
    run: async () => {
      const error = await updateProfile({ high_contrast: false })
      notify?.(error ?? 'Alto contraste desativado.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'reduce-motion',
    match: matchesReduceMotionOn,
    run: async () => {
      const error = await updateProfile({ reduce_motion: true })
      notify?.(error ?? 'Animacoes reduzidas.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'reduce-motion-off',
    match: matchesReduceMotionOff,
    run: async () => {
      const error = await updateProfile({ reduce_motion: false })
      notify?.(error ?? 'Animacoes restauradas.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'font-size-up',
    match: matchesFontSizeUp,
    run: async () => {
      const current = profile?.font_scale ?? 100
      const index = Math.max(fontSteps.indexOf(current), 0)
      const nextScale = fontSteps[Math.min(index + 1, fontSteps.length - 1)]
      const error = await updateProfile({ font_scale: nextScale })
      notify?.(error ?? `Fonte ajustada para ${nextScale}%.`, error ? 'warning' : 'success')
    },
  },
  {
    id: 'font-size-down',
    match: matchesFontSizeDown,
    run: async () => {
      const current = profile?.font_scale ?? 100
      const index = Math.max(fontSteps.indexOf(current), 0)
      const nextScale = fontSteps[Math.max(index - 1, 0)]
      const error = await updateProfile({ font_scale: nextScale })
      notify?.(error ?? `Fonte ajustada para ${nextScale}%.`, error ? 'warning' : 'success')
    },
  },
  {
    id: 'screen-reader-on',
    match: matchesScreenReaderOn,
    run: async () => {
      const error = await updateProfile({ screen_reader_enabled: true })
      notify?.(error ?? 'Leitor de tela ativado.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'screen-reader-off',
    match: matchesScreenReaderOff,
    run: async () => {
      const error = await updateProfile({ screen_reader_enabled: false })
      notify?.(error ?? 'Leitor de tela desativado.', error ? 'warning' : 'success')
    },
  },
]
