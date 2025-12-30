import type { Activity, ChecklistItem } from '../../types'
import { ActivityCard } from './ActivityCard'

type ActivityListProps = {
  activities: Activity[]
  loading: boolean
  checklists: Record<string, ChecklistItem[]>
  checklistDrafts: Record<string, string>
  isTeacher: boolean
  assignedLabels: Record<string, string>
  onQuickStatus: (activity: Activity, nextStatus: Activity['status']) => void
  onEdit: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  onToggleChecklist: (activityId: string, item: ChecklistItem) => void
  onAddChecklistItem: (activityId: string) => void
  onChecklistDraftChange: (activityId: string, value: string) => void
}

export const ActivityList = ({activities, loading, checklists, checklistDrafts, isTeacher, assignedLabels, onQuickStatus, onEdit, onDelete, onToggleChecklist, onAddChecklistItem, onChecklistDraftChange}: ActivityListProps) => (
  <div className="activity-list" aria-live="polite">
    {loading ? (
      <div className="agenda-loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span className="sr-only">Carregando agenda</span>
      </div>
    ) : null}
    {activities.length === 0 && !loading ? <p className="muted">Nenhuma atividade encontrada.</p> : null}
    {!loading &&
      activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          items={checklists[activity.id] ?? []}
          draft={checklistDrafts[activity.id] ?? ''}
          assignedLabel={activity.assigned_to ? (assignedLabels[activity.assigned_to] ?? 'Aluno sem nome') : undefined}
          isTeacher={isTeacher}
          onQuickStatus={onQuickStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleChecklist={onToggleChecklist}
          onAddChecklistItem={onAddChecklistItem}
          onChecklistDraftChange={onChecklistDraftChange}
        />
      ))}
  </div>
)
