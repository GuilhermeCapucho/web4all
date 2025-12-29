import type { Activity, ChecklistItem } from '../../types'
import { ActivityList } from './ActivityList'

type FiltersState = {
  search: string
  status: string
  category: string
}

type AgendaPanelProps = {
  view: 'list' | 'today' | 'week'
  filters: FiltersState
  categoryOptions: string[]
  statusMessage: string | null
  liveMessage: string
  loading: boolean
  activities: Activity[]
  checklists: Record<string, ChecklistItem[]>
  checklistDrafts: Record<string, string>
  onViewChange: (view: 'list' | 'today' | 'week') => void
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onQuickStatus: (activity: Activity, nextStatus: Activity['status']) => void
  onEdit: (activity: Activity) => void
  onDelete: (activityId: string) => void
  onToggleChecklist: (activityId: string, item: ChecklistItem) => void
  onAddChecklistItem: (activityId: string) => void
  onChecklistDraftChange: (activityId: string, value: string) => void
}

export const AgendaPanel = ({
  view,
  filters,
  categoryOptions,
  statusMessage,
  liveMessage,
  loading,
  activities,
  checklists,
  checklistDrafts,
  onViewChange,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onQuickStatus,
  onEdit,
  onDelete,
  onToggleChecklist,
  onAddChecklistItem,
  onChecklistDraftChange,
}: AgendaPanelProps) => (
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
          onClick={() => onViewChange('list')}
          role="tab"
          aria-selected={view === 'list'}
          tabIndex={view === 'list' ? 0 : -1}
        >
          Lista
        </button>
        <button
          type="button"
          className={view === 'today' ? 'tab is-active' : 'tab'}
          onClick={() => onViewChange('today')}
          role="tab"
          aria-selected={view === 'today'}
          tabIndex={view === 'today' ? 0 : -1}
        >
          Hoje
        </button>
        <button
          type="button"
          className={view === 'week' ? 'tab is-active' : 'tab'}
          onClick={() => onViewChange('week')}
          role="tab"
          aria-selected={view === 'week'}
          tabIndex={view === 'week' ? 0 : -1}
        >
          Semana
        </button>
      </div>
    </header>

    <div className="filters-row">
      <label className="filter-field">
        Busca
        <input type="search" value={filters.search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por titulo ou descricao"/>
      </label>
      <label className="filter-field">
        Status
        <select value={filters.status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">Todos</option>
          <option value="todo">A fazer</option>
          <option value="doing">Em andamento</option>
          <option value="paused">Pausada</option>
          <option value="done">Concluida</option>
        </select>
      </label>
      <label className="filter-field">
        Categoria
        <select value={filters.category} onChange={(event) => onCategoryChange(event.target.value)}>
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

    {statusMessage ? (
      <p className="status error" role="alert">
        {statusMessage}
      </p>
    ) : null}
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {liveMessage}
    </div>

    <ActivityList
      activities={activities}
      loading={loading}
      checklists={checklists}
      checklistDrafts={checklistDrafts}
      onQuickStatus={onQuickStatus}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleChecklist={onToggleChecklist}
      onAddChecklistItem={onAddChecklistItem}
      onChecklistDraftChange={onChecklistDraftChange}
    />
  </section>
)
