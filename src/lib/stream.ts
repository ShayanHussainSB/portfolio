/** The hero drawing's limiter: a fixed window, like hitlimit. `limit` admits per `windowMs`, then all refused until the window turns. */
export function fixedWindow(limit: number, windowMs: number) {
  let start = -Infinity
  let count = 0
  return (now: number): boolean => {
    if (now - start >= windowMs) {
      start = now
      count = 0
    }
    return ++count <= limit
  }
}

/** Where the four projects sit along the stream, as fractions of its width. */
export const GATES = [0.2, 0.42, 0.68, 0.86] as const

const smooth = (t: number) => t * t * (3 - 2 * t)

/** A lane's height at x: lanes run parallel, then fold into one line at Honeycomb (many records, one root). */
export function laneY(x: number, lane: number, lanes: number, w: number, h: number, pad: number): number {
  const y0 = pad + (lane * (h - 2 * pad)) / (lanes - 1)
  const a = w * (GATES[1] + 0.06)
  const t = Math.min(1, Math.max(0, (x - a) / (w * GATES[2] - a)))
  return y0 + (h / 2 - y0) * smooth(t)
}
