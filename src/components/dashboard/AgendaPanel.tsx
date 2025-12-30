import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  isTeacher: boolean
  assignedLabels: Record<string, string>
  onViewChange: (view: 'list' | 'today' | 'week') => void
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onQuickStatus: (activity: Activity, nextStatus: Activity['status']) => void
  onEdit: (activity: Activity) => void
  onDelete: (activity: Activity) => void
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
  isTeacher,
  assignedLabels,
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
}: AgendaPanelProps) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const views: Array<AgendaPanelProps['view']> = ['list', 'today', 'week']
  const pageSize = 3
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize))
  const showPagination = activities.length > pageSize

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.category, filters.search, filters.status, view])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pagedActivities = useMemo(() => {
    if (!showPagination) return activities
    const start = (currentPage - 1) * pageSize
    return activities.slice(start, start + pageSize)
  }, [activities, currentPage, showPagination])

  const focusTab = useCallback((index: number) => {
    tabRefs.current[index]?.focus()
  }, [])

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = views.findIndex((value) => value === view)
      if (currentIndex < 0) return

      let nextIndex = currentIndex
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % views.length
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + views.length) % views.length
      } else if (event.key === 'Home') {
        nextIndex = 0
      } else if (event.key === 'End') {
        nextIndex = views.length - 1
      } else {
        return
      }

      event.preventDefault()
      const nextView = views[nextIndex]
      onViewChange(nextView)
      focusTab(nextIndex)
    },
    [focusTab, onViewChange, view, views],
  )

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Agenda</h2>
          <p className="muted">Organize por lista, hoje ou semana.</p>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Visoes">
          {views.map((tabView, index) => (
            <button key={tabView} ref={(node) => {tabRefs.current[index] = node}} type="button" className={view === tabView ? 'tab is-active' : 'tab'}
              onClick={() => onViewChange(tabView)}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={view === tabView}>
              {tabView === 'list' ? 'Lista' : tabView === 'today' ? 'Hoje' : 'Semana'}
            </button>
          ))}
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
        activities={pagedActivities}
        loading={loading}
        checklists={checklists}
        checklistDrafts={checklistDrafts}
        isTeacher={isTeacher}
        assignedLabels={assignedLabels}
        onQuickStatus={onQuickStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleChecklist={onToggleChecklist}
        onAddChecklistItem={onAddChecklistItem}
        onChecklistDraftChange={onChecklistDraftChange}
      />
      {showPagination ? (
        <div className="pagination" role="navigation" aria-label="Paginacao da agenda">
          <button
            type="button"
            className="pagination-button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="pagination-info">
            Pagina {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="pagination-button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Proxima
          </button>
        </div>
      ) : null}
    </section>
  )
}
