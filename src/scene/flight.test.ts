import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  ARENA_RADIUS, clampArena, createWarp, evalWarp, pushOutside, standoffFor, warpDuration,
} from './flight'

const finite = (v: Vector3) => [v.x, v.y, v.z].every(Number.isFinite)

describe('warp path', () => {
  const from = new Vector3(0, 0, 32)
  const target = new Vector3(40, 0, -10)
  const standoff = standoffFor('planet', 2.4)

  it('starts at the origin point and ends at standoff distance from the target', () => {
    const w = createWarp(from, target, standoff, 1, false, 0)!
    const pos = new Vector3()
    const heading = new Vector3()
    evalWarp(w, target, 0, pos, heading)
    expect(pos.distanceTo(from)).toBeLessThan(1e-6)
    evalWarp(w, target, 1, pos, heading)
    expect(pos.distanceTo(target)).toBeCloseTo(standoff, 6)
    expect(finite(heading)).toBe(true)
  })

  it('tracks a target that moved', () => {
    const w = createWarp(from, target, standoff, -1, false, 0)!
    const moved = target.clone().add(new Vector3(8, 0, 5))
    const pos = new Vector3()
    evalWarp(w, moved, 1, pos, new Vector3())
    expect(pos.distanceTo(moved)).toBeCloseTo(standoff, 6)
  })

  it('has no NaN when from and target coincide', () => {
    const p = new Vector3(5, 0, 5)
    const w = createWarp(p, p.clone(), standoff, 1, false, 0)!
    expect(w).not.toBeNull()
    const pos = new Vector3()
    const heading = new Vector3()
    for (const u of [0, 0.3, 0.7, 1]) {
      evalWarp(w, p, u, pos, heading)
      expect(finite(pos) && finite(heading)).toBe(true)
    }
  })

  it('returns null when already at the arrival point', () => {
    const near = target.clone().add(new Vector3(standoff, 0, 0))
    expect(createWarp(near, target, standoff, 1, false, 0)).toBeNull()
  })

  it('clamps duration to 3-5.2 s, ~0 under reduced motion', () => {
    expect(warpDuration(1, false)).toBe(3)
    expect(warpDuration(1000, false)).toBe(5.2)
    expect(warpDuration(50, false)).toBeGreaterThan(3)
    expect(warpDuration(50, false)).toBeLessThan(5.2)
    expect(warpDuration(50, true)).toBeLessThan(0.05)
  })
})

describe('bounds', () => {
  it('keep-out pushes the ship outside the radius, even when centred', () => {
    const c = new Vector3(10, 0, 0)
    const p = new Vector3(11, 0.5, 0)
    expect(pushOutside(p, c, 4)).toBe(true)
    expect(p.distanceTo(c)).toBeCloseTo(4, 6)
    const q = c.clone()
    pushOutside(q, c, 4)
    expect(finite(q)).toBe(true)
    expect(q.distanceTo(c)).toBeCloseTo(4, 6)
    expect(pushOutside(new Vector3(30, 0, 0), c, 4)).toBe(false)
  })

  it('arena clamp caps the distance from the sun', () => {
    const p = new Vector3(300, 0, 0)
    clampArena(p)
    expect(p.length()).toBeCloseTo(ARENA_RADIUS, 6)
  })
})
