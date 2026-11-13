import { useEffect, type RefObject } from 'react'

/** How far a taller-than-the-viewport element has been scrolled through: 0 when its top meets the viewport's top, 1 when its bottom meets the bottom. */
export function progress(el: Element): number {
  const r = el.getBoundingClientRect()
  const span = r.height - innerHeight
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
}

/** Keep `--p` on the element equal to its scroll progress, so CSS can scrub against it in every browser. */
export function useProgressVar(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const set = () => {
      raf = 0
      el.style.setProperty('--p', progress(el).toFixed(4))
    }
    const on = () => void (raf ||= requestAnimationFrame(set))
    set()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', on)
      removeEventListener('resize', on)
    }
  }, [ref])
}
