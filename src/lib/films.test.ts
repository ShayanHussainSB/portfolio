import { afterEach, describe, expect, it, vi } from 'vitest'
import { LAYERS, runChain, type Layer } from './films'

const all = (v: boolean) => Object.fromEntries(LAYERS.map((l) => [l, v])) as Record<Layer, boolean>
const ORIGIN = 'https://visitor.example'
const header = (hs: [string, string][], name: string) => hs.find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1]

afterEach(() => vi.unstubAllGlobals())

describe('runChain: the published bunway@1.1.0 middleware, in order', () => {
  it('all films on: each layer leaves its real headers', () => {
    const { headers, errors } = runChain(all(true), ORIGIN)
    expect(errors).toEqual({})
    expect(header(headers, 'Access-Control-Allow-Origin')).toBe('*')
    expect(header(headers, 'Content-Security-Policy')).toBeTruthy()
    expect(header(headers, 'X-Frame-Options')).toBe('SAMEORIGIN')
    expect(header(headers, 'X-Request-Id')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(header(headers, 'X-Response-Time')).toMatch(/^\d+\.\d{3}ms$/)
  })

  it('cors off: no Access-Control-Allow-Origin', () => {
    expect(header(runChain({ ...all(true), cors: false }, ORIGIN).headers, 'Access-Control-Allow-Origin')).toBeUndefined()
  })

  it('helmet off: no Content-Security-Policy', () => {
    expect(header(runChain({ ...all(true), helmet: false }, ORIGIN).headers, 'Content-Security-Policy')).toBeUndefined()
  })

  it('all off: a bare response, no errors', () => {
    expect(runChain(all(false), ORIGIN)).toEqual({ headers: [], errors: {} })
  })

  it('a layer that throws (no crypto.randomUUID) is reported; the rest still run', () => {
    vi.stubGlobal('crypto', { randomUUID: () => { throw new Error('insecure context') } })
    const { headers, errors } = runChain(all(true), ORIGIN)
    expect(errors.requestId).toMatch(/insecure context/)
    expect(header(headers, 'Access-Control-Allow-Origin')).toBe('*')
    expect(header(headers, 'Content-Security-Policy')).toBeTruthy()
  })
})
