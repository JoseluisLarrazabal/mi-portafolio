import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { usePortfolio } from '../store'
import { ArrowRight } from './icons'
import { useMedia } from './useMedia'

export function Launch() {
  const view = usePortfolio((s) => s.view)
  const setView = usePortfolio((s) => s.setView)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  if (view !== 'launch') return null
  return (
    <main className="launch">
      <div className="launch-inner">
        <h1>{profile.name}</h1>
        <p className="role">
          <strong>{profile.title}</strong>
          Fly through {projects.length} projects orbiting one sun.
        </p>
        <div className="actions">
          <button type="button" className="btn-primary" onClick={() => setView('flight')}>
            Begin flight
            <span className="ico" aria-hidden="true"><ArrowRight /></span>
          </button>
          <button type="button" className="link-btn" onClick={() => setView('list')}>Skip the flight</button>
        </div>
        {reduced && <p className="hint">Reduced motion is on. The list view may suit you better.</p>}
      </div>
    </main>
  )
}
