import type { NavigateFunction } from 'react-router-dom'
import type { Activity } from '../types'
import type { VoiceCommand, VoiceNotifyTone } from './voiceCommands'

type CommonVoiceCommandDeps = {
  navigate: NavigateFunction
  signOut: () => Promise<string | null>
  activityVoice?: {
    findActivityByTitle: (query: string) => Activity | null
    onStatusChange: (activity: Activity, status: Activity['status']) => Promise<void>
  }
  notify?: (message: string, tone?: VoiceNotifyTone) => void
}

export const buildCommonVoiceCommands = ({
  navigate,
  signOut,
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
]
