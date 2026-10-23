import { useEffect, useRef } from 'react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { usePortfolio } from '../store'
import { hasWebGL } from '../webgl'
import { imgDims, KIND_LABEL, LINK_DEFS } from './data'
import { ArrowRight, ArrowUpRight } from './icons'

const SKILL_LABELS = { languages: 'Languages', frameworks: 'Frameworks', data: 'Data', cloud: 'Cloud', design: 'Design' } as const

export function ListMode() {
  const view = usePortfolio((s) => s.view)
  if (view !== 'list') return null
  return <ListInner />
}

function ListInner() {
  const setView = usePortfolio((s) => s.setView)
  const title = useRef<HTMLHeadingElement>(null)
  const { email, github, linkedin } = profile.contact

  useEffect(() => { title.current?.focus() }, [])

  // In-page anchors: scroll, then move focus to the section heading so keyboard and screen-reader users follow.
  const go = (id: string) => (e: React.MouseEvent) => {
    const h = document.getElementById(id)
    if (!h) return
    e.preventDefault()
    h.scrollIntoView({ block: 'start' })
    h.focus({ preventScroll: true })
  }

  return (
    <main className="listview" aria-labelledby="lvTitle">
      <div className="lv">
        <header>
          <h1 id="lvTitle" tabIndex={-1} ref={title}>{profile.name}</h1>
          <p className="sub">{profile.title} / {profile.location}</p>
        </header>
        <nav aria-label="Sections" className="nav-top">
          <a className="link-btn" href="#lv-about" onClick={go('lv-about-h')}>About</a>
          <a className="link-btn" href="#lv-projects" onClick={go('lv-projects-h')}>Projects</a>
          <a className="link-btn" href="#lv-contact" onClick={go('lv-contact-h')}>Contact</a>
        </nav>
        {hasWebGL() && (
          <div className="row">
            <button type="button" className="btn-primary sm" onClick={() => setView('launch')}>
              Fly through the system
              <span className="ico" aria-hidden="true"><ArrowRight /></span>
            </button>
          </div>
        )}

        <section id="lv-about" aria-labelledby="lv-about-h">
          <h2 id="lv-about-h" tabIndex={-1}>About</h2>
          <p>{profile.bio}</p>
          <ul>
            <li>Education: {profile.education}</li>
            <li>Languages: {profile.languages.join(', ')}</li>
          </ul>
          {(Object.keys(profile.skills) as (keyof typeof profile.skills)[]).map((k) => (
            <div key={k}>
              <h3>{SKILL_LABELS[k]}</h3>
              <ul className="chips">{profile.skills[k].map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          ))}
        </section>

        <section id="lv-projects" aria-labelledby="lv-projects-h">
          <h2 id="lv-projects-h" tabIndex={-1}>Projects</h2>
          {projects.map((p) => {
            const links = LINK_DEFS.filter((l) => p.links[l.key])
            const img = p.images[0]
            const dims = img ? imgDims(img.src) : null
            return (
              <article key={p.slug} aria-labelledby={`lv-${p.slug}`}>
                <span className="tag">{KIND_LABEL[p.kind]}</span>
                <h3 id={`lv-${p.slug}`} className="ar-title">{p.title}</h3>
                <p>{p.tagline}</p>
                <p>{p.summary}</p>
                <ul>
                  <li>Client: {p.client}</li>
                  <li>Role: {p.role}</li>
                  <li>Year: {p.year}</li>
                </ul>
                <ul className="chips" aria-label="Stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                {img && dims && (
                  <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className={dims.height > dims.width ? 'tall' : undefined} {...dims} />
                )}
                {links.length > 0 && (
                  <div className="row">
                    {links.map((l) => (
                      <a key={l.key} className="btn-primary sm" href={p.links[l.key]} target="_blank" rel="noopener noreferrer">
                        {l.label}
                        <span className="sr"> (opens in a new tab)</span>
                        <span className="ico" aria-hidden="true"><ArrowUpRight /></span>
                      </a>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </section>

        <section id="lv-contact" aria-labelledby="lv-contact-h">
          <h2 id="lv-contact-h" tabIndex={-1}>Contact</h2>
          <ul className="contact">
            <li><a href={`mailto:${email}`}>{email}</a></li>
            <li><a href={github} target="_blank" rel="noopener noreferrer">GitHub<span className="sr"> (opens in a new tab)</span></a></li>
            {linkedin && <li><a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr"> (opens in a new tab)</span></a></li>}
          </ul>
        </section>
      </div>
    </main>
  )
}
