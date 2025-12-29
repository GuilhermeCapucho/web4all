import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Activity, ChecklistItem } from '../types'
import { TopNav } from '../components/TopNav'
import { AgendaPanel } from '../components/dashboard/AgendaPanel'
import { ActivityModal, type ActivityFormState } from '../components/dashboard/ActivityModal'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { ToastStack } from '../components/dashboard/ToastStack'
import { formatTime, getStreak, toDateString } from '../components/dashboard/activityHelpers'

type Toast = {
  id: string
  message: string
  tone: 'info' | 'success' | 'warning'
}

const emptyForm: ActivityFormState = {
  title: '',
  description: '',
  status: 'todo',
  category: '',
  due_date: '',
  due_time: '',
  duration_minutes: '',
  recurrence: 'none',
}

export const Dashboard = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [form, setForm] = useState<ActivityFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'list' | 'today' | 'week'>('list')
  const [filters, setFilters] = useState({ search: '', status: 'all', category: 'all' })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>({})
  const notifiedRef = useRef<Set<string>>(new Set())
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const addToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}`
    setToasts((current) => [...current, { id, message, tone }])
    setLiveMessage(message)
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setSaving(false)
  }, [])

  const handleFormChange = useCallback((next: Partial<ActivityFormState>) => {
    setForm((current) => ({ ...current, ...next }))
  }, [])

  const handleChecklistDraftChange = useCallback((activityId: string, value: string) => {
    setChecklistDrafts((current) => ({
      ...current,
      [activityId]: value,
    }))
  }, [])

  const logHistory = useCallback(
    async (activityId: string, eventType: string, fromStatus?: Activity['status'], toStatus?: Activity['status']) => {
      if (!user) return
      await supabase.from('activity_history').insert({
        activity_id: activityId,
        user_id: user.id,
        event_type: eventType,
        from_status: fromStatus ?? null,
        to_status: toStatus ?? null,
      })
    },
    [user],
  )

  const sortedActivities = useMemo(
    () =>
      [...activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities],
  )

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      activities.map((activity) => activity.category).filter((value): value is string => Boolean(value)),
    )
    return Array.from(unique)
  }, [activities])

  const fetchActivities = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('activities')
      .select(
        'id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setStatus(error.message)
      setLoading(false)
      return
    }

    const activitiesData = data ?? []
    setActivities(activitiesData)

    if (activitiesData.length === 0) {
      setChecklists({})
      setLoading(false)
      return
    }

    const activityIds = activitiesData.map((activity) => activity.id)
    const { data: checklistData, error: checklistError } = await supabase
      .from('activity_checklist')
      .select('id, activity_id, title, is_done, created_at, completed_at')
      .in('activity_id', activityIds)
      .order('created_at', { ascending: true })

    if (checklistError) {
      setStatus(checklistError.message)
      setLoading(false)
      return
    }

    const grouped: Record<string, ChecklistItem[]> = {}
    ;(checklistData ?? []).forEach((item) => {
      if (!grouped[item.activity_id]) {
        grouped[item.activity_id] = []
      }
      grouped[item.activity_id].push(item)
    })
    setChecklists(grouped)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    if (!formOpen) {
      previousFocusRef.current?.focus()
      return
    }
    const focusTimer = window.setTimeout(() => {
      titleInputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(focusTimer)
  }, [formOpen])

  useEffect(() => {
    if (!formOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeForm()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeForm, formOpen])

  useEffect(() => {
    if (activities.length === 0) return
    const checkReminders = () => {
      const now = new Date()
      const soon = new Date(now.getTime() + 10 * 60 * 1000)
      activities.forEach((activity) => {
        if (activity.status === 'done') return
        if (!activity.due_date || !activity.due_time) return
        const due = new Date(`${activity.due_date}T${activity.due_time}`)
        if (due >= now && due <= soon && !notifiedRef.current.has(activity.id)) {
          addToast(`Lembrete: ${activity.title} as ${formatTime(activity.due_time)}`, 'warning')
          notifiedRef.current.add(activity.id)
        }
      })
    }

    checkReminders()
    const interval = window.setInterval(checkReminders, 60000)
    return () => window.clearInterval(interval)
  }, [activities, addToast])

  const openCreate = () => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (activity: Activity) => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    setFormMode('edit')
    setEditingId(activity.id)
    setForm({
      title: activity.title,
      description: activity.description ?? '',
      status: activity.status,
      category: activity.category ?? '',
      due_date: activity.due_date ?? '',
      due_time: activity.due_time ?? '',
      duration_minutes: activity.duration_minutes ? String(activity.duration_minutes) : '',
      recurrence: activity.recurrence ?? 'none',
    })
    setFormOpen(true)
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    setStatus(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      category: form.category.trim() || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      recurrence: form.recurrence === 'none' ? null : form.recurrence,
    }

    const now = new Date().toISOString()

    if (formMode === 'create') {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...payload,
          user_id: user.id,
          completed_at: form.status === 'done' ? now : null,
        })
        .select('id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at')
        .single()

      setSaving(false)

      if (error) {
        setStatus(error.message)
        return
      }

      setActivities((current) => [data, ...current])
      await logHistory(data.id, 'created')
      if (form.status === 'done') {
        await logHistory(data.id, 'status_changed', 'todo', 'done')
      }
      setForm(emptyForm)
      setFormOpen(false)
      addToast('Atividade criada com sucesso.', 'success')
      return
    }

    if (!editingId) {
      setSaving(false)
      return
    }

    const original = activities.find((activity) => activity.id === editingId)
    const fromStatus = original?.status
    const completedAt = payload.status === 'done' ? (fromStatus === 'done' ? original?.completed_at ?? now : now) : null
    const updates = { ...payload, completed_at: completedAt, reopened_at: null as string | null }

    if (fromStatus === 'done' && payload.status !== 'done') {
      updates.reopened_at = now
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', editingId)
      .eq('user_id', user.id)
      .select('id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at')
      .single()

    setSaving(false)

    if (error) {
      setStatus(error.message)
      return
    }

    setActivities((current) => current.map((activity) => (activity.id === editingId ? data : activity)))
    if (fromStatus && fromStatus !== payload.status) {
      await logHistory(editingId, 'status_changed', fromStatus, payload.status)
    }
    setFormOpen(false)
    addToast('Atividade atualizada.', 'success')
  }

  const handleDelete = async (activityId: string) => {
    if (!user) return
    setStatus(null)
    const { error } = await supabase.from('activities').delete().eq('id', activityId).eq('user_id', user.id)

    if (error) {
      setStatus(error.message)
      return
    }

    setActivities((current) => current.filter((activity) => activity.id !== activityId))
    setChecklists((current) => {
      const next = { ...current }
      delete next[activityId]
      return next
    })
    addToast('Atividade removida.', 'info')
  }

  const handleQuickStatus = async (activity: Activity, nextStatus: Activity['status']) => {
    if (!user) return
    const now = new Date().toISOString()
    const updates = {
      status: nextStatus,
      completed_at: nextStatus === 'done' ? now : null,
      reopened_at: activity.status === 'done' && nextStatus !== 'done' ? now : null,
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', activity.id)
      .eq('user_id', user.id)
      .select('id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at')
      .single()

    if (error) {
      setStatus(error.message)
      return
    }

    setActivities((current) => current.map((item) => (item.id === activity.id ? data : item)))
    await logHistory(activity.id, 'status_changed', activity.status, nextStatus)

    if (nextStatus === 'done') {
      addToast('Parabens, concluida!', 'success')
    } else {
      addToast('Atividade reaberta.', 'info')
    }
  }

  const handleAddChecklistItem = async (activityId: string) => {
    if (!user) return
    const title = (checklistDrafts[activityId] ?? '').trim()
    if (!title) return
    const { data, error } = await supabase
      .from('activity_checklist')
      .insert({ activity_id: activityId, title })
      .select('id, activity_id, title, is_done, created_at, completed_at')
      .single()

    if (error) {
      setStatus(error.message)
      return
    }

    setChecklists((current) => ({
      ...current,
      [activityId]: [...(current[activityId] ?? []), data],
    }))
    setChecklistDrafts((current) => ({ ...current, [activityId]: '' }))
  }

  const handleToggleChecklist = async (activityId: string, item: ChecklistItem) => {
    const { data, error } = await supabase
      .from('activity_checklist')
      .update({
        is_done: !item.is_done,
        completed_at: item.is_done ? null : new Date().toISOString(),
      })
      .eq('id', item.id)
      .select('id, activity_id, title, is_done, created_at, completed_at')
      .single()

    if (error) {
      setStatus(error.message)
      return
    }

    setChecklists((current) => ({
      ...current,
      [activityId]: (current[activityId] ?? []).map((entry) => (entry.id === item.id ? data : entry)),
    }))
  }

  const todayString = toDateString(new Date())
  const todayPending = activities.filter(
    (activity) => activity.due_date === todayString && activity.status !== 'done',
  ).length
  const todayDone = activities.filter((activity) => activity.completed_at?.slice(0, 10) === todayString).length

  const streak = getStreak(activities)
  const completedCount = activities.filter((activity) => activity.status === 'done').length
  const medals = [
    { id: 'medal-5', label: 'Concluiu 5 atividades', unlocked: completedCount >= 5 },
    { id: 'medal-10', label: 'Concluiu 10 atividades', unlocked: completedCount >= 10 },
    { id: 'medal-20', label: 'Concluiu 20 atividades', unlocked: completedCount >= 20 },
  ]

  const visibleActivities = useMemo(() => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 6)

    return sortedActivities.filter((activity) => {
      if (view === 'today' && activity.due_date !== todayString) {
        return false
      }
      if (view === 'week') {
        if (!activity.due_date) return false
        const due = new Date(`${activity.due_date}T00:00:00`)
        if (due < new Date(`${todayString}T00:00:00`) || due > weekEnd) {
          return false
        }
      }
      if (filters.status !== 'all' && activity.status !== filters.status) {
        return false
      }
      if (filters.category !== 'all') {
        if (filters.category === 'none' && activity.category) return false
        if (filters.category !== 'none' && activity.category !== filters.category) return false
      }
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const haystack = `${activity.title} ${activity.description ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [filters.category, filters.search, filters.status, sortedActivities, todayString, view])

  return (
    <div className="app-shell">
      <TopNav />
      <main className="dashboard" id="main-content">
        <DashboardHero
          todayPending={todayPending}
          todayDone={todayDone}
          streak={streak}
          medals={medals}
          onCreate={openCreate}
        />
        <AgendaPanel
          view={view}
          filters={filters}
          categoryOptions={categoryOptions}
          statusMessage={status}
          liveMessage={liveMessage}
          loading={loading}
          activities={visibleActivities}
          checklists={checklists}
          checklistDrafts={checklistDrafts}
          onViewChange={setView}
          onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          onStatusChange={(value) => setFilters((current) => ({ ...current, status: value }))}
          onCategoryChange={(value) => setFilters((current) => ({ ...current, category: value }))}
          onQuickStatus={handleQuickStatus}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleChecklist={handleToggleChecklist}
          onAddChecklistItem={handleAddChecklistItem}
          onChecklistDraftChange={handleChecklistDraftChange}
        />
      </main>
      <ActivityModal
        open={formOpen}
        mode={formMode}
        form={form}
        saving={saving}
        titleInputRef={titleInputRef}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        onChange={handleFormChange}
      />
      <ToastStack toasts={toasts} />
    </div>
  )
}
