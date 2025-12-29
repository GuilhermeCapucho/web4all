import type { FormEvent, RefObject } from 'react'
import type { Activity } from '../../types'

export type ActivityFormState = {
  title: string
  description: string
  status: Activity['status']
  category: string
  due_date: string
  due_time: string
  duration_minutes: string
  recurrence: 'none' | NonNullable<Activity['recurrence']>
  assigned_to: string
}

type StudentOption = {
  id: string
  label: string
}

type ActivityModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  form: ActivityFormState
  saving: boolean
  isTeacher: boolean
  students: StudentOption[]
  titleInputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (next: Partial<ActivityFormState>) => void
}

export const ActivityModal = ({open, mode, form, saving, isTeacher, students, titleInputRef, onClose, onSubmit, onChange}: ActivityModalProps) => {
  if (!open) return null

  const hasStudents = students.length > 0

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
      <div className="modal-card modal-card--wide">
        <header className="modal-header">
          <h2 id="activity-modal-title">{mode === 'create' ? 'Nova atividade' : 'Editar atividade'}</h2>
        </header>
        <form className="form-grid" onSubmit={onSubmit}>
          {isTeacher ? (
            <label>
              Aluno
              <select value={form.assigned_to} onChange={(event) => onChange({ assigned_to: event.target.value })} required disabled={!hasStudents}>
                <option value="" disabled>
                  {hasStudents ? 'Selecione um aluno' : 'Nenhum aluno vinculado'}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Titulo
            <input type="text" ref={titleInputRef} value={form.title} onChange={(event) => onChange({ title: event.target.value })} required/>
          </label>
          <label>
            Descricao
            <textarea value={form.description} onChange={(event) => onChange({ description: event.target.value })} rows={3}/>
          </label>
          <div className="form-columns">
            <label>
              Status
              <select value={form.status} onChange={(event) => onChange({ status: event.target.value as Activity['status'] })}>
                <option value="todo">A fazer</option>
                <option value="doing">Em andamento</option>
                <option value="paused">Pausada</option>
                <option value="done">Concluida</option>
              </select>
            </label>
            <label>
              Categoria
              <input type="text" value={form.category} onChange={(event) => onChange({ category: event.target.value })} placeholder="Ex: Estudos"/>
            </label>
          </div>
          <div className="form-columns">
            <label>
              Data
              <input type="date" value={form.due_date} onChange={(event) => onChange({ due_date: event.target.value })} />
            </label>
            <label>
              Horario
              <input type="time" value={form.due_time} onChange={(event) => onChange({ due_time: event.target.value })} />
            </label>
          </div>
          <div className="form-columns">
            <label>
              Duracao (min)
              <input type="number" min={0} value={form.duration_minutes} onChange={(event) => onChange({ duration_minutes: event.target.value })}/>
            </label>
            <label>
              Recorrencia
              <select value={form.recurrence} onChange={(event) => onChange({ recurrence: event.target.value as ActivityFormState['recurrence'] })}>
                <option value="none">Sem recorrencia</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
              </select>
            </label>
          </div>
          <div className="modal-actions modal-actions--split">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : mode === 'create' ? 'Criar atividade' : 'Salvar alteracoes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
