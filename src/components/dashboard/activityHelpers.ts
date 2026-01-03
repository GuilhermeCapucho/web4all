import type { Activity } from '../../types'

export const statusLabels: Record<Activity['status'], string> = {
  todo: 'A fazer',
  doing: 'Em andamento',
  paused: 'Pausada',
  done: 'Concluída',
}

export const recurrenceLabels: Record<NonNullable<Activity['recurrence']>, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
}

export const toDateString = (date: Date) => date.toISOString().slice(0, 10)

export const getStreak = (items: Activity[]) => {
  const days = new Set(
    items
      .map((activity) => activity.completed_at)
      .filter(Boolean)
      .map((value) => value?.slice(0, 10)),
  )

  if (days.size === 0) {
    return 0
  }

  let streak = 0
  let current = new Date()
  while (days.has(toDateString(current))) {
    streak += 1
    current = new Date(current.getTime() - 24 * 60 * 60 * 1000)
  }
  return streak
}

export const formatDate = (value: string | null) => {
  if (!value) return 'Sem data'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('pt-BR')
}

export const formatTime = (value: string | null) => {
  if (!value) return 'Sem horário'
  return value.slice(0, 5)
}
