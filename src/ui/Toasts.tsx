import { useEffect, useRef, useState } from 'react'
import { projects } from '../data/projects'
import { usePortfolio } from '../store'
import { ArrowRight, Close } from './icons'

const TIPS = [
  'Pick a destination. Autopilot does the flying.',
  'Prefer to steer? W A S D or the joystick, Shift to boost.',
  'Close to a planet? Press E or tap Dock to open it.',
]
const KEY = 'mp:onboarded'
const TIP_MS = 4000

function seen(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(KEY, '1') } catch { /* storage blocked */ }
}

export function Toasts() {
  const view = usePortfolio((s) => s.view)
  const openId = usePortfolio((s) => s.openId)
  const visited = usePortfolio((s) => s.visited)
  const warpTo = usePortfolio((s) => s.warpTo)
  const [tip, setTip] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [doneDismissed, setDoneDismissed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (view !== 'flight' || started.current || seen()) return
    started.current = true
    setTip(0)
  }, [view])

  const paused = view !== 'flight' || openId !== null
  const endTips = () => {
    markSeen()
    setTip(null)
  }
  // The clock only runs while the tip is actually on screen; onboarding counts as seen once finished or dismissed.
  useEffect(() => {
    if (tip === null || paused) return
    const t = setTimeout(() => {
      if (tip + 1 >= TIPS.length) endTips()
      else setTip(tip + 1)
    }, TIP_MS)
    return () => clearTimeout(t)
  }, [tip, paused])

  const complete = projects.length > 0 && visited.length >= projects.length
  // Only celebrate a completion that happens this session, not one restored from storage.
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (complete && !wasComplete.current && !done) setDone(true)
    if (!complete) wasComplete.current = false
  }, [complete, done])

  const showDone = view === 'flight' && done && !doneDismissed && openId === null
  const showTip = view === 'flight' && tip !== null && openId === null && !showDone

  return (
    <div className="toasts" aria-live="polite">
      {showDone && (
        <div className="toast" key="done">
          <p>System fully explored.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => { setDoneDismissed(true); warpTo('contact') }}
          >
            Open a channel
            <span className="ico" aria-hidden="true"><ArrowRight /></span>
          </button>
          <button type="button" className="x" aria-label="Dismiss" onClick={() => setDoneDismissed(true)}><Close /></button>
        </div>
      )}
      {showTip && (
        <div className="toast" key={tip}>
          <p>{TIPS[tip]}</p>
          <button type="button" className="x" aria-label="Dismiss tips" onClick={endTips}><Close /></button>
        </div>
      )}
    </div>
  )
}
