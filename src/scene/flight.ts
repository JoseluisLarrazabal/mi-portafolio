import { Vector3 } from 'three'

export type Kind = 'sun' | 'planet' | 'station'

export const ARENA_RADIUS = 125
const UP = new Vector3(0, 1, 0)

export const standoffFor = (kind: Kind, radius: number) =>
  radius + (kind === 'sun' ? 9 : kind === 'station' ? 6 : 6.5)
export const keepOutFor = (kind: Kind, radius: number) => radius + (kind === 'sun' ? 3 : 1.6)
// distance from the surface within which the dock prompt shows
export const dockRange = (kind: Kind) => (kind === 'sun' ? 14 : 9)

export const warpDuration = (distance: number, reduced: boolean) =>
  reduced ? 0.01 : Math.min(5.2, Math.max(3, 2.4 + distance * 0.035))

export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Orbit position on the XZ plane; orbit 0 sits at the origin. */
export function orbitPosition(out: Vector3, orbit: number, phase: number, speed: number, clock: number) {
  const a = phase + speed * 0.6 * clock
  return out.set(Math.cos(a) * orbit, 0, Math.sin(a) * orbit)
}

export interface WarpPath {
  from: Vector3
  dir: Vector3 // unit vector from target to the arrival point
  standoff: number
  off: Vector3 // bezier control-point side offset
  dur: number
  t0: number
}

/** Returns null when the ship is already at the arrival point. */
export function createWarp(
  from: Vector3,
  target: Vector3,
  standoff: number,
  side: 1 | -1,
  reduced: boolean,
  t0: number,
): WarpPath | null {
  const dir = from.clone().sub(target).setY(0)
  if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1)
  dir.normalize()
  const end = target.clone().addScaledVector(dir, standoff)
  const D = from.distanceTo(end)
  if (D < 3) return null
  const off = new Vector3(-(end.z - from.z), 0, end.x - from.x).normalize().multiplyScalar(side * D * 0.2)
  off.y = D * 0.08
  return { from: from.clone(), dir, standoff, off, dur: warpDuration(D, reduced), t0 }
}

const _end = new Vector3()
const _p1 = new Vector3()
const _tan = new Vector3()
const _look = new Vector3()

/** Position and heading on the path at progress u (0..1); the target may have moved. */
export function evalWarp(path: WarpPath, target: Vector3, u: number, outPos: Vector3, outHeading: Vector3) {
  const e = ease(u)
  const a = 1 - e
  _end.copy(target).addScaledVector(path.dir, path.standoff)
  _p1.copy(path.from).add(_end).multiplyScalar(0.5).add(path.off)
  outPos.copy(path.from).multiplyScalar(a * a).addScaledVector(_p1, 2 * a * e).addScaledVector(_end, e * e)
  _tan.copy(_p1).sub(path.from).multiplyScalar(2 * a).addScaledVector(_end.sub(_p1), 2 * e)
  if (_tan.lengthSq() < 1e-8) return outHeading
  _tan.normalize()
  _look.copy(target).sub(outPos)
  if (_look.lengthSq() < 1e-8) return outHeading.copy(_tan)
  _look.normalize()
  const k = Math.max(0, Math.min(1, (u - 0.68) / 0.32))
  return outHeading.copy(_tan).lerp(_look, k * k * (3 - 2 * k)).normalize()
}

export interface FreeState {
  pos: Vector3
  heading: Vector3
  speed: number
  bank: number
}

/** thrust and turn are -1..1; turn > 0 steers left. */
export function stepFree(s: FreeState, thrust: number, turn: number, boost: boolean, dt: number) {
  s.heading.applyAxisAngle(UP, turn * 1.5 * dt).normalize()
  const target = thrust > 0 ? thrust * (boost ? 52 : 17) : thrust < 0 ? thrust * 6 : 0
  s.speed += (target - s.speed) * Math.min(1, dt * (thrust ? 1.6 : 0.9))
  s.pos.addScaledVector(s.heading, s.speed * dt)
  s.bank += (-turn * 0.5 - s.bank) * Math.min(1, dt * 4)
}

/** Pushes pos out of the sphere; returns true when it had to move. */
export function pushOutside(pos: Vector3, center: Vector3, min: number) {
  const dx = pos.x - center.x
  const dy = pos.y - center.y
  const dz = pos.z - center.z
  const d = Math.hypot(dx, dy, dz)
  if (d >= min) return false
  if (d < 1e-4) pos.set(center.x, center.y, center.z + min)
  else pos.set(center.x + (dx / d) * min, center.y + (dy / d) * min, center.z + (dz / d) * min)
  return true
}

export function clampArena(pos: Vector3) {
  if (pos.length() > ARENA_RADIUS) pos.setLength(ARENA_RADIUS)
  if (Math.abs(pos.y) > 14) pos.y *= 0.98
}
