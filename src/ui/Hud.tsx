import { useEffect, useState } from 'react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { startAmbient, stopAmbient, whoosh } from '../audio'
import { usePortfolio } from '../store'
import { getDest, groups } from './data'
import { ArrowRight, Check, ChevronDown, List, SoundOff, SoundOn } from './icons'

function useAudioBridge() {
  useEffect(() => {
    const sync = () => { if (!usePortfolio.getState().muted) startAmbient() }
    sync()
    const unsub = usePortfolio.subscribe((s, prev) => {
      if (s.muted !== prev.muted) { if (s.muted) stopAmbient(); else startAmbient() }
      if (s.warping && !prev.warping && !s.muted) whoosh()
    })
    return () => { unsub(); stopAmbient() }
  }, [])
}

export function Hud() {
  const view = usePortfolio((s) => s.view)
  if (view !== 'flight') return null
  return <HudInner />
}

function HudInner() {
  useAudioBridge()
  const visited = usePortfolio((s) => s.visited)
  const muted = usePortfolio((s) => s.muted)
  const nearId = usePortfolio((s) => s.nearId)
  const openId = usePortfolio((s) => s.openId)
  const targetId = usePortfolio((s) => s.targetId)
  const warping = usePortfolio((s) => s.warping)
  const warpTo = usePortfolio((s) => s.warpTo)
  const openPanel = usePortfolio((s) => s.openPanel)
  const toggleMute = usePortfolio((s) => s.toggleMute)
  const setView = usePortfolio((s) => s.setView)

  const total = projects.length
  const count = visited.length
  const target = targetId ? getDest(targetId) : undefined
  const near = nearId ? getDest(nearId) : undefined
  const status = warping && target ? `Warping to ${target.name}` : near ? `Arrived at ${near.name}` : ''
  const currentId = warping ? targetId : nearId
  const [destOpen, setDestOpen] = useState(() => innerHeight >= 760)

  return (
    <main className="hud" inert={openId !== null}>
      <header className="hud-top">
        <div className="brand">
          <span className="brand-name" title={profile.name}>
            <span className="full">{profile.name}</span>
            <span className="short" aria-hidden="true">{profile.name.split(' ').slice(0, 2).join(' ')}</span>
          </span>
          <span className="brand-sub">{profile.title}</span>
        </div>
        <div className="hud-actions">
          <p className={`chip${count >= total ? ' done' : ''}`}>Explored {count}/{total}</p>
          <button type="button" className="chip-btn" aria-pressed={!muted} onClick={toggleMute}>
            {muted ? <SoundOff /> : <SoundOn />}
            <span className="lbl">Sound</span>
          </button>
          <button type="button" className="chip-btn" onClick={() => setView('list')}>
            <List />
            <span className="lbl">List view</span>
          </button>
        </div>
      </header>

      <nav className={`dest shell${destOpen ? '' : ' collapsed'}`} aria-label="Destinations">
        <button type="button" className="dest-toggle" aria-expanded={destOpen} aria-controls="destList" onClick={() => setDestOpen((o) => !o)}>
          <span>Destinations</span>
          <ChevronDown />
        </button>
        <div className="core" id="destList">
          {groups.map((g) => (
            <div className="dest-group" key={g.title} role="group" aria-label={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.items.map((d) => {
                  const seen = visited.includes(d.id)
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        className={`dest-item${seen ? ' seen' : ''}`}
                        data-dest={d.id}
                        aria-current={currentId === d.id ? 'true' : undefined}
                        aria-label={`${d.name}, ${d.type}${seen ? ', visited' : ''}. ${nearId === d.id ? 'Open' : 'Warp to destination'}`}
                        onClick={() => (nearId === d.id ? openPanel(d.id) : warpTo(d.id))}
                      >
                        <span className="sw" style={{ background: d.gradient }} aria-hidden="true" />
                        <span className="tx">
                          <span className="nm">{d.name}</span>
                          <span className="ty">{d.type}</span>
                        </span>
                        <span className="st" aria-hidden="true">{seen ? <Check /> : <ArrowRight />}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="bottom">
        <p className="status" role="status" aria-live="polite">{status}</p>
        {near && openId === null && (
          <button type="button" className="btn-primary dock" aria-keyshortcuts="E" onClick={() => openPanel(near.id)}>
            <span>Dock at {near.name}</span> <kbd>E</kbd>
            <span className="ico" aria-hidden="true"><ArrowRight /></span>
          </button>
        )}
        <p className="keys">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrows to fly, <kbd>Shift</kbd> to boost. Click a planet to warp.
        </p>
      </div>
    </main>
  )
}
