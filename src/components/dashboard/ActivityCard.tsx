import type { Activity, ChecklistItem } from '../../types'
import { formatDate, formatTime, recurrenceLabels, statusLabels } from './activityHelpers'
import { ActivityChecklist } from './ActivityChecklist'

type ActivityCardProps = {
  activity: Activity
  items: ChecklistItem[]
  draft: string
  assignedLabel?: string
  isTeacher: boolean
  onQuickStatus: (activity: Activity, nextStatus: Activity['status']) => void
  onEdit: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  onToggleChecklist: (activityId: string, item: ChecklistItem) => void
  onAddChecklistItem: (activityId: string) => void
  onChecklistDraftChange: (activityId: string, value: string) => void
}

export const ActivityCard = ({activity, items, draft, assignedLabel, isTeacher, onQuickStatus, onEdit, onDelete, onToggleChecklist, onAddChecklistItem, onChecklistDraftChange}: ActivityCardProps) => {
  const checklistInputId = `checklist-${activity.id}`
  const showHelpAction = !isTeacher && activity.status !== 'done'
  const showResumeAction = !isTeacher && activity.status === 'paused'
  const statusLabel = activity.status === 'paused' ? 'Precisa de ajuda' : statusLabels[activity.status]
  const isOverdue =
    activity.status !== 'done' &&
    activity.due_date !== null &&
    new Date(`${activity.due_date}T00:00:00`).getTime() < new Date().setHours(0, 0, 0, 0)

  return (
    <article className={`activity-card status-${activity.status}`}>
      <header className="card-header">
        <div>
          <div className="card-badges">
            <span className={`chip status-chip status-${activity.status}`}>{statusLabel}</span>
            {activity.category ? <span className="chip category-chip">{activity.category}</span> : null}
          </div>
          <h3>{activity.title}</h3>
        </div>
        <div className="card-actions">
          {activity.status === 'done' ? (
            isTeacher ? (
              <button type="button" className="ghost" onClick={() => onQuickStatus(activity, 'todo')} aria-label={`Reabrir atividade: ${activity.title}`}>
                Reabrir
              </button>
            ) : null
          ) : !isTeacher ? (
            <button type="button" onClick={() => onQuickStatus(activity, 'done')} aria-label={`Concluir atividade: ${activity.title}`}>
              Concluir
            </button>
          ) : null}
          {showHelpAction ? (
            <button type="button" className="ghost" onClick={() => onQuickStatus(activity, showResumeAction ? 'todo' : 'paused')} aria-label={`Pedir ajuda na atividade: ${activity.title}`}>
              {showResumeAction ? 'Retomar' : 'Preciso de ajuda'}
            </button>
          ) : null}
          {isTeacher ? (
            <>
              <button type="button" className="ghost" onClick={() => onEdit(activity)} aria-label={`Editar atividade: ${activity.title}`}>
                Editar
              </button>
              <button type="button" className="ghost danger" onClick={() => onDelete(activity)} aria-label={`Excluir atividade: ${activity.title}`}>
                Excluir
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="card-body">
        {activity.description ? <p>{activity.description}</p> : null}
        {isOverdue ? <p className="status error">Atividade atrasada.</p> : null}
        <div className="meta-grid">
          <div>
            <span className="meta-label">Data</span>
            <span>{formatDate(activity.due_date)}</span>
          </div>
          <div>
            <span className="meta-label">Horário</span>
            <span>{formatTime(activity.due_time)}</span>
          </div>
          <div>
            <span className="meta-label">Duração</span>
            <span>{activity.duration_minutes ? `${activity.duration_minutes} min` : 'Sem duração'}</span>
          </div>
          <div>
            <span className="meta-label">Recorrência</span>
            <span>{activity.recurrence ? recurrenceLabels[activity.recurrence] : 'Sem recorrência'}</span>
          </div>
          {assignedLabel ? (
            <div>
              <span className="meta-label">Aluno</span>
              <span>{assignedLabel}</span>
            </div>
          ) : null}
        </div>

        <ActivityChecklist
          activityId={activity.id}
          activityTitle={activity.title}
          items={items}
          draft={draft}
          inputId={checklistInputId}
          canAdd={isTeacher}
          onToggle={onToggleChecklist}
          onAdd={onAddChecklistItem}
          onDraftChange={onChecklistDraftChange}
        />

        <div className="history-line">
          Criada em {new Date(activity.created_at).toLocaleDateString('pt-BR')}
          {activity.completed_at ? ` | Concluída em ${new Date(activity.completed_at).toLocaleDateString('pt-BR')}` : ''}
          {activity.reopened_at ? ` | Reaberta em ${new Date(activity.reopened_at).toLocaleDateString('pt-BR')}` : ''}
        </div>
      </div>
    </article>
  )
}
