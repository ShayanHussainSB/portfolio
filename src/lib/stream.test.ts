import { expect, it } from 'vitest'
import { fixedWindow, GATES, laneY } from './stream'

it('fixedWindow admits `limit` per window and resets all at once', () => {
  const admit = fixedWindow(2, 1000)
  expect([admit(0), admit(10), admit(20), admit(999)]).toEqual([true, true, false, false])
  expect(admit(1000)).toBe(true)
})

it('lanes run parallel before bunWay and meet in the middle at Honeycomb', () => {
  expect(laneY(0, 0, 10, 1000, 200, 20)).toBe(20)
  expect(laneY(1000 * GATES[2], 0, 10, 1000, 200, 20)).toBe(100)
  expect(laneY(1000, 9, 10, 1000, 200, 20)).toBe(100)
})
