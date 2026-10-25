import { afterEach, describe, expect, it, vi } from 'vitest'
import { projects } from './data/projects'
import { loadVisited, usePortfolio } from './store'

const stubStorage = (impl: Partial<Storage>) => vi.stubGlobal('localStorage', impl)

afterEach(() => {
  vi.unstubAllGlobals()
  usePortfolio.setState({ visited: [], openId: null })
})

describe('loadVisited', () => {
  it.each([
    ['corrupt JSON', '{not json'],
    ['a non-array', '{"a":1}'],
    ['wrong types', '[1,null,{"x":1}]'],
    ['unknown slugs', '["nope","also-nope"]'],
  ])('returns [] for %s', (_, raw) => {
    stubStorage({ getItem: () => raw })
    expect(loadVisited()).toEqual([])
  })

  it('keeps only known slugs', () => {
    stubStorage({ getItem: () => JSON.stringify([projects[0].slug, 'nope', 3]) })
    expect(loadVisited()).toEqual([projects[0].slug])
  })

  it('returns [] when storage throws', () => {
    stubStorage({ getItem: () => { throw new Error('blocked') } })
    expect(loadVisited()).toEqual([])
  })
})

describe('openPanel', () => {
  it('still updates visited in memory when setItem throws', () => {
    stubStorage({ setItem: () => { throw new Error('quota') } })
    const id = projects[0].slug
    expect(() => usePortfolio.getState().openPanel(id)).not.toThrow()
    expect(usePortfolio.getState().openId).toBe(id)
    expect(usePortfolio.getState().visited).toEqual([id])
  })
})
