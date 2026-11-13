/**
 * "It knew my request": what the edge saw of the visitor, plus the round-trip
 * measured from the browser. Never fails: an unreachable edge (ad-blocker,
 * offline, `vite dev` without the mock) falls back to the browser's timezone.
 */
export interface EdgeInfo {
  id: string
  city: string
  country: string
  region: string
}

export interface Observation {
  id: string
  city: string
  country: string | null
  region: string | null
  rttMs: number | null
  localTime: string
  source: 'edge' | 'fallback'
}

const randomId = () =>
  Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, '0')
    .toUpperCase()

/** `x-vercel-id` looks like `bom1::iad1::abcde-1700000000000-7f3a9c2b`. */
export function parseVercelId(h: string | null): { region: string | null; id: string } {
  if (!h) return { region: null, id: randomId() }
  const parts = h.split('::')
  const region = /^[a-z]{3}\d$/.test(parts[0]) ? parts[0] : null
  const tail = (parts.at(-1) ?? '').replace(/[^0-9a-f]/gi, '')
  return { region, id: tail.length >= 4 ? tail.slice(-4).toUpperCase() : randomId() }
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export function buildObservation(edge: Partial<EdgeInfo> | null, rttMs: number | null, now: Date, tz: string): Observation {
  const localTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now)
  const tzCity = (tz.split('/').at(-1) ?? tz).replace(/_/g, ' ')
  const fromEdge = Boolean(edge?.city || edge?.region)
  return {
    id: edge?.id || randomId(),
    city: edge?.city ? decode(edge.city) : tzCity,
    country: edge?.country || null,
    region: edge?.region || null,
    rttMs: fromEdge ? rttMs : null,
    localTime,
    source: fromEdge ? 'edge' : 'fallback',
  }
}

/** Ask the edge who we are; time the round trip. Resolves within ~2.5 s, always. */
export async function fetchObservation(): Promise<Observation> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  try {
    const t0 = performance.now()
    const res = await fetch('/api/whoami', { cache: 'no-store', signal: AbortSignal.timeout(2500) })
    const rtt = Math.round(performance.now() - t0)
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(`whoami ${res.status}`)
    return buildObservation((await res.json()) as Partial<EdgeInfo>, rtt, new Date(), tz)
  } catch {
    return buildObservation(null, null, new Date(), tz)
  }
}

/** mailto whose subject carries the visitor's request id and city. */
export function replyHref(email: string, id?: string, city?: string): string {
  const subject = id ? `Re: request ${id}${city ? ` from ${city}` : ''}` : 'Hello Shayan'
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}
