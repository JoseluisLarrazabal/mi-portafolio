import { lazy, Suspense } from 'react'
import { usePortfolio } from './store'
import { Boundary, DockPanel, Hud, Joystick, Launch, ListMode, Loader, Toasts } from './ui'

const Universe = lazy(() => import('./scene/Universe'))

export default function App() {
  const view = usePortfolio((s) => s.view)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {view !== 'list' && (
        <Boundary>
          <Suspense fallback={<Loader />}>
            <Universe />
          </Suspense>
        </Boundary>
      )}
      <Launch />
      <Hud />
      <DockPanel />
      <ListMode />
      <Joystick />
      <Toasts />
    </div>
  )
}
