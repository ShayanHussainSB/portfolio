import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { pingEdge, sky, summarize } from '../lib/conditions'
import { fallbackSrc, srcSet } from '../lib/photos'

type Reading = { state: 'pending' } | { state: 'unknown' } | { state: 'done'; samples: number[] }

/** About: who he is, his portrait in the page's one ink, and five real round trips to the edge. */
export function EdgeStop({ region }: { region: string | null }) {
  const e = content.stops.edge
  const c = e.conditions
  const [reading, setReading] = useState<Reading>({ state: 'pending' })
  const [busy, setBusy] = useState(false)
  const root = useRef<HTMLElement>(null)

  const measure = async () => {
    setBusy(true)
    setReading({ state: 'pending' })
    const samples = await pingEdge()
    setBusy(false)
    setReading(samples ? { state: 'done', samples } : { state: 'unknown' })
  }

  // measure the first time the section comes into view (not on page load)
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        void measure()
      },
      { threshold: 0.25 },
    )
    if (root.current) io.observe(root.current)
    return () => io.disconnect()
  }, [])

  const s = reading.state === 'done' ? summarize(reading.samples) : null
  const skyWord = s ? c.sky[sky(s.jitter)] : null

  return (
    <section className="about" id="about" ref={root} aria-labelledby="about-title">
      <figure className="duo about__portrait">
        <picture>
          <source type="image/avif" srcSet={srcSet('portrait', 'avif')} sizes="(max-width: 760px) 90vw, 32vw" />
          <source type="image/webp" srcSet={srcSet('portrait', 'webp')} sizes="(max-width: 760px) 90vw, 32vw" />
          <img src={fallbackSrc('portrait')} alt={e.portraitAlt} loading="lazy" decoding="async" width={1200} height={1500} />
        </picture>
      </figure>
      <div className="about__copy">
        <h2 id="about-title">{e.headline}</h2>
        <p className="about__lede">{e.sentence}</p>
        <ul className="about__bio">
          {e.bio.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <div className="cond">
          <h3>{c.title}</h3>
          {reading.state === 'pending' && <p className="cond__line">{c.measuring}</p>}
          {reading.state === 'unknown' && <p className="cond__line">{c.unknown}</p>}
          {s && reading.state === 'done' && (
            <>
              <p className="cond__line mono">
                edge {region ?? 'unnamed'}, {c.rtt} {s.median} ms, {c.jitter.toLowerCase()} {s.jitter} ms, <mark>{skyWord}</mark>
              </p>
              <Dimension samples={reading.samples} min={s.min} max={s.max} />
            </>
          )}
          <p className="sr-only" aria-live="polite">
            {s ? c.announce(s.median, s.jitter, skyWord!) : reading.state === 'unknown' ? c.unknown : ''}
          </p>
          <button type="button" className="btn" onClick={measure} disabled={busy}>
            {c.again}
          </button>
        </div>
      </div>
    </section>
  )
}

/** A dimension line from the fastest to the slowest ping; each tick is one of the visitor's own samples. */
function Dimension({ samples, min, max }: { samples: number[]; min: number; max: number }) {
  const [x0, x1] = [12, 288]
  const x = (v: number) => (max === min ? 150 : x0 + ((v - min) / (max - min)) * (x1 - x0))
  return (
    <svg className="dim" viewBox="0 0 300 34" aria-hidden="true">
      <line x1={x0} y1="12" x2={x1} y2="12" className="dim__line" />
      <path d={`M${x0} 6v12M${x1} 6v12`} className="dim__line" />
      {samples.map((v, i) => (
        <line key={i} x1={x(v)} y1="4" x2={x(v)} y2="20" className="dim__tick" />
      ))}
      <text x={x0} y="32" className="dim__label">
        {min} ms
      </text>
      <text x={x1} y="32" textAnchor="end" className="dim__label">
        {max} ms
      </text>
    </svg>
  )
}
