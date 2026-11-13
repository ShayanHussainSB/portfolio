/**
 * A model of Usher's seat and gate rules for Sheet 06. In Usher, Postgres enforces them (a partial unique
 * index on a show's sold seats; a scan that marks a ticket used in one update). Here a Map stands in for the
 * table. Money is integer paisa; formatPaisa is copied from usher's packages/core/src/money.ts.
 */
export type Paisa = number

const wholeRupees = new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0 })
const withPaisa = new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 })
export function formatPaisa(paisa: Paisa): string {
  if (!Number.isSafeInteger(paisa)) throw new RangeError(`Paisa must be a safe integer, got ${paisa}`)
  const rupees = Math.abs(paisa) / 100
  return `${paisa < 0 ? '-' : ''}Rs ${(paisa % 100 === 0 ? wholeRupees : withPaisa).format(rupees)}`
}

export interface Ticket {
  seat: string
  counter: number
  price: Paisa
  token: string
  receipt: string
  scannedAt: number | null
}
export type Sale = { ok: true; ticket: Ticket } | { ok: false; seat: string; counter: number }
export type Scan = { kind: 'admit'; ticket: Ticket } | { kind: 'used'; ticket: Ticket } | { kind: 'receipt' } | { kind: 'unknown' }

const token = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')

export function createShow(prices: (seat: string) => Paisa) {
  const sold = new Map<string, Ticket>() // stands in for UNIQUE (show_id, seat_id) WHERE status = 'sold'
  const byToken = new Map<string, Ticket>()
  const receipts = new Set<string>()
  return {
    sold,
    /** First write wins; the second counter is refused, as the index refuses the second insert. */
    sell(seat: string, counter: number): Sale {
      if (sold.has(seat)) return { ok: false, seat, counter }
      const t: Ticket = { seat, counter, price: prices(seat), token: token(), receipt: token(), scannedAt: null }
      sold.set(seat, t)
      byToken.set(t.token, t)
      receipts.add(t.receipt)
      return { ok: true, ticket: t }
    },
    /** One update: mark used only if not used yet. */
    scan(code: string, now = Date.now()): Scan {
      if (receipts.has(code)) return { kind: 'receipt' }
      const t = byToken.get(code)
      if (!t) return { kind: 'unknown' }
      if (t.scannedAt !== null) return { kind: 'used', ticket: t }
      t.scannedAt = now
      return { kind: 'admit', ticket: t }
    },
  }
}
