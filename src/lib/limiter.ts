/**
 * The hitlimit demo runs the published @joint-ops/hitlimit middleware, unmodified, in
 * the visitor's tab. hitlimit is a fixed-window counter: `limit` hits per
 * window, and the whole window resets at once.
 */
import { hitlimit, memoryStore } from '@joint-ops/hitlimit'
import { content } from '../content'

export const LIMIT = 5
export const WINDOW = '10s'
export const MESSAGE = 'Slow down cowboy!'
const WINDOW_MS = parseInt(WINDOW) * 1000 // '10s' → 10 000

export interface Exchange {
  status: 200 | 429
  headers: Record<string, string>
  body: unknown
}

type Store = ReturnType<typeof memoryStore>
// hitlimit's types name Express's req/res; we hand it the minimal shape it actually uses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Middleware = (req: any, res: any, next: () => void) => void

/** One request through a hitlimit middleware, synchronously (memory store = hitlimit's sync fast path). */
export function exchange(mw: Middleware, ip: string): Exchange {
  const out: Exchange = { status: 200, headers: {}, body: null }
  const res = {
    setHeader: (k: string, v: unknown) => void (out.headers[k] = String(v)),
    status(code: number) {
      out.status = code as Exchange['status']
      return res
    },
    json: (b: unknown) => void (out.body = b),
  }
  mw({ ip }, res, () => void (out.status = 200))
  return out
}

export function createLimiter(store: Store = memoryStore()): (ip?: string) => Exchange {
  const mw = hitlimit({ limit: LIMIT, window: WINDOW, response: { message: MESSAGE }, store })
  return (ip = 'visitor') => exchange(mw, ip)
}

export interface VesselState {
  remaining: number
  resetAtMs: number
  rejected: number
}

/**
 * Fold one exchange into the vessel. hitlimit opens a window at Date.now() on its
 * first hit, so on the same clock the reset is exactly first hit + window
 * (X-RateLimit-Reset is rounded up to a whole second, which reads as "11s" on a 10 s window).
 */
export function nextVessel(prev: VesselState | null, r: Exchange, now: number): VesselState {
  const fresh = !prev || now >= prev.resetAtMs
  return {
    remaining: Number(r.headers['RateLimit-Remaining']),
    resetAtMs: fresh ? now + WINDOW_MS : prev.resetAtMs,
    rejected: (prev?.rejected ?? 0) + (r.status === 429 ? 1 : 0),
  }
}

/** What the vessel shows at `now`. Derived from the clock, never from counting timer ticks. */
export function vesselView(s: VesselState | null, now: number, cap = 48) {
  if (!s) return { level: LIMIT, retryIn: 0, pileDrawn: 0, pileExtra: 0 }
  const live = now < s.resetAtMs
  return {
    level: live ? s.remaining : LIMIT,
    retryIn: live ? Math.ceil((s.resetAtMs - now) / 1000) : 0,
    pileDrawn: Math.min(s.rejected, cap),
    pileExtra: Math.max(0, s.rejected - cap),
  }
}

/** What the live region says after a press. Computed once per press, so the countdown never re-announces. */
export function announcement(r: Exchange, s: VesselState, now: number): string {
  const h = content.stops.hitlimit
  return r.status === 429 ? h.announce429(vesselView(s, now).retryIn) : h.announce200(s.remaining)
}
