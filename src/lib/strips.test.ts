import { expect, test } from 'vitest'
import { SCENES } from './strips'

// a context that accepts every call and records how many were drawing calls
function fakeContext() {
  let calls = 0
  const g = new Proxy({} as Record<string, unknown>, {
    get: (o, k) => (k in o ? o[k as string] : () => void calls++),
    set: (o, k, v) => ((o[k as string] = v), true),
  })
  return { g: g as unknown as CanvasRenderingContext2D, calls: () => calls }
}

test('every strip draws something at any moment, at phone and desktop widths, without throwing', () => {
  const ink = { paper: '#fff', accent: '#df4', fault: '#f64', mono: 'monospace' }
  for (const [name, scene] of Object.entries(SCENES))
    for (const w of [340, 1150])
      for (let t = 0; t < 60; t += 0.37) {
        const { g, calls } = fakeContext()
        scene(g, w, 64, t, ink)
        expect(calls(), `${name} at w=${w}, t=${t.toFixed(2)}`).toBeGreaterThan(3)
      }
})
