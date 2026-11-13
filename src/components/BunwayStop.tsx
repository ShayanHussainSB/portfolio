import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { content } from '../content'
import { LAYERS, runChain, type Layer } from '../lib/films'
import { StopSheet } from './StopSheet'

const ORIGIN = typeof location === 'undefined' ? 'https://example.com' : location.origin
const ALL_ON = Object.fromEntries(LAYERS.map((l) => [l, true])) as Record<Layer, boolean>
const only = (l: Layer) => Object.fromEntries(LAYERS.map((k) => [k, k === l])) as Record<Layer, boolean>

/**
 * Sheet 03: bunWay. The visitor's GET passes through the real middleware,
 * drawn as stacked films; peel one off and its headers leave the response.
 */
export function BunwayStop() {
  const b = content.stops.bunway
  const [on, setOn] = useState(ALL_ON)
  const [gone, setGone] = useState<[string, string][]>([]) // headers the last toggle removed
  const [announce, setAnnounce] = useState('')
  // server + first render: the chain runs on the client only (request ids and timings are per visit)
  const [ran, setRan] = useState(false)
  useEffect(() => setRan(true), [])
  const result = useMemo(() => (ran ? runChain(on, ORIGIN) : null), [on, ran])
  const counts = useMemo(() => Object.fromEntries(LAYERS.map((l) => [l, runChain(only(l), ORIGIN).headers.length])) as Record<Layer, number>, [])

  const toggle = (layer: Layer) => {
    const next = { ...on, [layer]: !on[layer] }
    const before = runChain(on, ORIGIN).headers
    const after = runChain(next, ORIGIN).headers
    const keys = new Set(after.map(([k]) => k.toLowerCase()))
    setGone(next[layer] ? [] : before.filter(([k]) => !keys.has(k.toLowerCase())))
    setAnnounce(b.announce(b.films[layer], next[layer], counts[layer]))
    setOn(next)
  }

  return (
    <StopSheet
      id="bunway"
      headline={b.headline}
      sentence={b.sentence}
      code={b.code}
      details={
        <>
          <ul>
            {b.details.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="stop__install">
            <code>{b.install}</code> · <a href={b.repo}>{b.repoLabel}</a>
          </p>
        </>
      }
      panel={
        <div className="sheet bw">
          <fieldset className="films">
            <legend className="sr-only">{b.filmsLabel}</legend>
            {LAYERS.map((l, i) => (
              <label key={l} className="film" data-on={on[l]} style={{ '--i': i } as CSSProperties}>
                <input type="checkbox" checked={on[l]} onChange={() => toggle(l)} />
                <span className="film__name">{b.films[l]}</span>
                <span className="film__adds">{b.adds(counts[l])}</span>
              </label>
            ))}
          </fieldset>

          <pre className="resp" aria-label={b.responseLabel}>
            <span className="resp__ok">HTTP/1.1 200 OK</span>
            {'\n'}
            {result?.headers.map(([k, v]) => `${k}: ${v}\n`)}
            {gone.map(([k, v]) => (
              <span key={k} className="resp__gone">
                {`${k}: ${v}\n`}
              </span>
            ))}
            {result &&
              Object.entries(result.errors).map(([l, why]) => (
                <span key={l} className="resp__fault">
                  {b.layerFailed(b.films[l as Layer], why!)}
                  {'\n'}
                </span>
              ))}
          </pre>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </div>
      }
    />
  )
}
