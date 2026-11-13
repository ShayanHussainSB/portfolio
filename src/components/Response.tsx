import { lazy, Suspense, useEffect, useState } from 'react'
import { content } from '../content'
import type { Observation } from '../lib/observe'
import { ICONS } from '../lib/icons'
import { fallbackSrc, srcSet } from '../lib/photos'

const Mascots = lazy(() => import('./Mascots'))

/** The response: the page ends where it began, in blue, on the lake. The reply is pre-addressed with the visitor's request. */
export function Response({ obs, ctaHref }: { obs: Observation | null; ctaHref: string }) {
  const r = content.response
  const [live, setLive] = useState(false) // the 3D characters load after the page, on the client only
  useEffect(() => setLive(true), [])
  return (
    <section className="response" id="contact" aria-labelledby="response-title">
      <figure className="response__photo">
        <picture>
          <source media="(min-width: 761px)" type="image/avif" srcSet={srcSet('horizon-wide', 'avif')} sizes="100vw" />
          <source media="(min-width: 761px)" type="image/webp" srcSet={srcSet('horizon-wide', 'webp')} sizes="100vw" />
          <source type="image/avif" srcSet={srcSet('horizon', 'avif')} sizes="100vw" />
          <source type="image/webp" srcSet={srcSet('horizon', 'webp')} sizes="100vw" />
          <img src={fallbackSrc('horizon')} alt={r.alt} loading="lazy" decoding="async" width={1500} height={2000} />
        </picture>
      </figure>
      <div className="response__body">
        <h2 id="response-title">{r.headline}</h2>
        <p>{r.body}</p>
        <a className="cta" href={ctaHref}>
          {content.hero.cta.label}
        </a>
        <ul className="links" aria-label={r.linksLabel}>
          {r.links.map((l) => (
            <li key={l.id}>
              <a href={l.href} rel="me">
                <span className="links__stage">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={ICONS[l.id]} />
                  </svg>
                </span>
                <b>{l.label}</b>
                {/* a long address may wrap at the @, never mid-word */}
                <span>{l.handle.split('@').flatMap((part, i) => (i ? [<wbr key={i} />, '@' + part] : [part]))}</span>
              </a>
            </li>
          ))}
          {live && (
            <Suspense fallback={null}>
              <Mascots />
            </Suspense>
          )}
        </ul>
      </div>
      <dl className="response__headers mono" aria-label="Response headers">
        <div>
          <dt className="sr-only">Status</dt>
          <dd>{r.status}</dd>
        </div>
        {obs && (
          <div>
            <dt>X-Request-Id</dt>
            <dd>{obs.id}</dd>
          </div>
        )}
        {obs?.rttMs != null && (
          <div>
            <dt>X-Response-Time</dt>
            <dd>{obs.rttMs} ms</dd>
          </div>
        )}
        <div>
          <dt>X-Served-By</dt>
          <dd>{r.servedBy}</dd>
        </div>
        <div>
          <dt>X-Availability</dt>
          <dd>{r.availability}</dd>
        </div>
      </dl>
    </section>
  )
}
