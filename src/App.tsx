import { useEffect, useState } from 'react'
import { content } from './content'
import { AllWork, Index } from './components/AllWork'
import { ChainJourney } from './components/ChainJourney'
import { EdgeStop } from './components/EdgeStop'
import { Hero } from './components/Hero'
import { HitlimitStop } from './components/HitlimitStop'
import { QuarryStop } from './components/QuarryStop'
import { RecordStop } from './components/RecordStop'
import { Response } from './components/Response'
import { Scene } from './components/Scene'
import { ScrollerStop } from './components/ScrollerStop'
import { Terminal } from './components/Terminal'
import { fetchObservation, replyHref, type Observation } from './lib/observe'

// the three on the main page (content.featured); the "See all" screen has every project
const FEATURED = { hitlimit: HitlimitStop, quarry: QuarryStop, scroller: ScrollerStop }

/** `#all` opens the "See all" screen; `#all-<project>` opens it at that project. */
const allTarget = () =>
  /^#all(?:-(\w+))?$/
    .exec(location.hash)
    ?.slice(1)
    .map((id) => id ?? 'all')[0] ?? null

export function App() {
  const [obs, setObs] = useState<Observation | null>(null)
  const [all, setAll] = useState<string | null>(null)
  const [term, setTerm] = useState(false)
  useEffect(() => {
    let alive = true
    void fetchObservation().then((o) => alive && setObs(o))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    const sync = () => setAll(allTarget())
    sync()
    addEventListener('hashchange', sync)
    // ` drops the terminal, from anywhere but another text field
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== '`' || e.metaKey || e.ctrlKey || e.altKey) return
      if (el.matches('input, textarea, [contenteditable]') && !el.closest('.term')) return
      e.preventDefault()
      setTerm((on) => !on)
    }
    addEventListener('keydown', key)
    return () => {
      removeEventListener('hashchange', sync)
      removeEventListener('keydown', key)
    }
  }, [])
  const closeAll = () => {
    if (allTarget()) history.replaceState(null, '', location.pathname + location.search)
    setAll(null)
  }
  const open = (id: string) => {
    setTerm(false)
    location.hash = id in FEATURED ? id : id === 'all' ? 'all' : `all-${id}`
  }
  const ctaHref = replyHref(content.person.email, obs?.id, obs?.city)
  return (
    <>
      <a className="skip-link" href="#main">
        {content.skipLink}
      </a>
      <header className="site-header">
        <a href="#top" className="site-header__name">
          {content.person.name}
        </a>
        <nav aria-label="Main navigation">
          <a href="#work">{content.nav.work}</a>
          <a href="#about">{content.nav.about}</a>
          <button
            type="button"
            className="site-header__term mono"
            onClick={() => setTerm(true)}
            aria-label={content.terminal.button}
            title={`${content.terminal.button} ( \` )`}
          >
            &gt;_
          </button>
          <a href={ctaHref} className="site-header__cta">
            {content.nav.contact}
          </a>
        </nav>
      </header>
      <main id="main">
        <Hero obs={obs} />
        <EdgeStop region={obs?.region ?? null} />
        <ChainJourney ctaHref={ctaHref} />
        <div className="work" id="work">
          {content.featured.map((id) => {
            const Stop = FEATURED[id]
            return (
              <Scene key={id} id={id}>
                <Stop />
              </Scene>
            )
          })}
          <Index />
        </div>
        <RecordStop ctaHref={ctaHref} />
        <Response obs={obs} ctaHref={ctaHref} />
      </main>
      <AllWork target={all} onClose={closeAll} />
      <Terminal open={term} who={{ city: obs?.city ?? 'somewhere', id: obs?.id ?? '0000' }} mailHref={ctaHref} onClose={() => setTerm(false)} onOpen={open} />
    </>
  )
}
