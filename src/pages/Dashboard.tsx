import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Activity } from '../types'
import { TopNav } from '../components/TopNav'

type ActivityFormState = {
  title: string
  description: string
}

const emptyForm: ActivityFormState = { title: '', description: '' }

export const Dashboard = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ActivityFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<ActivityFormState>(emptyForm)

  const sortedActivities = useMemo(
    () =>
      [...activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities],
  )

  const fetchActivities = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('activities').select('id, user_id, title, description, created_at, updated_at').eq('user_id', user.id)
    .order('created_at', { ascending: false })

    if (error) {
      setStatus(error.message)
      setLoading(false)
      return
    }

    setActivities(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setCreating(true)
    setStatus(null)

    const { data, error } = await supabase
      .from('activities')
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        user_id: user.id,
      })
      .select('id, user_id, title, description, created_at, updated_at')
      .single()

    setCreating(false)

    if (error) {
      setStatus(error.message)
      return
    }

    setActivities((current) => [data, ...current])
    setForm(emptyForm)
  }

  const handleEditStart = (activity: Activity) => {
    setEditingId(activity.id)
    setEditingForm({
      title: activity.title,
      description: activity.description ?? '',
    })
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingForm(emptyForm)
  }

  const handleEditSave = async (activityId: string) => {
    if (!user) return
    setStatus(null)

    const { data, error } = await supabase
      .from('activities')
      .update({
        title: editingForm.title.trim(),
        description: editingForm.description.trim() || null,
      })
      .eq('id', activityId)
      .eq('user_id', user.id)
      .select('id, user_id, title, description, created_at, updated_at')
      .single()

    if (error) {
      setStatus(error.message)
      return
    }

    setActivities((current) =>
      current.map((activity) => (activity.id === activityId ? data : activity)),
    )
    handleEditCancel()
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
  }

  return (
    <div className="app-shell">
      <TopNav />
      <main className="dashboard" id="main-content">
        <section className="panel">
          <header className="panel-header">
            <div>
              <h1>Suas atividades</h1>
              <p className="muted">
                Crie, edite e organize suas tarefas pessoais em um lugar acessivel.
              </p>
            </div>
          </header>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Titulo
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Descricao
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
              />
            </label>
            <button type="submit" disabled={creating}>
              {creating ? 'Salvando...' : 'Adicionar atividade'}
            </button>
          </form>
          {status ? (
            <p className="status error" role="alert">
              {status}
            </p>
          ) : null}
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Lista</h2>
            {loading ? <span className="muted">Carregando...</span> : null}
          </header>
          <div className="activity-list" aria-live="polite">
            {sortedActivities.length === 0 && !loading ? (
              <p className="muted">Nenhuma atividade cadastrada ainda.</p>
            ) : null}
            {sortedActivities.map((activity) => (
              <article key={activity.id} className="activity-card">
                {editingId === activity.id ? (
                  <div className="form-grid">
                    <label>
                      Titulo
                      <input type="text" value={editingForm.title}
                        onChange={(event) =>
                          setEditingForm((current) => ({...current, title: event.target.value}))
                        }
                      />
                    </label>
                    <label>
                      Descricao
                      <textarea value={editingForm.description}
                        onChange={(event) =>
                          setEditingForm((current) => ({...current, description: event.target.value}))
                        }
                        rows={3}
                      />
                    </label>
                    <div className="row">
                      <button type="button" onClick={() => handleEditSave(activity.id)}>
                        Salvar
                      </button>
                      <button type="button" className="ghost" onClick={handleEditCancel}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3>{activity.title}</h3>
                      {activity.description ? <p>{activity.description}</p> : null}
                      <p className="muted">
                        Criado em {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="row">
                      <button type="button" onClick={() => handleEditStart(activity)}>
                        Editar
                      </button>
                      <button type="button" className="ghost danger" onClick={() => handleDelete(activity.id)}>
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
