import { create } from 'zustand'
import { projects } from './data/projects'
import { hasWebGL } from './webgl'

export type View = 'launch' | 'flight' | 'list'
export type Quality = 'high' | 'low'

interface PortfolioState {
  view: View
  targetId: string | null // autopilot destination requested
  warping: boolean
  nearId: string | null // body the ship is close enough to dock with
  openId: string | null // body whose panel is open
  visited: string[] // project slugs whose panel was opened; persisted to localStorage 'mp:visited'
  muted: boolean
  quality: Quality
  setView(v: View): void
  warpTo(id: string): void
  cancelWarp(): void
  setWarping(b: boolean): void
  setNear(id: string | null): void
  openPanel(id: string): void
  closePanel(): void
  toggleMute(): void
  setQuality(q: Quality): void
}

const KEY = 'mp:visited'
const slugs = new Set(projects.map((p) => p.slug))

export function loadVisited(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string' && slugs.has(s)) : []
  } catch {
    return []
  }
}

export const usePortfolio = create<PortfolioState>((set, get) => ({
  view: hasWebGL() ? 'launch' : 'list',
  targetId: null,
  warping: false,
  nearId: null,
  openId: null,
  visited: loadVisited(),
  muted: true,
  quality: 'high',
  setView: (view) => set({ view }),
  warpTo: (id) => set({ targetId: id, openId: null }),
  cancelWarp: () => set({ targetId: null, warping: false }),
  setWarping: (warping) => set((s) => (s.warping === warping ? s : { warping })),
  setNear: (id) => set((s) => (s.nearId === id ? s : { nearId: id })),
  openPanel: (id) => {
    const { visited } = get()
    if (!slugs.has(id) || visited.includes(id)) return set({ openId: id })
    const next = [...visited, id]
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // storage unavailable (private mode): progress just won't persist
    }
    set({ openId: id, visited: next })
  },
  closePanel: () => set({ openId: null }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setQuality: (quality) => set({ quality }),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __portfolio: typeof usePortfolio }).__portfolio = usePortfolio
