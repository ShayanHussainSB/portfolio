import { useEffect, useRef } from 'react'
import { content } from '../content'
import { fixedWindow, GATES, laneY } from '../lib/stream'

const GATE_IDS = ['hitlimit', 'bunway', 'state', 'kaput'] as const
const LIMIT = 22 // admitted per second at the hitlimit gate; ambient traffic stays under it
const MAX = 420

interface P {
  x: number
  lane: number
  v: number // px per second
  len: number
  you: boolean
  checked: boolean
  fall: number // 0 while on the route; px fallen once refused
}

/**
 * The hero: traffic drawn live. Requests run left to right through the four
 * projects; flood it and the limiter turns the overflow away. The visitor's own
 * request is the one bright streak. Decorative for assistive tech: the gate
 * links and the caption carry the meaning.
 */
export function Stream({ city }: { city: string | null }) {
  const s = content.stream
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const tag = useRef<HTMLSpanElement>(null)
  const refused = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = wrap.current!
    const c = canvas.current!
    const g = c.getContext('2d')
    if (!g) return
    const css = getComputedStyle(el)
    const [white, volt, fault] = ['--paper', '--volt', '--fault'].map((v) => css.getPropertyValue(v).trim())
    // past each gate, traffic takes that project's hue
    const hues = GATE_IDS.map((id) => css.getPropertyValue(`--hue-${id}`).trim())
    const tint = (x: number) => {
      let k = -1
      while (k + 1 < GATES.length && x >= GATES[k + 1] * w) k++
      return k < 0 ? white : hues[k]
    }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0,
      h = 0,
      lanes = 0,
      pad = 0
    let guide: HTMLCanvasElement | null = null
    let ps: P[] = []
    let acc = 0,
      clock = 0,
      turnedAway = 0,
      shownAway = -1
    let admit = fixedWindow(LIMIT, 1000)
    const y = (x: number, lane: number) => laneY(x, lane, lanes, w, h, pad)

    const spawn = (lane: number, fast = false, you = false) => {
      if (ps.length >= MAX) return
      const v = (w / (you ? 11 : 6.5)) * (fast ? 1.7 : 0.8 + Math.random() * 0.5)
      ps.push({ x: you ? 0 : -Math.random() * 40, lane, v, len: you ? 170 : 40 + v * 0.3, you, checked: false, fall: 0 })
    }

    const size = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1)
      w = r.width
      h = r.height
      lanes = w < 700 ? 13 : 25
      pad = h * 0.09
      c.width = w * dpr
      c.height = h * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      // the fixed drawing (lanes and gates), cached
      guide = document.createElement('canvas')
      guide.width = c.width
      guide.height = c.height
      const d = guide.getContext('2d')!
      d.setTransform(dpr, 0, 0, dpr, 0, 0)
      d.strokeStyle = white
      d.lineWidth = 1
      d.globalAlpha = 0.16
      for (let i = 0; i < lanes; i++) {
        d.beginPath()
        for (let x = 0; x <= w; x += 12) d.lineTo(x, y(x, i))
        d.lineTo(w, h / 2)
        d.stroke()
      }
      d.globalAlpha = 0.9
      d.lineWidth = 1.5
      const [g1, g2, g3, g4] = GATES.map((f) => Math.round(f * w))
      d.beginPath() // hitlimit: one hard line
      d.moveTo(g1, 0)
      d.lineTo(g1, h)
      for (let k = 0; k < 4; k++) {
        // bunWay: four films
        d.moveTo(g2 + k * 9, pad * 0.4)
        d.lineTo(g2 + k * 9, h - pad * 0.4)
      }
      d.stroke()
      d.beginPath() // Honeycomb: the root
      for (let k = 0; k < 6; k++) d.lineTo(g3 + 13 * Math.cos((k * Math.PI) / 3 + Math.PI / 6), h / 2 + 13 * Math.sin((k * Math.PI) / 3 + Math.PI / 6))
      d.closePath()
      d.fillStyle = css.getPropertyValue('--ground').trim()
      d.fill()
      d.stroke()
      d.beginPath() // kaput: the switch
      d.arc(g4, h / 2, 9, 0, Math.PI * 2)
      d.fill()
      d.stroke()
      d.beginPath()
      d.moveTo(g4, h / 2 - 22)
      d.lineTo(g4, h / 2 + 22)
      d.stroke()
    }

    const step = (dt: number) => {
      clock += dt * 1000
      acc += dt * 13
      while (acc > 1) {
        acc--
        spawn(Math.floor(Math.random() * lanes))
      }
      if (!ps.some((p) => p.you)) spawn(Math.round(lanes * 0.36), false, true)
      const g1 = GATES[0] * w
      for (const p of ps) {
        if (p.fall) {
          p.x += p.v * 0.3 * dt
          p.fall += (50 + p.fall * 2.6) * dt
          continue
        }
        p.x += p.v * dt
        if (!p.checked && p.x >= g1) {
          p.checked = true
          if (!p.you && !admit(clock)) {
            p.fall = 0.01
            turnedAway++
          }
        }
      }
      ps = ps.filter((p) => (p.fall ? p.fall < h * 0.6 : p.x - p.len < w + (p.you ? w * 0.12 : 0)))
    }

    const draw = () => {
      g.clearRect(0, 0, w, h)
      if (guide) g.drawImage(guide, 0, 0, w, h)
      g.lineCap = 'round'
      let me: P | undefined
      for (const p of ps) {
        if (p.you) {
          me = p
          continue
        }
        const hy = y(p.x, p.lane)
        if (p.fall) {
          g.globalAlpha = Math.max(0, 1 - p.fall / (h * 0.5))
          g.strokeStyle = fault
          g.lineWidth = 2
          g.beginPath()
          g.moveTo(p.x - 7, hy + p.fall - 16)
          g.lineTo(p.x, hy + p.fall)
          g.stroke()
          continue
        }
        const grad = g.createLinearGradient(p.x - p.len, 0, p.x, 0)
        grad.addColorStop(0, 'rgba(255,255,255,0)')
        grad.addColorStop(1, tint(p.x))
        g.globalAlpha = p.x > GATES[2] * w ? 0.7 : 0.95
        g.strokeStyle = grad
        g.lineWidth = 2
        g.beginPath()
        for (let k = 0; k <= 5; k++) {
          const x = p.x - p.len + (p.len * k) / 5
          g.lineTo(x, y(x, p.lane))
        }
        g.stroke()
      }
      g.globalAlpha = 1
      if (me) {
        const hx = Math.min(me.x, w)
        const grad = g.createLinearGradient(hx - me.len, 0, hx, 0)
        grad.addColorStop(0, 'rgba(255,255,255,0)')
        grad.addColorStop(1, volt)
        g.strokeStyle = grad
        g.lineWidth = 3.5
        g.beginPath()
        for (let k = 0; k <= 10; k++) {
          const x = hx - me.len + (me.len * k) / 10
          g.lineTo(x, y(x, me.lane))
        }
        g.stroke()
        g.fillStyle = volt
        g.beginPath()
        g.arc(hx, y(hx, me.lane), 5, 0, Math.PI * 2)
        g.fill()
        if (tag.current) {
          tag.current.style.transform = `translate(${hx}px, ${y(hx, me.lane)}px)`
          tag.current.dataset.flip = String(hx + 24 + tag.current.firstElementChild!.clientWidth > w)
        }
      }
      if (turnedAway !== shownAway && refused.current) {
        shownAway = turnedAway
        refused.current.textContent = turnedAway ? s.rejected(turnedAway) : ''
      }
    }

    size()
    // start mid-flow, so the first frame is already a full stream
    for (let i = 0; i < 420; i++) step(1 / 60)
    draw()
    if (still) return

    let raf = 0,
      last = 0,
      onScreen = true
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0)
      last = t
      step(dt)
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
    io.observe(el)
    document.addEventListener('visibilitychange', wake)
    const ro = new ResizeObserver(() => {
      size()
      draw()
    })
    ro.observe(el)

    let lastFlood = 0
    const flood = (e: PointerEvent) => {
      if (e.timeStamp - lastFlood < 28) return
      lastFlood = e.timeStamp
      const r = el.getBoundingClientRect()
      const lane = Math.round(((e.clientY - r.top - pad) / (h - 2 * pad)) * (lanes - 1))
      for (let k = -1; k <= 1; k++) spawn(Math.min(lanes - 1, Math.max(0, lane + k)), true)
    }
    el.addEventListener('pointermove', flood)
    el.addEventListener('pointerdown', flood)
    wake()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
      el.removeEventListener('pointermove', flood)
      el.removeEventListener('pointerdown', flood)
    }
  }, [s])

  return (
    <div className="stream">
      <nav className="stream__gates" aria-label="Projects, in the order a request meets them">
        {GATE_IDS.map((id, i) => (
          <a
            key={id}
            href={(content.featured as readonly string[]).includes(id) ? `#${id}` : `#all-${id}`}
            style={{ left: `${GATES[i] * 100}%`, borderLeftColor: `var(--hue-${id})` }}
          >
            <b>{content.projects[id].name}</b>
            <span>{content.projects[id].kind}</span>
          </a>
        ))}
      </nav>
      <div className="stream__field" ref={wrap}>
        <canvas ref={canvas} aria-hidden="true" />
        <span className="stream__you" ref={tag} aria-hidden="true">
          <i>{city ? s.youFrom(city) : s.you}</i>
        </span>
        <span className="stream__refused" ref={refused} style={{ left: `${GATES[0] * 100}%` }} aria-hidden="true" />
        <span className="stream__done" aria-hidden="true">
          {s.done}
        </span>
      </div>
      <p className="sr-only">{s.label}</p>
    </div>
  )
}
