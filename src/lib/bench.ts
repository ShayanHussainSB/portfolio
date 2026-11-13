import { content } from '../content'

/** Run `step` for `ms` of wall time; the clock is read every 1,024 steps so it doesn't dominate. */
export function runFor(ms: number, step: () => void, now: () => number): number {
  const start = now()
  let n = 0
  do {
    for (let i = 0; i < 1024; i++) step()
    n += 1024
  } while (now() - start < ms)
  return n
}

export const formatChecks = (n: number) => content.stops.hitlimit.bench(new Intl.NumberFormat('en-US').format(n))
