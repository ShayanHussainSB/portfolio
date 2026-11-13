/**
 * "Conditions at the edge": real round trips from the visitor's browser to the
 * edge function, summarised like a weather report. Nothing is invented: an
 * unreachable edge gives `null`, and the page says so.
 */
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>
export type Sky = 'calm' | 'breezy' | 'gusty'
type Timings = (url: string) => PerformanceResourceTiming[]

const resourceTimings: Timings = (url) =>
  typeof location === 'undefined' ? [] : (performance.getEntriesByName(new URL(url, location.href).href, 'resource') as PerformanceResourceTiming[])

/**
 * Sequential pings (in parallel they'd queue behind each other and fake the jitter).
 * Prefers Resource Timing (request sent → first byte back), so a busy main thread
 * isn't counted as network weather; falls back to a performance.now() stopwatch.
 */
export async function pingEdge(n = 5, fetcher: Fetcher = fetch, timings: Timings = resourceTimings): Promise<number[] | null> {
  const samples: number[] = []
  const nonce = Math.random().toString(36).slice(2, 8)
  for (let i = 0; i < n; i++) {
    try {
      const url = `/api/whoami?ping=${nonce}-${i}`
      const t0 = performance.now()
      const res = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(2500) })
      const t1 = performance.now()
      // the edge answers JSON; an SPA fallback page (vite preview, a proxy) is not the edge
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) continue
      await res.text() // the timing entry lands once the body is read
      const e = timings(url).at(-1)
      samples.push(Math.round(e && e.requestStart > 0 && e.responseStart > e.requestStart ? e.responseStart - e.requestStart : t1 - t0))
    } catch {
      /* a dropped ping is skipped, not counted */
    }
  }
  return samples.length >= 2 ? samples : null
}

/** Median RTT; jitter = mean |Δ| between consecutive samples (RFC 3550 style). Whole ms. */
export function summarize(samples: number[]): { median: number; jitter: number; min: number; max: number } {
  const sorted = [...samples].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  const deltas = samples.slice(1).map((s, i) => Math.abs(s - samples[i]))
  return {
    median: Math.round(median),
    jitter: Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length),
    min: sorted[0],
    max: sorted.at(-1)!,
  }
}

export const sky = (jitterMs: number): Sky => (jitterMs < 5 ? 'calm' : jitterMs < 20 ? 'breezy' : 'gusty')

/** How much the request's fringe shimmers: 0 (steady link) … 1 (30 ms+ of jitter). */
export const shimmerFrom = (jitterMs: number) => Math.min(1, Math.max(0, jitterMs / 30))
