import { describe, expect, it } from 'vitest'
import { formatChecks, runFor } from './bench'

describe('runFor', () => {
  it('runs steps until the clock says the time is up, reading the clock every 1,024 steps', () => {
    let t = 0
    const now = () => t++ // 1 ms per clock read
    let steps = 0
    expect(runFor(10, () => void steps++, now)).toBe(10 * 1024)
    expect(steps).toBe(10 * 1024)
  })
})

describe('formatChecks', () => {
  it('groups thousands', () => {
    expect(formatChecks(4812330)).toContain('4,812,330')
  })
})
