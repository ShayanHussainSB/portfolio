import { describe, expect, it } from 'vitest'
import { pingEdge, shimmerFrom, sky, summarize } from './conditions'

/** What the edge function answers. */
const edge = () => new Response('{}', { headers: { 'content-type': 'application/json' } })

describe('summarize', () => {
  it('median RTT and RFC 3550-style jitter (mean |Δ| between consecutive samples)', () => {
    // |46-40| + |41-46| + |60-41| + |42-60| = 6+5+19+18 = 48 → 48/4 = 12
    expect(summarize([40, 46, 41, 60, 42])).toEqual({ median: 42, jitter: 12, min: 40, max: 60 })
  })
  it('a steady link has zero jitter', () => {
    expect(summarize([50, 50]).jitter).toBe(0)
  })
})

describe('sky', () => {
  it('calm under 5 ms, breezy under 20 ms, gusty beyond', () => {
    expect(sky(4)).toBe('calm')
    expect(sky(5)).toBe('breezy')
    expect(sky(20)).toBe('gusty')
  })
})

describe('shimmerFrom', () => {
  it('maps jitter onto 0..1 over 30 ms, clamped', () => {
    expect(shimmerFrom(-1)).toBe(0)
    expect(shimmerFrom(15)).toBe(0.5)
    expect(shimmerFrom(90)).toBe(1)
  })
})

describe('pingEdge', () => {
  const ok = () => Promise.resolve(edge())

  it('an unreachable edge gives null, never invented numbers', async () => {
    expect(await pingEdge(5, () => Promise.reject(new Error('blocked')))).toBeNull()
  })

  it('skips failed pings and keeps the good samples', async () => {
    let n = 0
    const flaky = () => (n++ % 2 ? Promise.reject(new Error('drop')) : ok())
    const r = await pingEdge(5, flaky)
    expect(r).not.toBeNull()
    expect(r!.length).toBeGreaterThanOrEqual(2)
    expect(r!.length).toBeLessThanOrEqual(3)
    expect(r!.every(Number.isFinite)).toBe(true)
  })

  it('a non-2xx answer counts as a failed ping', async () => {
    expect(await pingEdge(3, () => Promise.resolve(new Response('', { status: 500 })))).toBeNull()
  })

  it('pings five times, one at a time (sequential, so samples do not queue behind each other)', async () => {
    let inFlight = 0
    let peak = 0
    let calls = 0
    const slow = () => {
      calls++
      inFlight++
      peak = Math.max(peak, inFlight)
      return new Promise<Response>((res) => setTimeout(() => (inFlight--, res(edge())), 2))
    }
    await pingEdge(5, slow)
    expect(calls).toBe(5)
    expect(peak).toBe(1)
  })
})

describe('pingEdge timing source', () => {
  it('uses Resource Timing (network round trip) when the browser has an entry, so main-thread jank is not counted', async () => {
    const entries = () => [{ requestStart: 10, responseStart: 52 }] as unknown as PerformanceResourceTiming[]
    expect(await pingEdge(2, () => Promise.resolve(edge()), entries)).toEqual([42, 42])
  })
})

describe('pingEdge: not the edge', () => {
  it('a 200 that is not JSON (an SPA fallback page) is not the edge function, so it counts as failed', async () => {
    const html = () => Promise.resolve(new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }))
    expect(await pingEdge(3, html)).toBeNull()
  })
})
