type Medal = {
  id: string
  label: string
  unlocked: boolean
}

type DashboardHeroProps = {
  todayPending: number
  todayDone: number
  streak: number
  medals: Medal[]
  onCreate: () => void
  canCreate: boolean
  roleLabel: string
  showMetrics: boolean
}

export const DashboardHero = ({ todayPending, todayDone, streak, medals, onCreate, canCreate, roleLabel, showMetrics }: DashboardHeroProps) => (
  <section className="panel panel-hero">
    <div className="hero-text">
      <div className="hero-top">
        <div>
          <h1>Resumo rápido</h1>
          <p className="muted">
            Hoje: {todayPending} pendentes • {todayDone} concluída{todayDone === 1 ? '' : 's'}
          </p>
          <p className="muted">Perfil: {roleLabel}</p>
        </div>
        {canCreate ? (
          <button type="button" onClick={onCreate}>
            Nova atividade
          </button>
        ) : null}
      </div>
      {showMetrics ? (
        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">Streak</span>
            <strong>
              {streak} dia{streak === 1 ? '' : 's'}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Medalhas</span>
            <div className="medal-row">
              {medals.map((medal) => (
                <span key={medal.id} className={`medal ${medal.unlocked ? 'medal--on' : 'medal--off'}`}>
                  {medal.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </section>
)
