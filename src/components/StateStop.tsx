import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { content } from '../content'
import { buildTree, DEPTH, hex, leafHash, LEAVES, proofFor, record, verify } from '../lib/merkle'
import { StopSheet } from './StopSheet'

const SIDE = 64 // 64 × 64 = 4,096 cells
const CELL = 4
const GAP = 1

interface Tree {
  levels: Uint8Array[][]
  ms: number
}

/**
 * Honeycomb state compression. 4,096 example profiles compress into one Keccak-256 root in
 * the visitor's browser; any profile verifies against it with 12 sibling hashes.
 */
export function StateStop() {
  const t = content.stops.state
  const [tree, setTree] = useState<Tree | null>(null)
  const [index, setIndex] = useState(2731)
  const [tampered, setTampered] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  // build once: the first time the sheet is in view, or a keyboard user focuses into it (never at load or during SSR)
  // ponytail: one main-thread task (~45 ms desktop, ~165 ms on a 4× throttled CPU); move buildTree into a Worker if it janks
  const build = () =>
    setTree((have) => {
      if (have) return have
      const t0 = performance.now()
      const levels = buildTree(Array.from({ length: LEAVES }, (_, i) => leafHash(record(i))))
      return { levels, ms: Math.round(performance.now() - t0) }
    })
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        build()
      },
      { threshold: 0.25 },
    )
    if (root.current) io.observe(root.current)
    return () => io.disconnect()
  }, [])

  const proof = useMemo(() => (tree ? proofFor(tree.levels, index) : null), [tree, index])
  const result = useMemo(
    () => (tree && proof ? verify(record(proof.index) + (tampered ? ' ' : ''), proof.index, proof.siblings, tree.levels[DEPTH][0]) : null),
    [tree, proof, tampered],
  )

  // the leaf field: one cell per record; yours in violet, its sibling in mint
  useEffect(() => {
    const c = canvas.current
    if (!c || !tree) return
    const draw = () => {
      const css = getComputedStyle(c)
      const dpr = Math.min(2, devicePixelRatio || 1)
      const px = SIDE * (CELL + GAP)
      c.width = c.height = px * dpr
      const g = c.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, px, px)
      const cell = (i: number, color: string) => {
        g.fillStyle = color
        g.fillRect((i % SIDE) * (CELL + GAP), Math.floor(i / SIDE) * (CELL + GAP), CELL, CELL)
      }
      for (let i = 0; i < LEAVES; i++) cell(i, css.getPropertyValue('--leaf'))
      // drafting crosshair through the chosen record's row and column
      const [cx, cy] = [(index % SIDE) * (CELL + GAP) + CELL / 2, Math.floor(index / SIDE) * (CELL + GAP) + CELL / 2]
      g.strokeStyle = css.getPropertyValue('--violet')
      g.globalAlpha = 0.45
      g.lineWidth = 0.75
      g.beginPath()
      g.moveTo(0, cy)
      g.lineTo(px, cy)
      g.moveTo(cx, 0)
      g.lineTo(cx, px)
      g.stroke()
      g.globalAlpha = 1
      cell(index ^ 1, css.getPropertyValue('--mint'))
      cell(index, tampered ? css.getPropertyValue('--fault') : css.getPropertyValue('--violet'))
      g.strokeStyle = tampered ? css.getPropertyValue('--fault') : css.getPropertyValue('--violet-ink')
      g.lineWidth = 1.25
      g.strokeRect(cx - 5, cy - 5, 10, 10)
    }
    draw()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', draw)
    return () => mq.removeEventListener('change', draw)
  }, [tree, index, tampered])

  const pickFromCanvas = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const col = Math.floor(((e.clientX - r.left) / r.width) * SIDE)
    const row = Math.floor(((e.clientY - r.top) / r.height) * SIDE)
    setIndex(Math.min(LEAVES - 1, Math.max(0, row * SIDE + col)))
  }

  const ok = result?.ok ?? true

  return (
    <StopSheet
      id="state"
      headline={t.headline}
      sentence={t.sentence}
      code={t.code}
      details={
        <ul>
          {t.details.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      }
      panel={
        <div className="sheet st" ref={root} data-state={tree ? (ok ? 'ok' : 'fault') : 'pending'} onFocus={build}>
          <div className="st__field">
            <canvas ref={canvas} className="leaves" aria-hidden="true" onPointerDown={pickFromCanvas} />
            {!tree && <p className="st__pending">{t.condensing}</p>}
          </div>

          <Ladder proof={proof} rootHash={tree?.levels[DEPTH][0]} ok={ok} index={index} />

          <div className="st__controls">
            <label className="st__pick">
              <span className="mono">
                {t.pick} <b>#{proof?.index ?? index}</b>
              </span>
              <input type="range" min={0} max={LEAVES - 1} value={index} onChange={(e) => setIndex(Number(e.target.value))} aria-label={t.fieldLabel} />
            </label>
            <p className="st__result" aria-live="polite">
              {result ? (result.ok ? t.verified : t.rejected) : ''}
            </p>
            <button type="button" className="btn" aria-pressed={tampered} onClick={() => setTampered((v) => !v)}>
              {tampered ? t.untamper : t.tamper}
            </button>
            {tree && <p className="st__built">{t.built(tree.ms)}</p>}
          </div>
        </div>
      }
    >
      <Fanout />
    </StopSheet>
  )
}

/** The proof, drawn as a ladder: your path climbs on the left, each rung's sibling hash on the right. */
function Ladder({
  proof,
  rootHash,
  ok,
  index,
}: {
  proof: { index: number; siblings: Uint8Array[] } | null
  rootHash?: Uint8Array
  ok: boolean
  index: number
}) {
  const t = content.stops.state
  const rows = DEPTH + 1
  const y = (k: number) => 268 - k * 19 // k = 0 (record) … DEPTH (root)
  return (
    <svg className="ladder" viewBox="0 0 230 300" role="img" aria-label={t.ladderLabel(proof?.index ?? index, ok)}>
      <defs>
        <pattern id="ladder-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" className="vessel__hatch" />
        </pattern>
        {/* user-space units: a bounding-box gradient collapses on a perfectly vertical line */}
        <linearGradient id="ladder-fringe" gradientUnits="userSpaceOnUse" x1="0" y1={y(0)} x2="0" y2={y(DEPTH)}>
          <stop offset="0" style={{ stopColor: 'var(--mint)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--rose)' }} />
          <stop offset="1" style={{ stopColor: 'var(--violet)' }} />
        </linearGradient>
      </defs>
      {!ok && <rect x="14" y={y(DEPTH) - 6} width="20" height={y(0) - y(DEPTH) + 12} fill="url(#ladder-hatch)" />}
      <line
        x1="24"
        y1={y(0)}
        x2="24"
        y2={y(DEPTH)}
        className={ok ? 'ladder__path' : 'ladder__path ladder__path--fault'}
        stroke={ok ? 'url(#ladder-fringe)' : undefined}
      />
      {proof?.siblings.map((s, k) => (
        <g key={`${proof.index}-${k}`} className="rung" style={{ '--k': k } as CSSProperties}>
          <circle cx="24" cy={y(k)} r="3.5" className="ladder__node" />
          <line x1="30" y1={y(k)} x2="52" y2={y(k)} className="ladder__rung" />
          <text x="58" y={y(k) + 3.5} className="ladder__hash">
            {hex(s, 4)}…
          </text>
        </g>
      ))}
      {!proof && Array.from({ length: rows - 1 }, (_, k) => <line key={k} x1="30" y1={y(k)} x2="52" y2={y(k)} className="ladder__rung ladder__rung--ahead" />)}
      {/* the root crystal */}
      <path d={`M24 ${y(DEPTH) - 14} l10 6 v12 l-10 6 l-10 -6 v-12 z`} className={ok ? 'crystal' : 'crystal crystal--fault'} />
      {!ok && <path d={`M10 ${y(DEPTH) + 8} L38 ${y(DEPTH) - 12}`} className="route__cut" />}
      <text x="58" y={y(DEPTH) + 3.5} className="ladder__hash ladder__hash--root">
        {t.root} {rootHash ? `${hex(rootHash, 4)}…` : '········'}
      </text>
      <text x="58" y={y(0) + 22} className="ladder__hash">
        {t.record(proof?.index ?? index)}
      </text>
    </svg>
  )
}

/** Secondary beat: one GraphQL schema fans out into typed SDKs (drawn from content, no invented code). */
function Fanout() {
  const t = content.stops.state
  const n = t.sdks.length
  const h = 26 * n
  return (
    <div className="fanout">
      <svg viewBox={`0 0 300 ${h}`} role="img" aria-label={`${t.schema} → ${t.sdks.join(', ')}`}>
        <text x="0" y={h / 2 + 4} className="fanout__label">
          {t.schema}
        </text>
        {t.sdks.map((sdk, i) => {
          const yy = 13 + i * 26
          return (
            <g key={sdk}>
              <path d={`M112 ${h / 2} C150 ${h / 2} 150 ${yy} 188 ${yy}`} className="fanout__line" />
              <text x="196" y={yy + 4} className="fanout__label">
                {sdk}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="fanout__note">{t.sdkNote}</p>
      <p className="fanout__note">{t.gameshift}</p>
    </div>
  )
}
