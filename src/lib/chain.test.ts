import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { describe, expect, it } from 'vitest'
import { link, short, type Block } from './chain'

const a: Block = { year: '2022', headline: 'Sol Patrol.' }
const b: Block = { year: '2023', headline: 'Mad Lads.' }

describe('link', () => {
  it('starts from a zero hash at height 0', () => {
    const [first] = link([a, b])
    expect(first.prev).toBe('0'.repeat(64))
    expect(first.height).toBe(0)
  })

  it('links each block to the hash of the one before', () => {
    const [first, second] = link([a, b])
    expect(second.prev).toBe(first.hash)
    expect(second.height).toBe(1)
  })

  it('hashes keccak256(prev ‖ "year headline")', () => {
    const msg = new TextEncoder().encode('2022 Sol Patrol.')
    const buf = new Uint8Array(32 + msg.length)
    buf.set(msg, 32)
    expect(link([a])[0].hash).toBe(bytesToHex(keccak_256(buf)))
  })

  it('a changed headline changes every later hash', () => {
    const base = link([a, b])
    const edited = link([{ ...a, headline: 'Sol Patrol!' }, b])
    expect(edited[0].hash).not.toBe(base[0].hash)
    expect(edited[1].hash).not.toBe(base[1].hash)
  })
})

describe('short', () => {
  it('shows the first and last four hex chars', () => {
    expect(short('ab12' + '0'.repeat(56) + 'cd34')).toBe('0xab12…cd34')
  })
})
