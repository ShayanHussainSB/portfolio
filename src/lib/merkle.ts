/**
 * Sheet 04: a real Merkle tree, built in the visitor's browser. Hashing follows
 * Solana's concurrent Merkle trees (spl-account-compression): Keccak-256,
 * leaf = keccak(data), node = keccak(left ‖ right). The 4,096 leaves are
 * generated example profiles, not Honeycomb data.
 */
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'

export const DEPTH = 12
export const LEAVES = 2 ** DEPTH // 4,096

const utf8 = new TextEncoder()
const pair = (l: Uint8Array, r: Uint8Array) => {
  const b = new Uint8Array(l.length + r.length)
  b.set(l, 0)
  b.set(r, l.length)
  return keccak_256(b)
}

/** An example record (leaf data). */
export const record = (i: number) => `profile #${i}`
export const leafHash = (data: string) => keccak_256(utf8.encode(data))

/** levels[0] = leaf hashes … levels[at(-1)] = [root]. Leaves must be a power of two. */
export function buildTree(leaves: Uint8Array[]): Uint8Array[][] {
  const levels = [leaves]
  while (levels.at(-1)!.length > 1) {
    const below = levels.at(-1)!
    levels.push(Array.from({ length: below.length / 2 }, (_, i) => pair(below[2 * i], below[2 * i + 1])))
  }
  return levels
}

/** The sibling at every level from leaf to root. The index is clamped (range inputs hand over strings). */
export function proofFor(levels: Uint8Array[][], index: number | string): { index: number; siblings: Uint8Array[] } {
  const n = levels[0].length
  const i = Math.min(n - 1, Math.max(0, Math.trunc(Number(index)) || 0))
  return { index: i, siblings: levels.slice(0, -1).map((level, k) => level[(i >> k) ^ 1]) }
}

/** Recompute the root from the record and its proof. `hashes` = how many hashes that took. */
export function verify(data: string, index: number, siblings: Uint8Array[], root: Uint8Array): { ok: boolean; hashes: number } {
  let h = leafHash(data)
  siblings.forEach((s, k) => (h = (index >> k) & 1 ? pair(s, h) : pair(h, s)))
  return { ok: bytesToHex(h) === bytesToHex(root), hashes: 1 + siblings.length }
}

/** Hex, optionally only the first `n` bytes (for display). */
export const hex = (b: Uint8Array, n?: number) => bytesToHex(n ? b.subarray(0, n) : b)
