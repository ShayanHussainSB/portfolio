import { useRef, useState } from 'react'
import { content } from '../content'
import { createShow, formatPaisa, type Ticket } from '../lib/usher'
import { StopSheet } from './StopSheet'

const ROWS = ['A', 'B', 'C', 'D', 'E']
const PER_ROW = 10
const AISLE_AFTER = 5
// example prices in paisa; row E is recliners
const priceOf = (seat: string) => (seat.startsWith('E') ? 250000 : 120000)
const PRESOLD = ['A3', 'A4', 'B6', 'C2', 'D7', 'D8']

/** A QR-shaped drawing of a token (not a scannable code): three finder squares and the token's bits. */
function TokenMark({ token, size }: { token: string; size: number }) {
  const n = 21
  const bits = token.split('').flatMap((h) => parseInt(h, 16).toString(2).padStart(4, '0').split('').map(Number))
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  const cells: string[] = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue
      if (bits[(x * 7 + y * 13) % bits.length] ^ ((x + y) & 1)) cells.push(`M${x} ${y}h1v1h-1z`)
    }
  const eye = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`
  return (
    <svg className="qr" viewBox={`-1 -1 ${n + 2} ${n + 2}`} width={size} height={size} aria-hidden="true">
      <path d={eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7) + cells.join('')} fillRule="evenodd" />
    </svg>
  )
}

/** Usher (coming next). Two counters race for one seat; a ticket admits once at the gate. A model of the rules. */
export function UsherStop() {
  const u = content.stops.usher
  const show = useRef<ReturnType<typeof createShow> | null>(null)
  if (!show.current) {
    show.current = createShow(priceOf)
    for (const s of PRESOLD) show.current.sell(s, 1)
  }
  const [picked, setPicked] = useState<string | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [log, setLog] = useState<{ id: number; text: string }[]>([])
  const [, setTick] = useState(0)
  const seq = useRef(0)
  const say = (...lines: string[]) => setLog((l) => [...l, ...lines.map((text) => ({ id: ++seq.current, text }))].slice(-8))

  const race = () => {
    if (!picked) return
    const first = Math.random() < 0.5 ? 1 : 2
    const lines: string[] = []
    for (const counter of [first, 3 - first]) {
      const r = show.current!.sell(picked, counter)
      if (r.ok) {
        setTicket(r.ticket)
        lines.push(u.log.sold(counter, picked, formatPaisa(r.ticket.price)))
      } else lines.push(u.log.refused(counter, picked))
    }
    say(...lines)
    setPicked(null)
  }

  const scan = (code: string) => {
    const r = show.current!.scan(code)
    if (r.kind === 'admit') say(u.log.admit(r.ticket.seat))
    else if (r.kind === 'used') say(u.log.used(r.ticket.seat, new Date(r.ticket.scannedAt!).toLocaleTimeString('en-GB')))
    else if (r.kind === 'receipt') say(u.log.receipt)
    setTick((n) => n + 1)
  }

  const sold = show.current.sold
  return (
    <StopSheet
      id="usher"
      headline={u.headline}
      sentence={u.sentence}
      code={u.code}
      details={
        <ul>
          {u.details.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      }
      panel={
        <div className="sheet us">
          <div className="us__screen" aria-hidden="true">
            {u.screen}
          </div>
          <fieldset className="seats">
            <legend className="sr-only">{u.mapLabel}</legend>
            {ROWS.map((row) => (
              <div key={row} className="seats__row" data-class={row === 'E' ? 'recliner' : 'standard'}>
                <span className="seats__label" aria-hidden="true">
                  {row}
                </span>
                {Array.from({ length: PER_ROW }, (_, i) => {
                  const seat = `${row}${i + 1}`
                  return (
                    <button
                      key={seat}
                      type="button"
                      className="seat"
                      data-aisle={i === AISLE_AFTER ? 'true' : undefined}
                      data-sold={sold.has(seat) || undefined}
                      aria-pressed={picked === seat}
                      aria-label={`${seat}, ${row === 'E' ? u.classes.recliner : u.classes.standard}${sold.has(seat) ? ', sold' : ''}`}
                      onClick={() => setPicked(seat)}
                    />
                  )
                })}
              </div>
            ))}
          </fieldset>
          <p className="us__legend">
            <span>
              <i className="seat" aria-hidden="true" /> {u.classes.standard} {formatPaisa(120000)}
            </span>
            <span>
              <i className="seat" data-recliner="true" aria-hidden="true" /> {u.classes.recliner} {formatPaisa(250000)}
            </span>
            <span>
              <i className="seat" data-sold="true" aria-hidden="true" /> sold
            </span>
          </p>
          <div className="us__controls">
            <span className="us__picked">{picked ? u.picked(picked, formatPaisa(priceOf(picked))) : u.pickFirst}</span>
            <button type="button" className="btn btn--solid" disabled={!picked} onClick={race}>
              {u.race}
            </button>
          </div>
          {ticket && (
            <div className="slip" key={ticket.token}>
              <div>
                <b>
                  {u.slip} · {ticket.seat}
                </b>
                <span>{formatPaisa(ticket.price)}</span>
                <TokenMark token={ticket.token} size={92} />
                <button type="button" className="btn" onClick={() => scan(ticket.token)}>
                  {u.scanTicket}
                </button>
              </div>
              <div className="slip__receipt">
                <span>{u.receipt}</span>
                <TokenMark token={ticket.receipt} size={48} />
                <button type="button" className="btn" onClick={() => scan(ticket.receipt)}>
                  {u.scanReceipt}
                </button>
              </div>
            </div>
          )}
          <pre className="klog us__log" aria-label={u.logLabel} aria-live="polite">
            {log.length ? (
              log.map((l) => (
                <span key={l.id} data-refused={l.text.includes('refused') || undefined}>
                  {l.text + '\n'}
                </span>
              ))
            ) : (
              <span className="klog__idle">{u.idle}</span>
            )}
          </pre>
        </div>
      }
    />
  )
}
