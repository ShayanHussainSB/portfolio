import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react'
import { content } from '../content'
import type { Rig } from '../lib/drain'
import { fallbackSrc, srcSet } from '../lib/photos'
import { StopSheet } from './StopSheet'

const LOG_LINES = 9
const SEND_EVERY = 250

interface Drop {
  id: number
  ms: number
}

/**
 * Sheet 05: kaput. The visitor's traffic flows through a server that the real
 * kaput class manages; lift the cover, send SIGTERM, watch it drain to zero.
 * The kaput chunk (with its `process` shim) loads only when the sheet is reached.
 */
export function KaputStop() {
  const k = content.stops.kaput
  const rig = useRef<Rig | null>(null)
  const [, render] = useReducer((n: number) => n + 1, 0)
  const [log, setLog] = useState<string[]>([])
  const [drops, setDrops] = useState<Drop[]>([])
  const [cover, setCover] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const logBox = useRef<HTMLPreElement>(null)
  const restartBtn = useRef<HTMLButtonElement>(null)
  const seq = useRef(0)
  // keep the newest kaput line in view
  useEffect(() => {
    if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight
  }, [log])

  const boot = async () => {
    const { createRig } = await import('../lib/drain')
    rig.current?.dispose()
    rig.current = createRig({ onLog: (l) => setLog((ls) => [...ls, l].slice(-LOG_LINES)), onChange: render })
    setLog([])
    setDrops([])
    setCover(false)
    setLoaded(true)
  }

  // load + start traffic only while the sheet is on screen
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting)
      if (e.isIntersecting && !rig.current) void boot()
    }, { threshold: 0.2 })
    if (root.current) io.observe(root.current)
    return () => {
      io.disconnect()
      rig.current?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, [])

  const phase = rig.current?.stats().phase ?? 'serving'
  useEffect(() => {
    if (!visible || !loaded || phase === 'exited') return
    const t = setInterval(() => {
      const ms = 600 + Math.random() * 2400
      if (rig.current?.send(ms) !== 'accepted') return
      const id = ++seq.current
      setDrops((d) => [...d, { id, ms }])
      setTimeout(() => setDrops((d) => d.filter((x) => x.id !== id)), ms)
    }, SEND_EVERY)
    return () => clearInterval(t)
  }, [visible, loaded, phase])

  // the SIGTERM button disappears on exit; keep a keyboard user's focus in the panel
  useEffect(() => {
    const a = document.activeElement
    if (phase === 'exited' && (a === document.body || root.current?.contains(a))) restartBtn.current?.focus()
  }, [phase])

  const sigterm = () => {
    navigator.vibrate?.(30)
    void rig.current?.shutdown()
  }

  const s = rig.current?.stats()
  const gateClosed = phase !== 'serving'
  const announce = phase === 'draining' ? k.announce.draining : phase === 'closing' ? k.announce.closing : phase === 'exited' && s ? k.announce.exited(s.served, s.dropped) : ''

  return (
    <StopSheet
      id="kaput"
      headline={k.headline}
      sentence={k.sentence}
      code={k.code}
      details={
        <>
          <ul>
            {k.details.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="stop__install">
            <code>{k.install}</code> · <a href={k.repo}>{k.repoLabel}</a>
          </p>
        </>
      }
      panel={
        <div className="sheet kp" ref={root} data-phase={phase} onFocus={() => !rig.current && void boot()}>
          <p className="kp__phase">
            {k.balancer} → {k.server} · <b>{k.phase[phase]}</b>
          </p>
          {phase !== 'exited' ? (
            <svg className="lane" viewBox="0 0 320 84" aria-hidden="true">
              <defs>
                <pattern id="gate-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" className="vessel__hatch" />
                </pattern>
              </defs>
              {gateClosed && <rect x="10" y="4" width="10" height="76" fill="url(#gate-hatch)" />}
              <line x1="15" y1="4" x2="15" y2="80" className={gateClosed ? 'gate gate--closed' : 'gate'} />
              <rect x="44" y="12" width="266" height="60" rx="3" className="lane__server" />
              <line x1="15" y1="42" x2="310" y2="42" className="lane__wire" />
              {drops.map((d) => (
                <circle key={d.id} cx="48" cy={26 + ((d.id * 7) % 32)} r="4" className="req" style={{ animationDuration: `${d.ms}ms` } as CSSProperties} />
              ))}
            </svg>
          ) : (
            <figure className="offcall">
              <picture>
                <source type="image/avif" srcSet={srcSet('offcall', 'avif')} sizes="(max-width: 720px) 90vw, 22rem" />
                <source type="image/webp" srcSet={srcSet('offcall', 'webp')} sizes="(max-width: 720px) 90vw, 22rem" />
                <img src={fallbackSrc('offcall')} alt={k.offcall.alt} width={800} height={1000} decoding="async" />
              </picture>
              <figcaption className="mono">{k.offcall.caption}</figcaption>
            </figure>
          )}

          <dl className="kp__counts">
            {(['inFlight', 'served', 'refused', 'dropped'] as const).map((c) => (
              <div key={c} className={c === 'dropped' ? 'kp__dropped' : undefined}>
                <dt>{k.counters[c]}</dt>
                <dd>{s ? s[c] : '–'}</dd>
              </div>
            ))}
          </dl>

          <ol className="kp__resources" aria-label={k.resourcesLabel}>
            {(rig.current?.resources() ?? []).map((r) => (
              <li key={r.name} data-state={r.state}>
                <span>{r.name}</span>
                <span className="kp__state">{r.state}</span>
              </li>
            ))}
          </ol>

          <pre className="klog" aria-label={k.logLabel} ref={logBox} tabIndex={0}>
            {loaded ? log.join('\n') || <span className="klog__idle">{k.idle}</span> : k.starting}
          </pre>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          <div className="kp__controls">
            {phase === 'exited' ? (
              <button type="button" className="btn" ref={restartBtn} onClick={() => void boot()}>
                {k.restart}
              </button>
            ) : (
              <>
                <button type="button" className="btn" aria-expanded={cover} aria-controls="kaput-sigterm" onClick={() => setCover((c) => !c)} disabled={!loaded || gateClosed}>
                  {cover ? k.coverDown : k.coverUp}
                </button>
                <button id="kaput-sigterm" type="button" className="btn kill" data-armed={cover} onClick={sigterm} disabled={!cover || gateClosed}>
                  {k.sigterm}
                </button>
              </>
            )}
          </div>
        </div>
      }
    />
  )
}
