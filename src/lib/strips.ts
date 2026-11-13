/**
 * The live strip under each project name: one looping scene per project, acting out what it does.
 * Every scene is a pure function of time t (seconds), so a frame can be drawn at any t: reduced motion
 * draws one still frame, and nothing carries state between frames.
 */
export interface Ink {
  paper: string
  accent: string
  fault: string
  mono: string
}
type G = CanvasRenderingContext2D
type Scene = (g: G, w: number, h: number, t: number, ink: Ink) => void

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => clamp(x) * clamp(x) * (3 - 2 * clamp(x))
const dot = (g: G, x: number, y: number, r: number) => {
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}
const line = (g: G, x1: number, y1: number, x2: number, y2: number) => {
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(x2, y2)
  g.stroke()
}
const label = (g: G, ink: Ink, text: string, x: number, y: number, align: CanvasTextAlign = 'left') => {
  g.font = `10px ${ink.mono}`
  g.textAlign = align
  g.fillText(text, x, y)
}

/** hitlimit: requests reach a gate; a fixed window admits 5, then the rest bounce off until it resets. */
const hitlimit: Scene = (g, w, h, t, ink) => {
  const GAP = 0.42, TRAVEL = 1.4, WINDOW = 3.2, LIMIT = 5, CYCLE = 40
  const gate = w * 0.56, y = h / 2
  const at = (k: number) => k * GAP + TRAVEL + rand(k) * 0.3 // when request k reaches the gate
  // replay a cycle's arrivals through the window (it opens on the first request after the last one expired)
  const replay = (c: number, until: number) => {
    let start = -Infinity, count = 0
    const ok = new Map<number, boolean>()
    for (let k = c * CYCLE; k < (c + 1) * CYCLE && at(k) <= until; k++) {
      if (at(k) - start >= WINDOW) (start = at(k)), (count = 0)
      ok.set(k, ++count <= LIMIT)
    }
    return { ok, start, count }
  }
  const now = replay(Math.floor(Math.max(0, t - TRAVEL) / GAP / CYCLE), t)
  const n = Math.floor(t / GAP)
  g.lineWidth = 1.5
  g.strokeStyle = ink.paper
  line(g, gate, 6, gate, h - 6)
  // the window: five slots, and how much of it is left
  const open = t - now.start < WINDOW
  for (let i = 0; i < LIMIT; i++) {
    g.fillStyle = ink.accent
    g.strokeStyle = ink.paper
    g.globalAlpha = 0.9
    const sx = gate + 10 + i * 11, sy = 8
    if (open && i < now.count) g.fillRect(sx, sy, 8, 8)
    else g.strokeRect(sx + 0.5, sy + 0.5, 7, 7)
  }
  g.globalAlpha = 0.5
  if (open) line(g, gate + 10, 22, gate + 10 + 52 * (1 - (t - now.start) / WINDOW), 22)
  for (let k = Math.max(0, n - 10); k <= n; k++) {
    const s = t - k * GAP
    const reach = at(k) - k * GAP
    if (s < reach) {
      g.globalAlpha = 0.9
      g.fillStyle = ink.paper
      dot(g, (s / reach) * gate, y + (rand(k + 7) - 0.5) * h * 0.4 * (1 - s / reach), 3)
      continue
    }
    const after = s - reach
    if (replay(Math.floor(k / CYCLE), at(k)).ok.get(k)) {
      g.globalAlpha = clamp(1 - after / 1.6)
      g.fillStyle = ink.paper
      dot(g, gate + after * (gate / reach), y, 3)
    } else {
      g.globalAlpha = clamp(1 - after / 0.9)
      g.fillStyle = ink.fault
      dot(g, gate - after * 26, y + after * after * 90, 3)
    }
  }
  g.globalAlpha = 1
}

/** bunWay: each request picks up headers (ticks in its hue) as it passes the four middleware films. */
const bunway: Scene = (g, w, h, t, ink) => {
  const films = [0.3, 0.42, 0.54, 0.66].map((f) => f * w)
  g.strokeStyle = ink.paper
  g.fillStyle = ink.paper
  for (const fx of films) {
    g.globalAlpha = 0.08
    g.fillRect(fx - 5, 6, 10, h - 12)
    g.globalAlpha = 0.6
    g.lineWidth = 1
    g.strokeRect(fx - 5.5, 6.5, 11, h - 13)
  }
  const GAP = 1.1, TRAVEL = 4.2
  for (let k = Math.floor((t - TRAVEL) / GAP); k <= Math.floor(t / GAP); k++) {
    const x = ((t - k * GAP) / TRAVEL) * (w + 60) - 30
    const y = h / 2 + (rand(k) - 0.5) * h * 0.36
    const passed = films.filter((fx) => fx < x).length
    g.globalAlpha = 1
    g.strokeStyle = ink.accent
    g.lineWidth = 2
    for (let i = 0; i < passed; i++) line(g, x - 9 - i * 5, y - 4, x - 9 - i * 5, y + 4)
    g.fillStyle = ink.paper
    dot(g, x, y, 3.5)
  }
}

/** Honeycomb: 16 leaves hash up to one root; each cycle one leaf's proof climbs, siblings marked. */
const state: Scene = (g, w, h, t, ink) => {
  const DEPTH = 4, CYCLE = 3.6
  const c = Math.floor(t / CYCLE), u = (t % CYCLE) / CYCLE
  const leaf = Math.floor(rand(c) * 16)
  const span = Math.min(w - 48, 520), x0 = (w - span) / 2
  const pos = (L: number, i: number) => {
    const n = 1 << L
    return { x: x0 + (span * (i * n + (n - 1) / 2)) / 15, y: h - 8 - (L * (h - 18)) / DEPTH }
  }
  g.strokeStyle = ink.paper
  g.lineWidth = 1
  for (let L = 0; L < DEPTH; L++)
    for (let i = 0; i < 16 >> L; i++) {
      const a = pos(L, i), b = pos(L + 1, i >> 1)
      g.globalAlpha = 0.22
      line(g, a.x, a.y, b.x, b.y)
    }
  g.fillStyle = ink.paper
  for (let i = 0; i < 16; i++) {
    g.globalAlpha = 0.35 + 0.5 * rand(i + Math.floor(t * 6) * 16)
    const p = pos(0, i)
    dot(g, p.x, p.y, 2.2)
  }
  const reached = u * (DEPTH + 1.4)
  for (let L = 0; L < DEPTH && L < reached; L++) {
    const a = pos(L, leaf >> L), b = pos(L + 1, leaf >> (L + 1)), sib = pos(L, (leaf >> L) ^ 1)
    const part = clamp(reached - L)
    g.globalAlpha = 1
    g.strokeStyle = ink.accent
    g.lineWidth = 2
    line(g, a.x, a.y, a.x + (b.x - a.x) * part, a.y + (b.y - a.y) * part)
    g.strokeStyle = ink.paper
    g.lineWidth = 1.2
    g.beginPath()
    g.arc(sib.x, sib.y, 3.5, 0, Math.PI * 2)
    g.stroke()
  }
  const root = pos(DEPTH, 0)
  const lit = reached >= DEPTH
  g.globalAlpha = 1
  g.fillStyle = lit ? ink.accent : ink.paper
  const r = 6 + (lit ? 2 * Math.sin(clamp(reached - DEPTH) * Math.PI) : 0)
  g.beginPath()
  for (let k = 0; k < 6; k++) g.lineTo(root.x + r * Math.cos((k * Math.PI) / 3 + Math.PI / 6), root.y + r * Math.sin((k * Math.PI) / 3 + Math.PI / 6))
  g.closePath()
  g.fill()
  g.fillStyle = ink.accent
  dot(g, pos(0, leaf).x, pos(0, leaf).y, 3.2)
}

/** kaput: traffic flows into the server; SIGTERM closes the gate, in-flight work finishes, exit 0, dropped 0. */
const kaput: Scene = (g, w, h, t, ink) => {
  const CYCLE = 8, SIG = 4.6, CLOSE = SIG + 2.8, GAP = 0.22
  const gate = w * 0.32, bx = w * 0.6, bw = Math.min(140, w * 0.2), by = 8, bh = h - 16
  const u = t % CYCLE
  const closed = u >= SIG
  g.lineWidth = closed ? 3 : 1.5
  g.strokeStyle = closed ? ink.fault : ink.paper
  g.globalAlpha = 1
  line(g, gate, 6, gate, h - 6)
  g.lineWidth = 1.5
  g.strokeStyle = ink.paper
  g.globalAlpha = u >= CLOSE ? 0.35 : 0.9
  g.strokeRect(bx + 0.5, by + 0.5, bw, bh)
  g.fillStyle = ink.paper
  g.globalAlpha = 0.8
  if (closed) label(g, ink, 'SIGTERM', gate + 6, 16)
  if (u >= CLOSE) {
    g.fillStyle = ink.accent
    g.globalAlpha = 1
    label(g, ink, 'exit 0 · dropped 0', bx + bw + 10, h / 2 + 3)
  }
  for (let k = Math.floor((t - 4) / GAP); k <= Math.floor(t / GAP); k++) {
    const s = k * GAP, c = Math.floor(s / CYCLE), us = s - c * CYCLE, ru = t - c * CYCLE
    if (us >= CLOSE - 0.6) continue // the restart: nothing sent while the server is down
    const age = ru - us
    const y = h / 2 + (rand(k) - 0.5) * (h - 26)
    const work = 0.6 + rand(k + 3) * 1.4
    g.fillStyle = ink.paper
    if (age < 0.8) {
      g.globalAlpha = 0.9
      dot(g, (age / 0.8) * gate, y, 2.6)
    } else if (us + 0.8 >= SIG) {
      g.globalAlpha = clamp(1 - (age - 0.8) / 0.5) * 0.6 // refused at the balancer, never dropped
      dot(g, gate - 4, y, 2.6)
    } else if (age < 1.4) {
      g.globalAlpha = 0.9
      dot(g, gate + ((age - 0.8) / 0.6) * (bx + 8 - gate), y, 2.6)
    } else if (age < 1.4 + work) {
      g.globalAlpha = 1
      g.fillStyle = ink.accent
      dot(g, bx + 8 + rand(k + 9) * (bw - 16), y, 2.6)
    } else if (age < 2 + work) {
      g.globalAlpha = clamp(1 - (age - 1.4 - work) / 0.6)
      dot(g, bx + bw + ((age - 1.4 - work) / 0.6) * (w - bx - bw), y, 2.6)
    }
  }
  g.globalAlpha = 1
}

/** scroller: a strip of panels glides, eases to a rest and glides on, like the extension's ramp. */
const scroller: Scene = (g, w, h, t, ink) => {
  const CYCLE = 4.4, GLIDE = 3.2, STEP = 240
  const c = Math.floor(t / CYCLE), u = t % CYCLE
  const moving = u < GLIDE
  const pos = c * STEP + STEP * smooth(u / GLIDE)
  const widths = Array.from({ length: 12 }, (_, i) => 70 + rand(i + 40) * 90)
  const total = widths.reduce((a, b) => a + b + 12, 0)
  let x = -(pos % total)
  g.strokeStyle = ink.paper
  g.lineWidth = 1.5
  const top = 8, ph = h - 16
  for (let pass = 0; x < w; pass++)
    for (let i = 0; i < widths.length && x < w; i++) {
      const pw = widths[i]
      if (x + pw > 0) {
        g.globalAlpha = 0.85
        g.strokeRect(x + 0.5, top + 0.5, pw, ph)
        g.globalAlpha = 0.45
        g.lineWidth = 1
        if (i % 2) line(g, x + 6, top + ph * 0.65, x + pw - 6, top + ph * 0.65)
        else {
          g.beginPath()
          g.arc(x + pw * (0.3 + rand(i + 2) * 0.4), top + ph * 0.45, ph * 0.18, 0, Math.PI * 2)
          g.stroke()
        }
        g.lineWidth = 1.5
      }
      x += pw + 12
    }
  // the extension's pill: a red dot while it scrolls (scroller's hue is that red)
  const pw = 92, px = w - pw - 10, py = h / 2 - 11
  g.globalAlpha = 1
  g.fillStyle = '#000'
  g.beginPath()
  g.roundRect(px, py, pw, 22, 11)
  g.fill()
  g.fillStyle = moving ? ink.accent : ink.paper
  g.globalAlpha = moving ? 0.6 + 0.4 * Math.sin(t * 6) : 0.5
  dot(g, px + 12, h / 2, 3)
  g.globalAlpha = 1
  g.fillStyle = '#fff' // on the pill's black, whatever the ground is
  label(g, ink, moving ? '120 px/s' : 'paused', px + 22, h / 2 + 3.5)
}

/** Usher: tickets fill seats one by one; every fourth tries a seat that's already sold and bounces. */
const usher: Scene = (g, w, h, t, ink) => {
  const N = 16, CYCLE = 13, GAP = 0.7, FLY = 0.5
  const c = Math.floor(t / CYCLE), u = t % CYCLE
  const size = Math.min(18, (w - 80) / 19), gap = size * 0.3
  const rowW = N * size + (N - 1) * gap + size
  const sx = (i: number) => (w - rowW) / 2 + i * (size + gap) + (i >= N / 2 ? size : 0)
  const sy = h * 0.22
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => rand(c * 100 + a) - rand(c * 100 + b))
  const filled = new Set<number>()
  const attempts: { seat: number; ok: boolean; at: number }[] = []
  for (let j = 0, sold = 0; j * GAP < CYCLE - 1.5 && sold < N; j++) {
    const double = j % 4 === 3 && attempts.length > 0
    const seat = double ? attempts[attempts.length - 1].seat : order[sold++]
    attempts.push({ seat, ok: !double, at: j * GAP })
  }
  for (const a of attempts) if (a.ok && u >= a.at + FLY) filled.add(a.seat)
  // the screen
  g.strokeStyle = ink.paper
  g.globalAlpha = 0.6
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(w / 2 - rowW * 0.4, 5)
  g.quadraticCurveTo(w / 2, 9, w / 2 + rowW * 0.4, 5)
  g.stroke()
  for (let i = 0; i < N; i++) {
    g.globalAlpha = 0.9
    g.fillStyle = ink.accent
    g.strokeStyle = ink.paper
    g.beginPath()
    g.roundRect(sx(i), sy, size, size, [3, 3, 6, 6])
    if (filled.has(i)) g.fill()
    else g.stroke()
  }
  for (const a of attempts) {
    const s = u - a.at
    if (s < 0) continue
    const tx = sx(a.seat) + size / 2, ty = sy + size / 2
    const fx = w / 2, fy = h + 4
    if (s < FLY) {
      g.globalAlpha = 1
      g.fillStyle = a.ok ? ink.paper : ink.fault
      dot(g, fx + (tx - fx) * smooth(s / FLY), fy + (ty - fy) * smooth(s / FLY), 3)
    } else if (!a.ok && s < FLY + 0.8) {
      const b = s - FLY
      g.globalAlpha = clamp(1 - b / 0.8)
      g.strokeStyle = ink.fault
      g.lineWidth = 2
      const cx = tx, cy = ty + size + 4 + b * 10
      line(g, cx - 4, cy - 4, cx + 4, cy + 4)
      line(g, cx + 4, cy - 4, cx - 4, cy + 4)
    }
  }
  g.globalAlpha = 1
}

/** Quarry: a sweep scores map dots (Hot, Warm, Cold); dots it already knows are reused, not fetched again. */
const quarry: Scene = (g, w, h, t, ink) => {
  const CYCLE = 5, SWEEP = 3.2
  const c = Math.floor(t / CYCLE), u = t % CYCLE, round = c % 3
  const present = 30 + 8 * round
  const known = round === 0 ? 0 : 30 + 8 * (round - 1)
  const sweep = (u / SWEEP) * (w + 20) - 10
  let fetched = 0
  for (let i = 0; i < present; i++) {
    const x = 16 + rand(i) * (w - 120), y = 8 + rand(i + 500) * (h - 16)
    const score = rand(i + 900)
    const scored = i < known || x <= sweep
    if (!scored) {
      g.globalAlpha = 0.3
      g.fillStyle = ink.paper
      dot(g, x, y, 1.6)
      continue
    }
    if (i >= known) {
      fetched++
      const since = (sweep - x) / ((w + 20) / SWEEP)
      if (since < 0.45) {
        g.globalAlpha = 1 - since / 0.45
        g.strokeStyle = ink.paper
        g.lineWidth = 1
        g.beginPath()
        g.arc(x, y, 3 + since * 22, 0, Math.PI * 2)
        g.stroke()
      }
    }
    g.globalAlpha = 1
    if (score > 0.62) {
      g.fillStyle = ink.accent
      dot(g, x, y, 3.2)
    } else if (score > 0.3) {
      g.strokeStyle = ink.paper
      g.lineWidth = 1.2
      g.beginPath()
      g.arc(x, y, 3, 0, Math.PI * 2)
      g.stroke()
    } else {
      g.globalAlpha = 0.35
      g.fillStyle = ink.paper
      dot(g, x, y, 2)
    }
  }
  if (u < SWEEP) {
    g.globalAlpha = 0.5
    g.strokeStyle = ink.paper
    g.lineWidth = 1
    line(g, sweep, 2, sweep, h - 2)
  }
  g.globalAlpha = 0.9
  g.fillStyle = ink.paper
  label(g, ink, `fetched ${fetched}`, w - 10, h / 2 - 4, 'right')
  label(g, ink, `reused ${known}`, w - 10, h / 2 + 10, 'right')
  g.globalAlpha = 1
}

export const SCENES = { hitlimit, bunway, state, kaput, scroller, usher, quarry }
