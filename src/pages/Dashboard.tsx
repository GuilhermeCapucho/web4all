import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Activity, ChecklistItem } from '../types'
import { TopNav } from '../components/TopNav'

type ActivityFormState = {
  title: string
  description: string
  status: Activity['status']
  category: string
  due_date: string
  due_time: string
  duration_minutes: string
  recurrence: 'none' | NonNullable<Activity['recurrence']>
}

type Toast = {
  id: string
  message: string
  tone: 'info' | 'success' | 'warning'
}

const statusLabels: Record<Activity['status'], string> = {
  todo: 'A fazer',
  doing: 'Em andamento',
  paused: 'Pausada',
  done: 'Concluida',
}

const recurrenceLabels: Record<NonNullable<Activity['recurrence']>, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
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

const toDateString = (date: Date) => date.toISOString().slice(0, 10)

const getStreak = (items: Activity[]) => {
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

const formatDate = (value: string | null) => {
  if (!value) return 'Sem data'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('pt-BR')
}

const formatTime = (value: string | null) => {
  if (!value) return 'Sem horario'
  return value.slice(0, 5)
}

export const Dashboard = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
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

  const addToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}`
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
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
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (activity: Activity) => {
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

  const closeForm = () => {
    setFormOpen(false)
    setSaving(false)
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        .select(
          'id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at',
        )
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
    const completedAt = payload.status === 'done' ? fromStatus === 'done' ? original?.completed_at ?? now : now : null
    const updates = {...payload, completed_at: completedAt, reopened_at: null as string | null}

    if (fromStatus === 'done' && payload.status !== 'done') {
      updates.reopened_at = now
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', editingId)
      .eq('user_id', user.id)
      .select(
        'id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at',
      )
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
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', user.id)

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
      .select(
        'id, user_id, title, description, created_at, updated_at, status, category, due_date, due_time, duration_minutes, recurrence, completed_at, reopened_at',
      )
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
  const todayDone = activities.filter(
    (activity) => activity.completed_at?.slice(0, 10) === todayString,
  ).length

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
        <section className="panel panel-hero">
          <div className="hero-text">
            <div className="hero-top">
              <div>
                <h1>Resumo rapido</h1>
                <p className="muted">
                  Hoje: {todayPending} pendentes • {todayDone} concluida{todayDone === 1 ? '' : 's'}
                </p>
              </div>
              <button type="button" onClick={openCreate}>
                Nova atividade
              </button>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <span className="metric-label">Streak</span>
                <strong>{streak} dia{streak === 1 ? '' : 's'}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Medalhas</span>
                <div className="medal-row">
                  {medals.map((medal) => (
                    <span
                      key={medal.id}
                      className={`medal ${medal.unlocked ? 'medal--on' : 'medal--off'}`}
                    >
                      {medal.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <div>
              <h2>Agenda</h2>
              <p className="muted">Organize por lista, hoje ou semana.</p>
            </div>
            <div className="view-tabs" role="tablist" aria-label="Visoes">
              <button
                type="button"
                className={view === 'list' ? 'tab is-active' : 'tab'}
                onClick={() => setView('list')}
                role="tab"
              >
                Lista
              </button>
              <button
                type="button"
                className={view === 'today' ? 'tab is-active' : 'tab'}
                onClick={() => setView('today')}
                role="tab"
              >
                Hoje
              </button>
              <button
                type="button"
                className={view === 'week' ? 'tab is-active' : 'tab'}
                onClick={() => setView('week')}
                role="tab"
              >
                Semana
              </button>
            </div>
          </header>

          <div className="filters-row">
            <label className="filter-field">
              Busca
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Buscar por titulo ou descricao"
              />
            </label>
            <label className="filter-field">
              Status
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="todo">A fazer</option>
                <option value="doing">Em andamento</option>
                <option value="paused">Pausada</option>
                <option value="done">Concluida</option>
              </select>
            </label>
            <label className="filter-field">
              Categoria
              <select
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="all">Todas</option>
                <option value="none">Sem categoria</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {status ? (
            <p className="status error" role="alert">
              {status}
            </p>
          ) : null}

          <div className="activity-list" aria-live="polite">
            {loading ? (
              <div className="agenda-loading" role="status" aria-live="polite">
                <div className="spinner" aria-hidden="true" />
                <span className="sr-only">Carregando agenda</span>
              </div>
            ) : null}
            {visibleActivities.length === 0 && !loading ? (
              <p className="muted">Nenhuma atividade encontrada.</p>
            ) : null}
            {!loading &&
              visibleActivities.map((activity) => {
              const items = checklists[activity.id] ?? []
              const completed = items.filter((item) => item.is_done).length
              const total = items.length
              const progress = total ? Math.round((completed / total) * 100) : 0

              return (
                <article key={activity.id} className={`activity-card status-${activity.status}`}>
                  <header className="card-header">
                    <div>
                      <div className="card-badges">
                        <span className={`chip status-chip status-${activity.status}`}>
                          {statusLabels[activity.status]}
                        </span>
                        {activity.category ? (
                          <span className="chip category-chip">{activity.category}</span>
                        ) : null}
                      </div>
                      <h3>{activity.title}</h3>
                    </div>
                    <div className="card-actions">
                      {activity.status === 'done' ? (
                        <button type="button" className="ghost" onClick={() => handleQuickStatus(activity, 'todo')}>
                          Reabrir
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleQuickStatus(activity, 'done')}>
                          Concluir
                        </button>
                      )}
                      <button type="button" className="ghost" onClick={() => openEdit(activity)}>
                        Editar
                      </button>
                      <button type="button" className="ghost danger" onClick={() => handleDelete(activity.id)}>
                        Excluir
                      </button>
                    </div>
                  </header>

                  <div className="card-body">
                    {activity.description ? <p>{activity.description}</p> : null}
                    <div className="meta-grid">
                      <div>
                        <span className="meta-label">Data</span>
                        <span>{formatDate(activity.due_date)}</span>
                      </div>
                      <div>
                        <span className="meta-label">Horario</span>
                        <span>{formatTime(activity.due_time)}</span>
                      </div>
                      <div>
                        <span className="meta-label">Duracao</span>
                        <span>{activity.duration_minutes ? `${activity.duration_minutes} min` : 'Sem duracao'}</span>
                      </div>
                      <div>
                        <span className="meta-label">Recorrencia</span>
                        <span>
                          {activity.recurrence ? recurrenceLabels[activity.recurrence] : 'Sem recorrencia'}
                        </span>
                      </div>
                    </div>

                    <div className="checklist">
                      <div className="checklist-header">
                        <strong>Checklist</strong>
                        <span className="muted">
                          {completed}/{total} passos concluidos
                        </span>
                      </div>
                      {items.map((item) => (
                        <label key={item.id} className="checkbox">
                          <input
                            type="checkbox"
                            checked={item.is_done}
                            onChange={() => handleToggleChecklist(activity.id, item)}
                          />
                          <span>{item.title}</span>
                        </label>
                      ))}
                      <form
                        className="checklist-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          handleAddChecklistItem(activity.id)
                        }}
                      >
                        <input
                          type="text"
                          value={checklistDrafts[activity.id] ?? ''}
                          onChange={(event) =>
                            setChecklistDrafts((current) => ({
                              ...current,
                              [activity.id]: event.target.value,
                            }))
                          }
                          placeholder="Adicionar subtarefa"
                        />
                        <button type="submit" className="ghost">
                          Adicionar
                        </button>
                      </form>
                      {total ? (
                        <div className="progress">
                          <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                      ) : null}
                    </div>

                    <div className="history-line">
                      Criada em {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                      {activity.completed_at
                        ? ` • Concluida em ${new Date(activity.completed_at).toLocaleDateString('pt-BR')}`
                        : ''}
                      {activity.reopened_at
                        ? ` • Reaberta em ${new Date(activity.reopened_at).toLocaleDateString('pt-BR')}`
                        : ''}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      {formOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--wide">
            <header className="modal-header">
              <h2>{formMode === 'create' ? 'Nova atividade' : 'Editar atividade'}</h2>
            </header>
            <form className="form-grid" onSubmit={handleFormSubmit}>
              <label>
                Titulo
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Descricao
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                />
              </label>
              <div className="form-columns">
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as Activity['status'] }))
                    }
                  >
                    <option value="todo">A fazer</option>
                    <option value="doing">Em andamento</option>
                    <option value="paused">Pausada</option>
                    <option value="done">Concluida</option>
                  </select>
                </label>
                <label>
                  Categoria
                  <input
                    type="text"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Ex: Estudos"
                  />
                </label>
              </div>
              <div className="form-columns">
                <label>
                  Data
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
                  />
                </label>
                <label>
                  Horario
                  <input
                    type="time"
                    value={form.due_time}
                    onChange={(event) => setForm((current) => ({ ...current, due_time: event.target.value }))}
                  />
                </label>
              </div>
              <div className="form-columns">
                <label>
                  Duracao (min)
                  <input
                    type="number"
                    min={0}
                    value={form.duration_minutes}
                    onChange={(event) => setForm((current) => ({ ...current, duration_minutes: event.target.value }))}
                  />
                </label>
                <label>
                  Recorrencia
                  <select
                    value={form.recurrence}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recurrence: event.target.value as ActivityFormState['recurrence'],
                      }))
                    }
                  >
                    <option value="none">Sem recorrencia</option>
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions modal-actions--split">
                <button type="button" className="ghost" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : formMode === 'create' ? 'Criar atividade' : 'Salvar alteracoes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toasts.length ? (
        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast--${toast.tone}`}>
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
