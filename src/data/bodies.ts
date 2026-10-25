import { profile } from './profile'
import { projects, type Project } from './projects'

export type BodyId = string
export interface Body {
  id: BodyId
  kind: 'sun' | 'planet' | 'station'
  name: string
  radius: number
  project?: Project
}

export const bodies: Body[] = [
  { id: 'about', kind: 'sun', name: profile.name, radius: 5 },
  ...projects.map((p): Body => ({ id: p.slug, kind: 'planet', name: p.title, radius: p.planet.radius, project: p })),
  { id: 'contact', kind: 'station', name: 'Contact', radius: 3.4 },
]

export const getBody = (id: BodyId): Body | undefined => bodies.find((b) => b.id === id)
