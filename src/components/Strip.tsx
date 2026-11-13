import { useEffect, useRef } from 'react'
import { SCENES } from '../lib/strips'

// scenes start mid-loop, so the first frame (and the reduced-motion still) already shows the idea
const START = 7.3

/** The live strip under a project's name; with `film`, the same scene filling a pinned stage. Decorative: the section's copy carries the meaning. */
export function Strip({ id, film = false }: { id: keyof typeof SCENES; film?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const g = c.getContext('2d')
    if (!g) return
    const css = getComputedStyle(c)
    const ink = {
      paper: css.getPropertyValue(film ? '--ink' : '--paper').trim(),
      accent: css.getPropertyValue(film ? '--paper' : '--hue').trim() || css.getPropertyValue('--volt').trim(),
      fault: css.getPropertyValue('--fault').trim(),
      mono: css.getPropertyValue('--mono').trim(),
    }
    const scene = SCENES[id]
    let w = 0,
      h = 0,
      t = START,
      raf = 0,
      last = 0,
      onScreen = false
    const draw = () => {
      if (!w || !h) return // hidden (a featured project's own strip): nothing to draw on
      g.clearRect(0, 0, w, h)
      g.save()
      scene(g, w, h, t, ink)
      g.restore()
    }
    const size = () => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1)
      // a film is the strip's scene at poster size: about 120 units tall, but never narrower than a phone's strip
      const zoom = film ? Math.min(r.height / 120, r.width / 320) : 1
      w = r.width / zoom
      h = r.height / zoom
      c.width = r.width * dpr
      c.height = r.height * dpr
      g.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0)
      draw()
    }
    const ro = new ResizeObserver(size)
    ro.observe(c)
    size()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => ro.disconnect()

    const frame = (now: number) => {
      t += Math.min(0.05, (now - last) / 1000 || 0)
      last = now
      draw()
      raf = onScreen && !document.hidden ? requestAnimationFrame(frame) : 0
    }
    const wake = () => {
      if (!raf && onScreen && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      wake()
    })
    io.observe(c)
    document.addEventListener('visibilitychange', wake)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
    }
  }, [id, film])
  return <canvas ref={ref} className={film ? 'reel' : 'strip'} aria-hidden="true" />
}
