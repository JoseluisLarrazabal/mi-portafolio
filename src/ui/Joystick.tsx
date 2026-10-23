import { useEffect, useRef } from 'react'
import { input } from '../input'
import { usePortfolio } from '../store'
import { useMedia } from './useMedia'

const R = 48 // max knob travel in px

export function Joystick() {
  const view = usePortfolio((s) => s.view)
  const openId = usePortfolio((s) => s.openId)
  const coarse = useMedia('(pointer: coarse)')
  const pad = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const pid = useRef<number | null>(null)

  const show = coarse && view === 'flight' && openId === null
  useEffect(() => {
    if (show) return
    pid.current = null
    input.joyX = input.joyY = 0
  }, [show])
  if (!show) return null

  const move = (e: React.PointerEvent) => {
    if (e.pointerId !== pid.current || !pad.current || !knob.current) return
    const r = pad.current.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    input.joyX = dx / R
    input.joyY = -dy / R
  }
  const end = (e: React.PointerEvent) => {
    if (e.pointerId !== pid.current) return
    pid.current = null
    if (knob.current) knob.current.style.transform = ''
    input.joyX = input.joyY = 0
  }

  return (
    <div
      ref={pad}
      className="joy"
      aria-hidden="true"
      onPointerDown={(e) => {
        if (pid.current !== null) return
        pid.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div ref={knob} className="joy-knob" />
    </div>
  )
}
