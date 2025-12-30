import { useCallback, useMemo } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Activity, ChecklistItem } from '../types'
import { isAccessibilityVoiceCommand } from './accessibilityVoiceCommands'
import { buildCommonVoiceCommands } from './commonVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand, type VoiceNotifyTone } from './voiceCommands'

type DashboardVoiceDeps = {
  navigate: NavigateFunction
  signOut: () => Promise<string | null>
  activities: Activity[]
  visibleActivities: Activity[]
  checklists: Record<string, ChecklistItem[]>
  isTeacher: boolean
  addToast: (message: string, tone?: VoiceNotifyTone) => void
  setView: (view: 'list' | 'today' | 'week') => void
  handleQuickStatus: (activity: Activity, status: Activity['status']) => Promise<void>
  requestDelete: (activity: Activity) => void
  addChecklistItemByTitle: (activityId: string, title: string) => Promise<void>
  setChecklistItemDone: (activityId: string, item: ChecklistItem, isDone: boolean) => Promise<void>
}

export const useDashboardVoiceCommands = ({
  navigate,
  signOut,
  activities,
  visibleActivities,
  checklists,
  isTeacher,
  addToast,
  setView,
  handleQuickStatus,
  requestDelete,
  addChecklistItemByTitle,
  setChecklistItemDone,
}: DashboardVoiceDeps) => {
  const normalizeText = useCallback((value: string) => normalizeVoiceText(value), [])

  const findActivityByTitle = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeText(query)
      if (!normalizedQuery) return null
      const matches = activities.filter((activity) => normalizeText(activity.title).includes(normalizedQuery))
      if (matches.length === 1) return matches[0]
      if (matches.length > 1) {
        addToast('Encontrei mais de uma atividade com esse nome.', 'warning')
      } else {
        addToast('Nao encontrei essa atividade.', 'warning')
      }
      return null
    },
    [activities, addToast, normalizeText],
  )

  const resolveActivityForSubtask = useCallback(
    (query?: string) => {
      if (query) {
        return findActivityByTitle(query)
      }
      if (visibleActivities.length === 1) {
        return visibleActivities[0]
      }
      addToast('Diga o nome da atividade para a subtarefa.', 'warning')
      return null
    },
    [addToast, findActivityByTitle, visibleActivities],
  )

  const findChecklistItem = useCallback(
    (query: string, activityId?: string) => {
      const normalizedQuery = normalizeText(query)
      if (!normalizedQuery) return null
      const entries = Object.entries(checklists).flatMap(([id, items]) =>
        (items ?? []).map((item) => ({ item, activityId: id })),
      )
      const filtered = activityId ? entries.filter((entry) => entry.activityId === activityId) : entries
      const matches = filtered.filter((entry) => normalizeText(entry.item.title).includes(normalizedQuery))
      if (matches.length === 1) return matches[0]
      if (matches.length > 1) {
        addToast('Encontrei mais de uma subtarefa com esse nome.', 'warning')
      } else {
        addToast('Nao encontrei essa subtarefa.', 'warning')
      }
      return null
    },
    [addToast, checklists, normalizeText],
  )

  const voiceCommands = useMemo<VoiceCommand[]>(() => {
    const commonCommands = buildCommonVoiceCommands({
      navigate,
      signOut,
      activityVoice: {
        findActivityByTitle,
        onStatusChange: handleQuickStatus,
      },
      notify: addToast,
    })

    return [
      ...commonCommands,
      {
        id: 'filter-today',
        match: (normalized) => normalized.includes('filtrar por hoje') || normalized.includes('ver hoje'),
        run: () => {
          setView('today')
          addToast('Filtro: hoje.', 'info')
        },
      },
      {
        id: 'filter-list',
        match: (normalized) => normalized.includes('filtrar por lista') || normalized.includes('ver lista'),
        run: () => {
          setView('list')
          addToast('Filtro: lista.', 'info')
        },
      },
      {
        id: 'filter-week',
        match: (normalized) => normalized.includes('filtrar por semana') || normalized.includes('ver semana'),
        run: () => {
          setView('week')
          addToast('Filtro: semana.', 'info')
        },
      },
      {
        id: 'reopen-activity',
        match: (normalized) =>
          normalized.startsWith('reabrir atividade') || normalized.startsWith('reabrir tarefa'),
        run: async ({ normalized }) => {
          if (!isTeacher) {
            addToast('Apenas professores podem reabrir atividades.', 'warning')
            return
          }
          const title = normalized.replace('reabrir atividade', '').replace('reabrir tarefa', '').trim()
          if (!title) {
            addToast('Diga o nome da atividade.', 'warning')
            return
          }
          const activity = findActivityByTitle(title)
          if (activity) {
            await handleQuickStatus(activity, 'todo')
          }
        },
      },
      {
        id: 'delete-activity',
        match: (normalized) =>
          normalized.startsWith('excluir atividade') ||
          normalized.startsWith('remover atividade') ||
          normalized.startsWith('remover tarefa') ||
          normalized.startsWith('excluir tarefa'),
        run: async ({ normalized }) => {
          if (!isTeacher) {
            addToast('Apenas professores podem excluir atividades.', 'warning')
            return
          }
          const title = normalized
            .replace('excluir atividade', '')
            .replace('excluir tarefa', '')
            .replace('remover atividade', '')
            .replace('remover tarefa', '')
            .trim()
          if (!title) {
            addToast('Diga o nome da atividade.', 'warning')
            return
          }
          const activity = findActivityByTitle(title)
          if (activity) {
            requestDelete(activity)
          }
        },
      },
      {
        id: 'resume-activity',
        match: (normalized) => normalized.startsWith('retomar atividade'),
        run: async ({ normalized }) => {
          const title = normalized.replace('retomar atividade', '').trim()
          if (!title) {
            addToast('Diga o nome da atividade.', 'warning')
            return
          }
          const activity = findActivityByTitle(title)
          if (activity) {
            await handleQuickStatus(activity, 'todo')
          }
        },
      },
      {
        id: 'add-subtask',
        match: (normalized) => 
          normalized.includes('criar subtarefa') ||
          normalized.startsWith('adicionar subtarefa'),
        run: async ({ normalized }) => {
          if (!isTeacher) {
            addToast('Apenas professores podem adicionar subtarefas.', 'warning')
            return
          }
          const match = normalized.match(/adicionar subtarefa(?: com o nome)? (.+?)(?: na atividade (.+))?$/)
          const subtaskTitle = match?.[1]?.trim() ?? ''
          const activityTitle = match?.[2]?.trim()
          if (!subtaskTitle) {
            addToast('Diga o nome da subtarefa.', 'warning')
            return
          }
          const activity = resolveActivityForSubtask(activityTitle)
          if (!activity) return
          await addChecklistItemByTitle(activity.id, subtaskTitle)
          addToast('Subtarefa adicionada.', 'success')
        },
      },
      {
        id: 'complete-subtask',
        match: (normalized) => normalized.startsWith('concluir subtarefa'),
        run: async ({ normalized }) => {
          const match = normalized.match(/concluir subtarefa (.+?)(?: na atividade (.+))?$/)
          const subtaskTitle = match?.[1]?.trim() ?? ''
          const activityTitle = match?.[2]?.trim()
          if (!subtaskTitle) {
            addToast('Diga o nome da subtarefa.', 'warning')
            return
          }
          const activity = activityTitle ? findActivityByTitle(activityTitle) : null
          const found = findChecklistItem(subtaskTitle, activity?.id)
          if (!found) return
          if (found.item.is_done) {
            addToast('Subtarefa ja estava concluida.', 'info')
            return
          }
          await setChecklistItemDone(found.activityId, found.item, true)
          addToast('Subtarefa concluida.', 'success')
        },
      },
    ]
  }, [
    addChecklistItemByTitle,
    addToast,
    findActivityByTitle,
    findChecklistItem,
    handleQuickStatus,
    isTeacher,
    navigate,
    resolveActivityForSubtask,
    requestDelete,
    setChecklistItemDone,
    setView,
    signOut,
  ])

  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      const normalized = normalizeVoiceText(transcript)
      if (!normalized) return
      const handled = await runVoiceCommands(voiceCommands, { transcript, normalized })
      if (!handled) {
        if (isAccessibilityVoiceCommand(normalized)) return
        addToast('Comando nao reconhecido.', 'warning')
      }
    },
    [addToast, voiceCommands],
  )

  return { handleVoiceCommand }
}
