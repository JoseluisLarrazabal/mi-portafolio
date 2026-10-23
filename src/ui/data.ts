import { profile } from '../data/profile'
import { projects, type Project, type ProjectKind } from '../data/projects'

export interface Dest {
  id: string
  name: string
  type: string
  gradient: string
  glow: string
  project?: Project
}

export const KIND_LABEL: Record<ProjectKind, string> = {
  client: 'Client work',
  product: 'Product',
  design: 'Design exploration',
}

const grad = (hi: string, lo: string) => `radial-gradient(circle at 32% 30%, ${hi}, ${lo} 70%)`

const about: Dest = { id: 'about', name: profile.name, type: 'About', gradient: grad('#fff0c8', '#ffb36b'), glow: '#ffb36b' }
const contact: Dest = { id: 'contact', name: 'Contact', type: 'Space station', gradient: grad('#e6ecf8', '#7f8aa3'), glow: '#9db4ff' }

const projectDests: Dest[] = projects.map((p) => ({
  id: p.slug,
  name: p.title,
  type: KIND_LABEL[p.kind],
  gradient: grad(p.planet.accent, p.planet.base),
  glow: p.planet.accent,
  project: p,
}))

const all = [about, ...projectDests, contact]
export const getDest = (id: string) => all.find((d) => d.id === id)

export const groups: { title: string; items: Dest[] }[] = [
  { title: 'About', items: [about] },
  { title: 'Client work', items: projectDests.filter((d) => d.project?.kind === 'client') },
  { title: 'Products', items: projectDests.filter((d) => d.project?.kind === 'product') },
  { title: 'Design explorations', items: projectDests.filter((d) => d.project?.kind === 'design') },
  { title: 'Contact', items: [contact] },
].filter((g) => g.items.length)

// Intrinsic sizes of the assets in /public/projects (prevents layout shift). Default is the desktop capture.
const DIMS: Record<string, [number, number]> = {
  'mobile.webp': [390, 844],
  'chat.webp': [540, 1170],
  'orders.webp': [540, 1170],
  'cover.webp': [1200, 630],
  '/projects/reeteil/hero.webp': [1024, 500],
  '/projects/reeteil/logo.webp': [1279, 1080],
  '/projects/quivo/logo.webp': [1600, 652],
  '/projects/destiny-barber/logo.webp': [512, 512],
}
export function imgDims(src: string): { width: number; height: number } {
  const [width, height] = DIMS[src] ?? DIMS[src.split('/').pop() ?? ''] ?? [1440, 900]
  return { width, height }
}

export const LINK_DEFS = [
  { key: 'live', label: 'Visit live site' },
  { key: 'store', label: 'Get it on Google Play' },
  { key: 'figma', label: 'View in Figma' },
] as const
