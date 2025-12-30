import type { NavigateFunction } from 'react-router-dom'
import type { Activity, Profile } from '../types'
import type { VoiceCommand, VoiceNotifyTone } from './voiceCommands'

type CommonVoiceCommandDeps = {
  navigate: NavigateFunction
  signOut: () => Promise<string | null>
  updateProfile: (updates: Partial<Profile>) => Promise<string | null>
  profile: Profile | null
  activityVoice?: {
    findActivityByTitle: (query: string) => Activity | null
    onStatusChange: (activity: Activity, status: Activity['status']) => Promise<void>
  }
  notify?: (message: string, tone?: VoiceNotifyTone) => void
}

export const buildCommonVoiceCommands = ({
  navigate,
  signOut,
  updateProfile,
  profile,
  activityVoice,
  notify,
}: CommonVoiceCommandDeps): VoiceCommand[] => [
  {
    id: 'open-profile',
    match: (normalized: string) => 
      normalized.includes('perfil') ||
      normalized.includes('conta') ||
      normalized.includes('meu perfil') ||
      normalized.includes('minha conta') ||
      normalized.includes('abrir perfil'),
    run: () => {
      notify?.('Abrindo perfil.', 'info')
      navigate('/profile')
    },
  },
  {
    id: 'open-activities',
    match: (normalized: string) => {
      if (normalized.startsWith('reabrir ')) return false
      return (
        normalized.includes('abrir atividades') ||
        normalized.includes('abrir atividade') ||
        normalized.includes('abrir tarefas') ||
        normalized.includes('abrir tarefa') ||
        normalized.includes('ver atividades') ||
        normalized.includes('ver atividade') ||
        normalized.includes('ver tarefas') ||
        normalized.includes('ver tarefa') ||
        normalized.includes('ir para atividades') ||
        normalized.includes('ir para atividade') ||
        normalized.includes('ir para tarefas') ||
        normalized.includes('ir para tarefa')
      )
    },

    run: () => {
      notify?.('Abrindo atividades.', 'info')
      navigate('/app')
    },
  },
  {
    id: 'open-students',
    match: (normalized: string) =>
      normalized.includes('abrir alunos') ||
      normalized.includes('abrir aluno') ||
      normalized.includes('ver alunos') ||
      normalized.includes('ver aluno') ||
      normalized.includes('ir para alunos') ||
      normalized.includes('ir para aluno'),
    run: () => {
      notify?.('Abrindo alunos.', 'info')
      navigate('/students')
    },
  },
  {
    id: 'logout',
    match: (normalized: string) =>
      normalized === 'sair' || 
      normalized.includes('fazer logout') || 
      normalized.includes('sair da conta'),
    run: async () => {
      await signOut()
      navigate('/login', { replace: true })
    },
  },
  {
    id: 'high-contrast',
    match: (normalized: string) =>
      normalized.includes('ligar modo leitura') ||
      normalized.includes('ligar leitura') ||
      normalized.includes('ligar ler') ||
      normalized.includes('ligar modo ler') ||
      normalized.includes('ativar modo ler') ||
      normalized.includes('ativar modo leitura'),
    run: async () => {
      const error = await updateProfile({ high_contrast: true })
      notify?.(error ?? 'Alto contraste ativado.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'high-contrast-off',
    match: (normalized: string) =>
      normalized.includes('tirar modo leitura') ||
      normalized.includes('tirar modo ler') ||
      normalized.includes('tirar ler') ||
      normalized.includes('desativar leitura') ||
      normalized.includes('desativar ler') ||
      normalized.includes('desativar modo ler') ||
      normalized.includes('desligar leitura') ||
      normalized.includes('desligar ler') ||
      normalized.includes('desligar modo ler'),
    run: async () => {
      const error = await updateProfile({ high_contrast: false })
      notify?.(error ?? 'Alto contraste desativado.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'reduce-motion',
    match: (normalized: string) => 
      normalized.includes('reduzir animacoes') ||
      normalized.includes('reduzir animacao') ||
      normalized.includes('tirar animacoes') ||
      normalized.includes('tirar animacao') ||
      normalized.includes('diminuir animacoes') ||
      normalized.includes('diminuir animacao') ||
      normalized.includes('desligar animacoes') ||
      normalized.includes('desligar animacao') ||
      normalized.includes('sem animacoes') ||
      normalized.includes('sem animacao'),
    run: async () => {
      const error = await updateProfile({ reduce_motion: true })
      notify?.(error ?? 'Animacoes reduzidas.', error ? 'warning' : 'success')
    },
  },
  {
    id: 'reduce-motion-off',
    match: (normalized: string) =>
      normalized.includes('ligar animacoes') ||
      normalized.includes('ligar animacao') ||
      normalized.includes('ativar animacoes') ||
      normalized.includes('ativar animacao') ||
      normalized.includes('restaurar animacoes') ||
      normalized.includes('restaurar animacao') ||
      normalized.includes('voltar animacoes') ||
      normalized.includes('voltar animacao'),
    run: async () => {
      const error = await updateProfile({ reduce_motion: false })
      notify?.(error ?? 'Animacoes restauradas.', error ? 'warning' : 'success')
    },
  },
  ...(activityVoice
    ? [
        {
          id: 'ask-help-task',
          match: (normalized: string) =>
            normalized.includes('pedir ajuda na tarefa') ||
            normalized.includes('pedir ajuda na atividade') ||
            normalized.includes('preciso de ajuda na tarefa') ||
            normalized.includes('preciso de ajuda na atividade'),
          run: async ({ normalized }: { normalized: string }) => {
            const title = normalized
              .replace('pedir ajuda na tarefa', '')
              .replace('pedir ajuda na atividade', '')
              .replace('preciso de ajuda na tarefa', '')
              .replace('preciso de ajuda na atividade', '')
              .trim()
            if (!title) {
              notify?.('Diga o nome da tarefa.', 'warning')
              return
            }
            const activity = activityVoice.findActivityByTitle(title)
            if (!activity) return
            await activityVoice.onStatusChange(activity, 'paused')
          },
        },
        {
          id: 'complete-task',
          match: (normalized: string) =>
            normalized.includes('concluir a tarefa') ||
            normalized.includes('concluir tarefa') ||
            normalized.includes('concluir a atividade') ||
            normalized.includes('concluir atividade'),
          run: async ({ normalized }: { normalized: string }) => {
            const title = normalized
              .replace('concluir a tarefa', '')
              .replace('concluir tarefa', '')
              .replace('concluir a atividade', '')
              .replace('concluir atividade', '')
              .trim()
            if (!title) {
              notify?.('Diga o nome da tarefa.', 'warning')
              return
            }
            const activity = activityVoice.findActivityByTitle(title)
            if (!activity) return
            await activityVoice.onStatusChange(activity, 'done')
          },
        },
      ]
    : []),
  {
    id: 'font-size-up',
    match: (normalized: string) =>
      normalized.includes('aumentar o tamanho da fonte') || normalized.includes('aumentar tamanho da fonte'),
    run: async () => {
      const steps = [100, 110, 120, 130]
      const current = profile?.font_scale ?? 100
      const index = Math.max(steps.indexOf(current), 0)
      const nextScale = steps[Math.min(index + 1, steps.length - 1)]
      const error = await updateProfile({ font_scale: nextScale })
      notify?.(error ?? `Fonte ajustada para ${nextScale}%.`, error ? 'warning' : 'success')
    },
  },
  {
    id: 'font-size-down',
    match: (normalized: string) =>
      normalized.includes('diminuir o tamanho da fonte') || normalized.includes('diminuir tamanho da fonte'),
    run: async () => {
      const steps = [100, 110, 120, 130]
      const current = profile?.font_scale ?? 100
      const index = Math.max(steps.indexOf(current), 0)
      const nextScale = steps[Math.max(index - 1, 0)]
      const error = await updateProfile({ font_scale: nextScale })
      notify?.(error ?? `Fonte ajustada para ${nextScale}%.`, error ? 'warning' : 'success')
    },
  },
]
