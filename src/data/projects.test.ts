import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { projects } from './projects'

const HEX = /^#[0-9a-fA-F]{6}$/

describe('projects data', () => {
  it('has unique slugs', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length)
  })

  it.each(projects)('$slug has its required fields', (p) => {
    for (const k of ['slug', 'title', 'client', 'role', 'year', 'tagline', 'summary'] as const) {
      expect(p[k].trim(), k).not.toBe('')
    }
    expect(p.features.length).toBeGreaterThan(0)
    expect(p.stack.length).toBeGreaterThan(0)
    expect(p.images.length).toBeGreaterThan(0)
    for (const c of [p.planet.base, p.planet.accent, p.planet.ring]) if (c !== undefined) expect(c).toMatch(HEX)
    expect(p.planet.speed).toBeGreaterThan(0)
  })

  it('keeps orbits increasing with room for both planets', () => {
    for (let i = 1; i < projects.length; i++) {
      const a = projects[i - 1].planet
      const b = projects[i].planet
      expect(b.orbit, projects[i].slug).toBeGreaterThan(a.orbit)
      expect(b.orbit - a.orbit, projects[i].slug).toBeGreaterThanOrEqual(a.radius + b.radius + 2)
    }
  })

  it.each(projects)('$slug images live under its folder and exist', (p) => {
    for (const img of p.images) {
      expect(img.src.startsWith(`/projects/${p.slug}/`), img.src).toBe(true)
      expect(existsSync(join(process.cwd(), 'public', img.src)), img.src).toBe(true)
      expect(img.alt.trim(), img.src).not.toBe('')
    }
  })
})
