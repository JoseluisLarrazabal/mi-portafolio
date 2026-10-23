import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import type { Project } from '../data/projects'
import { usePortfolio } from '../store'
import { getDest, imgDims, KIND_LABEL, LINK_DEFS, type Dest } from './data'
import { ArrowUpRight, Close, Copy } from './icons'

const FOCUSABLE = 'button:not([disabled]),a[href],input,textarea,select,[tabindex]:not([tabindex="-1"])'

export function DockPanel() {
  const openId = usePortfolio((s) => s.openId)
  const dest = openId ? getDest(openId) : undefined
  if (!dest) return null
  return <Panel key={dest.id} dest={dest} />
}

function Panel({ dest }: { dest: Dest }) {
  const closePanel = usePortfolio((s) => s.closePanel)
  const root = useRef<HTMLElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const zoomOpener = useRef<HTMLElement | null>(null)
  const openZoom = (z: { src: string; alt: string }) => {
    zoomOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setZoom(z)
  }
  const closeZoom = () => setZoom(null)
  // Focus returns after the panel is no longer inert.
  useEffect(() => {
    if (!zoom) zoomOpener.current?.focus()
  }, [zoom])
  const project = dest.project

  // Focus in on open, back to the opener (or its destination chip) on close.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeBtn.current?.focus()
    return () => {
      if (opener && opener.isConnected && opener !== document.body && opener.offsetParent !== null) opener.focus()
      else document.querySelector<HTMLElement>(`[data-dest="${dest.id}"]`)?.focus()
    }
  }, [dest.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (zoomRef.current) closeZoom()
        else closePanel()
        return
      }
      if (e.key !== 'Tab') return
      const scope = document.querySelector<HTMLElement>('.lightbox') ?? root.current
      if (!scope) return
      const f = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const active = document.activeElement
      if (!scope.contains(active)) { e.preventDefault(); first.focus() }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePanel])

  return (
    <>
      <aside ref={root} className="panel" role="dialog" aria-modal="true" aria-labelledby="panelTitle" tabIndex={-1} inert={zoom !== null}>
        <div className="shell">
          <div className="core">
            <div className="p-head">
              <div className="orb" style={{ background: dest.gradient, ['--pa' as string]: dest.glow }} aria-hidden="true" />
              <div>
                <p className="p-type">{dest.type}</p>
                <h2 id="panelTitle">{dest.name}</h2>
              </div>
              <button ref={closeBtn} type="button" className="x" aria-label="Close panel" onClick={closePanel}><Close /></button>
            </div>
            {project ? <ProjectBody p={project} onZoom={openZoom} /> : dest.id === 'about' ? <AboutBody /> : <ContactBody />}
          </div>
        </div>
      </aside>
      {zoom && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={closeZoom}>
          <button type="button" className="x" aria-label="Close image" autoFocus onClick={closeZoom}><Close /></button>
          <img src={zoom.src} alt={zoom.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

function ProjectBody({ p, onZoom }: { p: Project; onZoom: (z: { src: string; alt: string }) => void }) {
  const links = LINK_DEFS.filter((l) => p.links[l.key])
  return (
    <>
      <p className="p-tag">{p.tagline}</p>
      <p className="p-sum">{p.summary}</p>
      <dl className="meta">
        <dt>Type</dt><dd>{KIND_LABEL[p.kind]}</dd>
        <dt>Client</dt><dd>{p.client}</dd>
        <dt>Role</dt><dd>{p.role}</dd>
        <dt>Year</dt><dd>{p.year}</dd>
      </dl>
      <h3>Stack</h3>
      <ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
      <h3>Highlights</h3>
      <ul className="feat">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
      {p.images.length > 0 && (
        <>
          <h3>Screens</h3>
          <ul className="gallery">
            {p.images.map((im) => (
              <li key={im.src}>
                <button type="button" aria-label={`Enlarge image: ${im.alt}`} onClick={() => onZoom(im)}>
                  <img src={im.src} alt="" loading="lazy" decoding="async" {...imgDims(im.src)} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {links.length > 0 && (
        <div className="actions-col push">
          {links.map((l) => (
            <a key={l.key} className="btn-primary" href={p.links[l.key]} target="_blank" rel="noopener noreferrer">
              {l.label}
              <span className="sr"> (opens in a new tab)</span>
              <span className="ico" aria-hidden="true"><ArrowUpRight /></span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}

const SKILL_LABELS: Record<keyof typeof profile.skills, string> = {
  languages: 'Languages',
  frameworks: 'Frameworks',
  data: 'Data',
  cloud: 'Cloud',
  design: 'Design',
}

function AboutBody() {
  return (
    <>
      <p className="p-tag">{profile.title}</p>
      <p className="p-sum">{profile.bio}</p>
      <dl className="meta">
        <dt>Based</dt><dd>{profile.location}</dd>
        <dt>Education</dt><dd>{profile.education}</dd>
        <dt>Languages</dt><dd>{profile.languages.join(', ')}</dd>
      </dl>
      <h3>Skills</h3>
      <dl className="skills">
        {(Object.keys(profile.skills) as (keyof typeof profile.skills)[]).map((k) => (
          <div key={k}>
            <dt>{SKILL_LABELS[k]}</dt>
            <dd><ul className="chips">{profile.skills[k].map((s) => <li key={s}>{s}</li>)}</ul></dd>
          </div>
        ))}
      </dl>
    </>
  )
}

function ContactBody() {
  const { email, github, linkedin } = profile.contact
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <>
      <p className="p-sum">Got a product, a platform or a hard problem? Send a note and I will reply.</p>
      <div className="copy-row">
        <a className="btn-primary" href={`mailto:${email}`}>
          {email}
          <span className="ico" aria-hidden="true"><ArrowUpRight /></span>
        </a>
        <button type="button" className="chip-btn" onClick={copy}>
          <Copy />
          {copied ? 'Copied' : 'Copy email'}
        </button>
        <span className="sr" role="status">{copied ? 'Email copied to clipboard' : ''}</span>
      </div>
      <div className="actions-col">
        <a className="chip-btn" href={github} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr"> (opens in a new tab)</span>
          <ArrowUpRight />
        </a>
        {linkedin && (
          <a className="chip-btn" href={linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn<span className="sr"> (opens in a new tab)</span>
            <ArrowUpRight />
          </a>
        )}
      </div>
    </>
  )
}
