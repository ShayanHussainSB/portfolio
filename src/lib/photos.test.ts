import { describe, expect, it } from 'vitest'
import { buildSrcSet } from './photos'

const files = {
  '../assets/photos/horizon-1000.webp': '/a/horizon-1000-x.webp',
  '../assets/photos/horizon-600.webp': '/a/horizon-600-x.webp',
  '../assets/photos/horizon-wide-1280.webp': '/a/horizon-wide-1280-x.webp',
  '../assets/photos/horizon-600.avif': '/a/horizon-600-x.avif',
}

describe('buildSrcSet', () => {
  it('lists one format of one photo, smallest first, with w descriptors', () => {
    expect(buildSrcSet(files, 'horizon', 'webp')).toBe('/a/horizon-600-x.webp 600w, /a/horizon-1000-x.webp 1000w')
  })
  it('does not confuse "horizon" with "horizon-wide"', () => {
    expect(buildSrcSet(files, 'horizon-wide', 'webp')).toBe('/a/horizon-wide-1280-x.webp 1280w')
  })
})
