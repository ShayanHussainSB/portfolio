import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { content } from '../content'
import { bf, HIRE } from '../lib/bf'

const r = content.stops.record
const format = (n: number, to: number) => (Number.isInteger(to) ? Math.round(n).toLocaleString('en') : n.toFixed(1))

/** A figure that counts up to its value the first time it is seen. Renders the final value until then (and without JavaScript). */
function Count({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLElement>(null)
  const [n, setN] = useState(to)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 1400)
        setN(to * (1 - (1 - k) ** 4))
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current!)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to])
  return (
    <b ref={ref}>
      {format(n, to)}
      {suffix}
    </b>
  )
}

const ask = r.ask
const PROGRAMS = { HIRE }

/** One answer written in Brainfuck: the program, and a button that really runs it. */
function Program({ code }: { code: string }) {
  const [out, setOut] = useState<string | null>(null)
  return (
    <div className="ask__bf">
      <pre className="mono">{code}</pre>
      {out === null ? (
        <button type="button" className="btn" onClick={() => setOut(bf(code))}>
          {ask.run}
        </button>
      ) : (
        <output aria-live="polite">
          {[...out].map((ch, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties}>
              {ch}
            </i>
          ))}
        </output>
      )}
    </div>
  )
}

/**
 * Why him, as a conversation: the visitor picks questions and the site answers for Shayan, one of them in
 * Brainfuck that runs on the spot. Then the numbers behind it. CV and testimonials render once they exist in content.ts.
 */
export function RecordStop({ ctaHref }: { ctaHref: string }) {
  const [asked, setAsked] = useState<number[]>([])
  const left = ask.questions.map((_, i) => i).filter((i) => !asked.includes(i))
  return (
    <section id="record" aria-labelledby="record-title">
      <div className="ask">
        <header>
          <p className="ask__tag mono">{r.title}</p>
          <h2 id="record-title">{ask.headline}</h2>
          <p>{ask.sub}</p>
        </header>
        <div className="ask__talk">
          <ol role="log" aria-label={ask.logLabel}>
            <li data-from="site">
              <b className="mono">{ask.site}</b>
              <p>{ask.opening}</p>
            </li>
            {asked.map((i) => {
              const x = ask.questions[i]
              return (
                <Fragment key={i}>
                  <li data-from="you">
                    <b className="mono">{ask.you}</b>
                    <p>{x.q}</p>
                  </li>
                  <li data-from="site">
                    <b className="mono">{ask.site}</b>
                    <p>{x.a}</p>
                    {x.code && <Program code={PROGRAMS[x.code]} />}
                    {x.link && (
                      <a className="btn" href={x.link.href === 'mail' ? ctaHref : x.link.href}>
                        {x.link.label}
                      </a>
                    )}
                  </li>
                </Fragment>
              )
            })}
            {left.length === 0 && (
              <li data-from="site">
                <b className="mono">{ask.site}</b>
                <p>{ask.done}</p>
              </li>
            )}
          </ol>
          {left.length > 0 && (
            <ul className="ask__chips" aria-label={ask.chipsLabel}>
              {left.map((i) => (
                <li key={i}>
                  <button type="button" onClick={() => setAsked((a) => [...a, i])}>
                    {ask.questions[i].q}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="record">
        <dl className="stats" aria-label={r.statsLabel}>
          {r.stats.map((s) => (
            <div key={s.label}>
              <dd>
                <Count to={s.to} suffix={s.suffix} />
              </dd>
              <dt>{s.label}</dt>
            </div>
          ))}
        </dl>
        <p className="record__stack">
          <b>{r.stackLabel}</b> {r.stack.join(', ')}
        </p>
        {r.cv && (
          <p>
            <a className="btn" href={r.cv.href} download>
              {r.cv.label}
            </a>
          </p>
        )}
        {r.testimonials.length > 0 && (
          <ul className="record__quotes">
            {r.testimonials.map((t) => (
              <li key={t.name}>
                <blockquote>{t.quote}</blockquote>
                <p>
                  {t.name}, {t.role}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
