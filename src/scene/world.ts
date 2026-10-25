import { Vector3, type Object3D, type Sprite } from 'three'
import { bodies, type Body } from '../data/bodies'
import type { WarpPath } from './flight'

const mq = (q: string) => typeof matchMedia !== 'undefined' && matchMedia(q).matches
export const reduced = mq('(prefers-reduced-motion: reduce)')
export const coarse = mq('(pointer: coarse)')

export const STATION_ORBIT = 100
const STATION_PHASE = -0.6

export interface Orbiter {
  body: Body
  orbit: number
  speed: number
  phase: number
  pos: Vector3
}

// golden-angle spread so the planets never line up
export const orbiters: Orbiter[] = bodies.map((body, i) => {
  const pl = body.project?.planet
  return {
    body,
    orbit: pl ? pl.orbit : body.kind === 'station' ? STATION_ORBIT : 0,
    speed: pl ? pl.speed : 0,
    phase: pl ? 0.9 + i * 2.399963 : body.kind === 'station' ? STATION_PHASE : 0,
    pos: new Vector3(),
  }
})
export const orbiterById = (id: string) => orbiters.find((o) => o.body.id === id)

export type Mode = 'intro' | 'free' | 'warp' | 'hold'

// Mutable scene state shared between components; read every frame, never via React state.
export const world = {
  groups: {} as Record<string, Object3D | null>,
  labels: {} as Record<string, HTMLElement | null>,
  hover: null as string | null,
  clk: 0, // seconds, always running
  t: 0, // animation time, frozen under reduced motion
  orbitClock: 0,
  ship: {
    obj: null as Object3D | null,
    body: null as Object3D | null,
    flame: null as Sprite | null,
    pos: new Vector3(0, 0, 32),
    heading: new Vector3(0, 0, -1),
    speed: 0,
    bank: 0,
    mode: 'intro' as Mode,
    warp: null as WarpPath | null,
    warpId: null as string | null,
    holdId: null as string | null,
    holdOff: new Vector3(),
  },
  keys: { w: false, s: false, a: false, d: false, shift: false },
}
