import { keccak_256 } from '@noble/hashes/sha3.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildTree, DEPTH, hex, LEAVES, proofFor, record, verify } from './merkle'

const utf8 = (s: string) => new TextEncoder().encode(s)

describe('hash function', () => {
  it('is Keccak-256 (Solana concurrent Merkle trees), not SHA3-256', () => {
    expect(hex(keccak_256(new Uint8Array()))).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  })
})

describe('buildTree', () => {
  it('2 leaves: root = keccak256(keccak256("a") ‖ keccak256("b"))', () => {
    const [a, b] = [keccak_256(utf8('a')), keccak_256(utf8('b'))]
    const levels = buildTree([a, b])
    const both = new Uint8Array(64)
    both.set(a, 0)
    both.set(b, 32)
    expect(hex(levels.at(-1)![0])).toBe(hex(keccak_256(both)))
  })
})

describe('4,096 records', () => {
  let levels: Uint8Array[][]
  beforeAll(() => {
    levels = buildTree(Array.from({ length: LEAVES }, (_, i) => keccak_256(utf8(record(i)))))
  })

  it('has 13 levels: 4,096 leaves condense to 1 root', () => {
    expect(levels).toHaveLength(DEPTH + 1)
    expect(levels[0]).toHaveLength(4096)
    expect(levels[DEPTH]).toHaveLength(1)
  })

  it('a proof is 12 sibling hashes, and it verifies', () => {
    const p = proofFor(levels, 2731)
    expect(p.siblings).toHaveLength(12)
    expect(verify(record(2731), 2731, p.siblings, levels[DEPTH][0])).toEqual({ ok: true, hashes: 13 })
  })

  it('a tampered record fails', () => {
    const p = proofFor(levels, 2731)
    expect(verify(record(2731) + ' ', 2731, p.siblings, levels[DEPTH][0]).ok).toBe(false)
  })

  it('the right proof at the wrong index fails', () => {
    const p = proofFor(levels, 2731)
    expect(verify(record(2731), 2730, p.siblings, levels[DEPTH][0]).ok).toBe(false)
  })

  it('clamps the index (range inputs hand over strings)', () => {
    expect(proofFor(levels, '9999').index).toBe(4095)
    expect(proofFor(levels, -3).index).toBe(0)
    expect(proofFor(levels, '17.8').index).toBe(17)
  })
})

describe('the numbers in the copy are the tree that runs', () => {
  it('content.stops.state names LEAVES, DEPTH and 2·LEAVES−1 hashes', async () => {
    const { content } = await import('../content')
    const t = content.stops.state
    const f = (n: number) => n.toLocaleString('en-US')
    expect(t.sentence).toContain(f(LEAVES))
    expect(t.verified).toContain(`${DEPTH} proof hashes, not ${f(LEAVES)}`)
    expect(t.built(1)).toContain(`${f(2 * LEAVES - 1)} Keccak-256 hashes`)
  })
})
