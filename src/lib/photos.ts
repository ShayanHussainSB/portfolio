/**
 * Responsive photo sources. Files live in src/assets/photos as
 * `<name>-<width>.<avif|webp|jpg>` (made from photos-original/ with GPS and
 * device metadata stripped; see README "Photos").
 */
export type PhotoExt = 'avif' | 'webp' | 'jpg'

export function buildSrcSet(files: Record<string, string>, name: string, ext: PhotoExt): string {
  const re = new RegExp(`/${name}-(\\d+)\\.${ext}$`)
  return Object.entries(files)
    .flatMap(([path, url]) => {
      const m = path.match(re)
      return m ? [[Number(m[1]), url] as const] : []
    })
    .sort((a, b) => a[0] - b[0])
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ')
}

const FILES = import.meta.glob('../assets/photos/*.{avif,webp,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const srcSet = (name: string, ext: PhotoExt) => buildSrcSet(FILES, name, ext)

/** The largest JPEG of a photo, for the <img> fallback. */
export const fallbackSrc = (name: string) => srcSet(name, 'jpg').split(', ').at(-1)!.split(' ')[0]

/** Props for a small avatar (≤ 80 CSS px): the browser picks the smallest JPEG that fits, loaded lazily. */
export const thumb = (name: string) => ({
  src: fallbackSrc(name),
  srcSet: srcSet(name, 'jpg'),
  sizes: '80px',
  loading: 'lazy' as const,
  decoding: 'async' as const,
})
