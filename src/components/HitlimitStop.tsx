import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { formatChecks } from '../lib/bench'
import { announcement, createLimiter, LIMIT, nextVessel, vesselView, type Exchange, type VesselState } from '../lib/limiter'
import { StopSheet } from './StopSheet'

const PILE_COLS = 12
const MAX_FLIGHTS = 6

/**
 * hitlimit. Every press goes through the real middleware. The vessel
 * holds the window's remaining requests; accepted requests fly down the route
 * (in the visitor's fringe), rejected ones fall below it and stay there.
 */
export function HitlimitStop() {
  const h = content.stops.hitlimit
  const send = useRef<ReturnType<typeof createLimiter> | null>(null)
  const [last, setLast] = useState<Exchange | null>(null)
  const [vs, setVs] = useState<VesselState | null>(null)
  const [flights, setFlights] = useState<number[]>([])
  const [now, setNow] = useState(0)
  const [announce, setAnnounce] = useState('')
  const seq = useRef(0)

  const press = (times: number) => {
    send.current ??= createLimiter()
    let r: Exchange | null = null
    let next = vs
    const ok: number[] = []
    for (let i = 0; i < times; i++) {
      r = send.current()
      next = nextVessel(next, r, Date.now())
      if (r.status === 200) ok.push(++seq.current)
    }
    setLast(r)
    setVs(next)
    setAnnounce(announcement(r!, next!, Date.now()))
    if (ok.length) setFlights((f) => [...f, ...ok].slice(-MAX_FLIGHTS))
    setNow(Date.now())
  }

  // tick the countdown only while a window is open; state comes from the clock, not from ticks
  useEffect(() => {
    if (!vs || Date.now() >= vs.resetAtMs) return
    const t = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= vs.resetAtMs) clearInterval(t)
    }, 250)
    return () => clearInterval(t)
  }, [vs])

  const v = vesselView(vs, now)
  const blocked = last?.status === 429 && v.retryIn > 0
  const warn = vs !== null && v.level <= 1

  return (
    <StopSheet
      id="hitlimit"
      headline={h.headline}
      sentence={h.sentence}
      code={h.code}
      details={
        <>
          <ul>
            {h.details.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="stop__install">
            <code>{h.install}</code> · <a href={h.repo}>{h.repoLabel}</a>
          </p>
        </>
      }
      panel={
        <div className="sheet hl" data-state={blocked ? 'blocked' : warn ? 'warn' : 'calm'}>
          <svg className="vessel" viewBox="0 0 300 250" role="img" aria-label={`${h.vessel}: ${v.level} of ${LIMIT}`}>
            <defs>
              <pattern id="vessel-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="5" className="vessel__hatch" />
              </pattern>
            </defs>
            {/* the glass: an open-top vessel; hatched when one request is left */}
            {warn && <path d={VESSEL} className="vessel__band" stroke="url(#vessel-hatch)" />}
            <path d={VESSEL} className="vessel__glass" />
            {Array.from({ length: LIMIT }, (_, i) => (
              <circle key={i} cx="80" cy={148 - i * 26} r="11" className={i < v.level ? 'token' : 'token token--spent'} />
            ))}
            {/* the route out: accepted requests reach 200 */}
            <line x1="110" y1="148" x2="286" y2="148" className="route" />
            <text x="286" y="138" textAnchor="end" className="route__label">
              200
            </text>
            {blocked && <path d="M150 134 L166 162" className="route__cut" />}
            {flights.map((id) => (
              <circle key={id} cx="110" cy="148" r="6" className="flight" />
            ))}
            {/* rejected requests fall below the route and stay */}
            {Array.from({ length: v.pileDrawn }, (_, i) => {
              const row = Math.floor(i / PILE_COLS)
              return <circle key={i} cx={126 + (i % PILE_COLS) * 13 + (row % 2) * 6} cy={236 - row * 11} r="5" className="reject" />
            })}
            {vs && vs.rejected > 0 && (
              <text x="124" y="176" className="route__label">
                {h.rejectedPile(vs.rejected)}
                {v.pileExtra > 0 && (
                  <tspan x="124" dy="13">
                    {h.pileMore(v.pileExtra)}
                  </tspan>
                )}
              </text>
            )}
          </svg>

          <pre className="resp" aria-label={h.responseLabel}>
            {last ? <Response r={last} /> : <span className="resp__muted">{h.idle}</span>}
          </pre>

          <p className="hl__status">{v.retryIn > 0 ? h.resetsIn(v.retryIn) : ' '}</p>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          <div className="hl__controls">
            <button type="button" className="btn btn--solid" onClick={() => press(1)}>
              {h.send}
            </button>
            <button type="button" className="btn" onClick={() => press(10)}>
              {h.burst}
            </button>
          </div>
          <Bench />
        </div>
      }
    />
  )
}

const VESSEL = 'M50 18 V150 Q50 172 72 172 H88 Q110 172 110 150 V18 M43 18 H57 M103 18 H117'

function Response({ r }: { r: Exchange }) {
  return (
    <>
      <span className={r.status === 429 ? 'resp__fault' : 'resp__ok'}>{r.status === 429 ? 'HTTP/1.1 429 Too Many Requests' : 'HTTP/1.1 200 OK'}</span>
      {'\n'}
      {Object.entries(r.headers).map(([k, val]) => `${k}: ${val}\n`)}
      {r.status === 429 ? `\n${JSON.stringify(r.body, null, 2)}` : '\n→ next()'}
    </>
  )
}

type BenchState = { k: 'idle' } | { k: 'running' } | { k: 'done'; n: number } | { k: 'failed' }

/** "Your device ran N checks in one second": the real middleware in a Web Worker, only on request. */
function Bench() {
  const h = content.stops.hitlimit
  const [state, setState] = useState<BenchState>({ k: 'idle' })
  const worker = useRef<Worker | null>(null)
  useEffect(() => () => worker.current?.terminate(), [])

  const run = () => {
    if (worker.current) return // one run at a time
    const done = (next: BenchState) => {
      worker.current?.terminate()
      worker.current = null
      setState(next)
    }
    try {
      const w = new Worker(new URL('../lib/bench.worker.ts', import.meta.url), { type: 'module' })
      worker.current = w
      setState({ k: 'running' })
      w.onmessage = (e: MessageEvent<{ checks: number }>) => done({ k: 'done', n: e.data.checks })
      w.onerror = () => done({ k: 'failed' })
    } catch {
      done({ k: 'failed' })
    }
  }

  return (
    <div className="bench">
      <button type="button" className="btn" onClick={run} disabled={state.k === 'running'}>
        {state.k === 'running' ? h.benchRunning : h.benchRun}
      </button>
      <p className="bench__result" aria-live="polite">
        {state.k === 'done' ? formatChecks(state.n) : state.k === 'failed' ? h.benchFailed : ''}
      </p>
      {state.k === 'done' && <p className="bench__note">{h.benchNote}</p>}
    </div>
  )
}
