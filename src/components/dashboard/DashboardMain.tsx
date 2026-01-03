import type { ComponentProps } from 'react'
import { AgendaPanel } from './AgendaPanel'
import { DashboardHero } from './DashboardHero'

type DashboardMainProps = {
  hero: ComponentProps<typeof DashboardHero>
  agenda: ComponentProps<typeof AgendaPanel>
}

export const DashboardMain = ({ hero, agenda }: DashboardMainProps) => {
  return (
    <main className="dashboard" id="main-content">
      <DashboardHero {...hero} />
      <AgendaPanel {...agenda} />
    </main>
  )
}
