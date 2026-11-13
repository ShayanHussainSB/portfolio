import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { journeyStory } from '../content'
import { progress, useProgressVar } from '../lib/scroll'
import { JourneyGallery } from './JourneyGallery'
import { CompressionExample, MissionExample, SdkExample, StreamExample } from './JourneyExamples'

const JourneyFlight = lazy(() => import('./JourneyFlight'))
const chapterThemes = ['light', 'dark', 'darker', 'darker', 'dark', 'light'] as const
const layers = [
  'Surface / collections',
  'Layer 01 / owned state',
  'Layer 02 / compressed records',
  'Layer 03 / indexing',
  'Back to the surface / developer tools',
  'The next chapter',
]
const Examples = [null, MissionExample, CompressionExample, StreamExample, SdkExample]

export function ChainJourney({ ctaHref }: { ctaHref: string }) {
  const pin = useRef<HTMLDivElement>(null)
  const [motion, setMotion] = useState(false),
    [current, setCurrent] = useState(0),
    [flight, setFlight] = useState(true),
    [near, setNear] = useState(false)
  const theme = chapterThemes[current]
  useProgressVar(pin)
  const fail = useCallback(() => setFlight(false), [])
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '600px' },
    )
    if (pin.current) io.observe(pin.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setMotion(!mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      if (pin.current) setCurrent(Math.min(5, Math.round(progress(pin.current) * 5)))
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', on)
      removeEventListener('resize', on)
    }
  }, [])
  const go = (i: number) => {
    const el = pin.current
    if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY + ((el.offsetHeight - innerHeight) * i) / 5, behavior: 'instant' })
  }
  return (
    <section className="journey journey--immersive" id="chain" data-motion={motion} data-theme={theme} aria-label="My Solana story">
      <div className="journey__pin" ref={pin}>
        <div className="journey__stage">
          {motion && near && flight && (
            <Suspense fallback={null}>
              <JourneyFlight onFail={fail} theme={theme} />
            </Suspense>
          )}
          <div className="journey__shade" />
          <nav className="journey__nav" aria-label="Chapters in my Solana story">
            {journeyStory.map((s, i) => (
              <button key={s.topic} onClick={() => go(i)} aria-current={i === current ? 'step' : undefined}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s.topic}
              </button>
            ))}
            <button onClick={() => go(5)} aria-current={current === 5 ? 'step' : undefined}>
              <span>06</span>What’s next?
            </button>
          </nav>
          <div className="journey__chapters">
            {journeyStory.map((s, i) => {
              const Example = Examples[i]
              return (
                <article key={s.title} className="journey__scene" data-active={i === current} inert={motion && i !== current ? true : undefined}>
                  <div className="journey__narration">
                    <h2>{s.title}</h2>
                    <p>{s.text}</p>
                    <p className="journey__detail">{s.detail}</p>
                    <p className="journey__mechanism">{s.mechanism}</p>
                    {i === 4 && (
                      <a className="btn" href={ctaHref}>
                        Let’s build what’s next
                      </a>
                    )}
                  </div>
                  <div className="journey__exhibit">{Example ? <Example /> : <JourneyGallery />}</div>
                </article>
              )
            })}
            <article className="journey__scene journey__outro" data-active={current === 5} inert={motion && current !== 5 ? true : undefined}>
              <div className="journey__outro-content">
                <p>From on-chain worlds to the systems behind every request.</p>
                <h2>
                  <span>What’s</span> <span>next?</span>
                </h2>
                <p>The same thinking. A different kind of traffic.</p>
                <a href="#work">
                  Meet hitlimit <span aria-hidden="true">↓</span>
                </a>
                <div className="journey__handoff" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <b>200</b>
                </div>
              </div>
            </article>
          </div>
          <div className="journey__footer">
            <span>{layers[current]}</span>
            {motion && flight && <span className="journey__animation-hint">Click to send a transaction</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
