import { memoryStore } from '@joint-ops/hitlimit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../content'
import { announcement, createLimiter, LIMIT, MESSAGE, nextVessel, vesselView, WINDOW, type Exchange } from './limiter'

const T = Date.UTC(2026, 10, 12, 12, 0, 0)

describe('createLimiter: the real @joint-ops/hitlimit middleware', () => {
  let store: ReturnType<typeof memoryStore>
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T)
    store = memoryStore()
  })
  afterEach(() => {
    store.shutdown?.()
    vi.useRealTimers()
  })

  it('lets 5 requests through, counting RateLimit-Remaining down', () => {
    const send = createLimiter(store)
    const remaining = Array.from({ length: LIMIT }, () => {
      const r = send()
      expect(r.status).toBe(200)
      return r.headers['RateLimit-Remaining']
    })
    expect(remaining).toEqual(['4', '3', '2', '1', '0'])
  })

  it('the 6th is a real 429 with Retry-After and the configured message', () => {
    const send = createLimiter(store)
    for (let i = 0; i < LIMIT; i++) send()
    const r = send()
    expect(r.status).toBe(429)
    expect(r.headers['Retry-After']).toBe('10')
    expect(r.body).toEqual({ message: MESSAGE, limit: 5, remaining: 0, resetIn: 10 })
    expect(MESSAGE).toBe('Slow down cowboy!')
  })

  it('a fixed window: everything comes back at once when it resets', () => {
    const send = createLimiter(store)
    for (let i = 0; i < LIMIT + 3; i++) send()
    vi.advanceTimersByTime(10_000)
    const r = send()
    expect(r.status).toBe(200)
    expect(r.headers['RateLimit-Remaining']).toBe('4')
  })
})

describe('vesselView', () => {
  it('no requests yet: a full vessel', () => {
    expect(vesselView(null, T)).toEqual({ level: 5, retryIn: 0, pileDrawn: 0, pileExtra: 0 })
  })

  it('drained: empty, counting down, rejected droplets below the route', () => {
    expect(vesselView({ remaining: 0, resetAtMs: T + 7000, rejected: 3 }, T)).toEqual({ level: 0, retryIn: 7, pileDrawn: 3, pileExtra: 0 })
  })

  it('after the reset (even if the tab was hidden): full again, and the rejected droplets stay', () => {
    expect(vesselView({ remaining: 0, resetAtMs: T + 7000, rejected: 3 }, T + 7000)).toEqual({ level: 5, retryIn: 0, pileDrawn: 3, pileExtra: 0 })
    expect(vesselView({ remaining: 2, resetAtMs: T + 7000, rejected: 0 }, T + 60_000).level).toBe(5)
  })

  it('caps the drawn pile so spam cannot grow the DOM without limit', () => {
    expect(vesselView({ remaining: 0, resetAtMs: T, rejected: 100 }, T)).toMatchObject({ pileDrawn: 48, pileExtra: 52 })
  })
})

describe('nextVessel', () => {
  const r = (remaining: number, status: 200 | 429 = 200): Exchange => ({
    status,
    headers: { 'RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(Math.ceil((T + 10_000) / 1000) + 1) },
    body: null,
  })

  it('the first hit of a window starts the 10 s clock exactly (no whole-second rounding from the header)', () => {
    expect(nextVessel(null, r(4), T)).toEqual({ remaining: 4, resetAtMs: T + 10_000, rejected: 0 })
  })
  it('later hits in the same window keep its reset time; 429s add to the pile', () => {
    const s1 = nextVessel(null, r(4), T)
    const s2 = nextVessel(s1, r(0, 429), T + 3000)
    expect(s2).toEqual({ remaining: 0, resetAtMs: T + 10_000, rejected: 1 })
  })
  it('a hit after the reset starts a new window and keeps the pile', () => {
    const s = nextVessel({ remaining: 0, resetAtMs: T + 10_000, rejected: 7 }, r(4), T + 12_000)
    expect(s).toEqual({ remaining: 4, resetAtMs: T + 22_000, rejected: 7 })
  })
})

describe('announcement (said once per press, never re-derived from the ticking countdown)', () => {
  const ex = (status: 200 | 429): Exchange => ({ status, headers: { 'Retry-After': '10' }, body: null })
  it('200: how many requests are left', () => {
    expect(announcement(ex(200), { remaining: 4, resetAtMs: T + 10_000, rejected: 0 }, T)).toBe('200 OK. 4 requests left.')
  })
  it('429: the real time left in this window, not the rounded header', () => {
    expect(announcement(ex(429), { remaining: 0, resetAtMs: T + 7000, rejected: 1 }, T)).toBe('429 Too Many Requests. Retry after 7 seconds.')
  })
})

describe('the code line on the page is the config that runs', () => {
  it('content.stops.hitlimit.code matches LIMIT, WINDOW and MESSAGE', () => {
    expect(content.stops.hitlimit.code).toBe(`hitlimit({ limit: ${LIMIT}, window: '${WINDOW}', response: { message: '${MESSAGE}' } })`)
  })
})
