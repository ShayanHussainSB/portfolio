import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { content } from '../content'
import type { Observation } from '../lib/observe'
import { useProgressVar } from '../lib/scroll'
import { Stream } from './Stream'

const Flight = lazy(() => import('./Flight'))

/**
 * The hero. With WebGL and motion allowed it is a flight: a tall section whose pinned stage scroll flies
 * down the request path (Flight.tsx). Otherwise it is the 2D stream. Until the browser has said which,
 * (and without JavaScript) it is just the headline.
 */
export function Hero({ obs }: { obs: Observation | null }) {
  const p = content.person
  const o = content.observation
  const ref = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<'flight' | 'stream' | null>(null)
  useEffect(() => setMode(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'stream' : 'flight'), [])
  const toStream = useCallback(() => setMode('stream'), [])
  useProgressVar(ref)
  return (
    <section className="hero" data-mode={mode ?? undefined} id="top" ref={ref} aria-labelledby="hero-title">
      <div className="hero__stage">
        {mode === 'flight' && (
          <Suspense fallback={null}>
            <Flight city={obs?.city ?? null} onFail={toStream} />
          </Suspense>
        )}
        <div className="hero__pitch">
          <h1 className="hero__headline" id="hero-title">
            {content.hero.headline}
          </h1>
          <p className="hero__sub">{content.hero.sub}</p>
        </div>
        {mode === 'stream' && <Stream city={obs?.city ?? null} />}
        <div className="hero__foot">
          <p>
            {p.role}, {p.years}.<br />
            {p.location}.
          </p>
          <p className="hero__obs" aria-live="polite">
            {obs ? o.line(obs.id, obs.city, obs.region, obs.rttMs) : o.pending}
          </p>
          <p className="hero__hint">
            {mode === 'flight' && <b>{content.stream.scroll}</b>}
            {content.stream.hint}
          </p>
        </div>
      </div>
    </section>
  )
}
