import { expect, test } from 'vitest'
import { createShow, formatPaisa } from './usher'

test('a seat sells once; the second counter is refused', () => {
  const show = createShow(() => 120000)
  const a = show.sell('C4', 1)
  const b = show.sell('C4', 2)
  expect(a.ok).toBe(true)
  expect(b).toEqual({ ok: false, seat: 'C4', counter: 2 })
})

test('a ticket QR admits once; a receipt QR is turned away', () => {
  const show = createShow(() => 120000)
  const sale = show.sell('C4', 1)
  if (!sale.ok) throw new Error('sale failed')
  expect(show.scan(sale.ticket.token, 1).kind).toBe('admit')
  expect(show.scan(sale.ticket.token, 2)).toMatchObject({ kind: 'used', ticket: { scannedAt: 1 } })
  expect(show.scan(sale.ticket.receipt).kind).toBe('receipt')
})

test('formatPaisa matches usher core', () => {
  expect(formatPaisa(120000)).toBe('Rs 1,200')
  expect(formatPaisa(120050)).toBe('Rs 1,200.50')
})
