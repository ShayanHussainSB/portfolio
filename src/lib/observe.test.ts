import { describe, expect, it } from 'vitest'
import { buildObservation, parseVercelId, replyHref } from './observe'

const NOW = new Date('2026-11-12T13:42:00Z')

describe('parseVercelId', () => {
  it('takes the edge region from the first segment and a 4-hex id from the end', () => {
    expect(parseVercelId('bom1::iad1::abcde-1700000000000-7f3a9c2b')).toEqual({ region: 'bom1', id: '9C2B' })
  })
  it('missing header: no region, still a 4-hex id', () => {
    const r = parseVercelId(null)
    expect(r.region).toBeNull()
    expect(r.id).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe('buildObservation', () => {
  it('decodes URL-encoded city headers', () => {
    const o = buildObservation({ city: 'S%C3%A3o%20Paulo', region: 'gru1', id: '7F3A' }, 84, NOW, 'America/Sao_Paulo')
    expect(o.city).toBe('São Paulo')
    expect(o).toMatchObject({ region: 'gru1', id: '7F3A', rttMs: 84, source: 'edge' })
  })
  it('falls back to the timezone city and local time when the edge is unreachable', () => {
    const o = buildObservation(null, null, NOW, 'Asia/Karachi')
    expect(o).toMatchObject({ city: 'Karachi', region: null, source: 'fallback', localTime: '18:42' })
    expect(JSON.stringify(o)).not.toContain('undefined')
  })
  it('timezone city with underscores reads as words', () => {
    expect(buildObservation(null, null, NOW, 'America/New_York').city).toBe('New York')
  })
  it('malformed percent-encoding does not throw', () => {
    expect(buildObservation({ city: '%E0%A4%A' }, 10, NOW, 'UTC').city).toBe('%E0%A4%A')
  })
})

describe('replyHref', () => {
  it('pre-addresses the reply with the request id and city', () => {
    expect(replyHref('a@b.co', '7F3A', 'Karachi')).toBe('mailto:a@b.co?subject=Re%3A%20request%207F3A%20from%20Karachi')
  })
  it('without an observation, a plain subject', () => {
    expect(replyHref('a@b.co')).toBe('mailto:a@b.co?subject=Hello%20Shayan')
  })
})
