/**
 * The Solana journey's illustrative ledger, hash-linked for real:
 * hash = keccak256(prev ‖ utf8(year + ' ' + headline)), the first prev being 32 zero bytes.
 */
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

export interface Block {
  year: string
  headline: string
}
export interface Linked extends Block {
  height: number
  hash: string
  prev: string
}

const utf8 = new TextEncoder()

export function link(blocks: readonly Block[]): Linked[] {
  let prev = '0'.repeat(64)
  return blocks.map((b, height) => {
    const msg = utf8.encode(`${b.year} ${b.headline}`)
    const buf = new Uint8Array(32 + msg.length)
    buf.set(hexToBytes(prev))
    buf.set(msg, 32)
    const hash = bytesToHex(keccak_256(buf))
    const out = { ...b, height, hash, prev }
    prev = hash
    return out
  })
}

export const short = (hex: string) => `0x${hex.slice(0, 4)}…${hex.slice(-4)}`
