import type { ChecklistItem } from '../../types'

type ActivityChecklistProps = {
  activityId: string
  activityTitle: string
  items: ChecklistItem[]
  draft: string
  inputId: string
  canAdd: boolean
  onToggle: (activityId: string, item: ChecklistItem) => void
  onAdd: (activityId: string) => void
  onDraftChange: (activityId: string, value: string) => void
}

export const ActivityChecklist = ({activityId, activityTitle, items, draft, inputId, canAdd, onToggle, onAdd, onDraftChange}: ActivityChecklistProps) => {
  const completed = items.filter((item) => item.is_done).length
  const total = items.length
  const progress = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="checklist">
      <div className="checklist-header">
        <strong>Checklist</strong>
        <span className="muted">
          {completed}/{total} passos concluidos
        </span>
      </div>
      {items.map((item) => (
        <label key={item.id} className="checkbox">
          <input type="checkbox" checked={item.is_done} onChange={() => onToggle(activityId, item)} />
          <span>{item.title}</span>
        </label>
      ))}
      <form className="checklist-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (canAdd) {
            onAdd(activityId)
          }
        }}>
        <label className="sr-only" htmlFor={inputId}>
          Adicionar subtarefa
        </label>
        <input id={inputId} type="text" value={draft} onChange={(event) => onDraftChange(activityId, event.target.value)} placeholder="Adicionar subtarefa" disabled={!canAdd}/>
        <button type="submit" className="ghost" aria-label={`Adicionar subtarefa em ${activityTitle}`} disabled={!canAdd}>
          Adicionar
        </button>
      </form>
      {total ? (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  )
}
