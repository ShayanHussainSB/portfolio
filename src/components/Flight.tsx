import { useEffect, useRef } from 'react'
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, Fog, Group, HemisphereLight, InstancedMesh, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Points, PointsMaterial, Scene, TorusGeometry, Vector3, WebGLRenderer, DoubleSide,
} from 'three'
import { content } from '../content'
import { progress } from '../lib/scroll'
import { fixedWindow, GATES } from '../lib/stream'

const GATE_IDS = ['hitlimit', 'bunway', 'state', 'kaput'] as const
const FEATURED: readonly string[] = content.featured
const L = 150 // length of the route, in world units
const COLS = 11, ROWS = 5, HALF_W = 11, HALF_H = 3.2
const MAX = 560
const LIMIT = 22 // admitted per second at the hitlimit gate; ambient traffic stays under it
const FOLD_FROM = GATES[1] + 0.06
const FIBRE = 17 // radius of the fibre the route runs down
const BUNDLE = 0.07 // how tight the lanes are after Honeycomb folds them

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => clamp(x) * clamp(x) * (3 - 2 * clamp(x))
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** A lane's position at s (0..1 along the route): parallel, then folded into one bundle at Honeycomb. */
function lane(s: number, col: number, row: number, out: Vector3): Vector3 {
  const k = mix(1, BUNDLE, smooth((s - FOLD_FROM) / (GATES[2] - FOLD_FROM)))
  return out.set((col / (COLS - 1) - 0.5) * 2 * HALF_W * k, (row / (ROWS - 1) - 0.5) * 2 * HALF_H * k, -s * L)
}

interface Streak {
  s: number
  col: number
  row: number
  v: number // route fractions per second
  len: number // route fraction
  you: boolean
  checked: boolean
  fall: number
}

/**
 * The hero, in 3D: the same traffic as Stream.tsx, flown through. Scroll moves the camera down the route,
 * through hitlimit, bunWay, Honeycomb and kaput. Sweep the pointer to flood it; the same fixed window
 * turns the overflow away. Decorative for assistive tech: the gate links carry the meaning.
 */
export default function Flight({ city, onFail }: { city: string | null; onFail: () => void }) {
  const s = content.stream
  const canvas = useRef<HTMLCanvasElement>(null)
  const labels = useRef<HTMLElement>(null)
  const tag = useRef<HTMLSpanElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const tour = s.tour(LIMIT, COLS * ROWS, city)

  useEffect(() => {
    const c = canvas.current!
    const host = c.closest('.hero')!
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ canvas: c, antialias: true, powerPreference: 'high-performance' })
    } catch {
      onFail()
      return
    }
    const css = getComputedStyle(c)
    const ink = (name: string) => new Color(css.getPropertyValue(name).trim())
    const [ground, paper, volt, fault] = ['--ground', '--paper', '--volt', '--fault'].map(ink)
    const hues = GATE_IDS.map((id) => ink(`--hue-${id}`))

    const scene = new Scene()
    scene.fog = new Fog(ground, 22, 120)
    renderer.setClearColor(ground)
    const camera = new PerspectiveCamera(55, 1, 1.2, 400) // a near plane this far out keeps passing traffic from smearing across the lens

    // ---- the fixed drawing: floor grid, lane guides, four gates
    const v = new Vector3()
    const guide: number[] = []
    for (let col = 0; col < COLS; col++)
      for (let row = 0; row < ROWS; row++)
        for (let i = 0; i < 80; i++) {
          lane(i / 80, col, row, v).toArray(guide, guide.length)
          lane((i + 1) / 80, col, row, v).toArray(guide, guide.length)
        }
    const guides = new BufferGeometry()
    guides.setAttribute('position', new BufferAttribute(new Float32Array(guide), 3))
    scene.add(new LineSegments(guides, new LineBasicMaterial({ color: paper, transparent: true, opacity: 0.1 })))

    const solid = (color: Color, opacity = 1) => new MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: DoubleSide, depthWrite: opacity === 1 })
    const frame = (w: number, h: number, t: number, color: Color) => {
      const g = new Group()
      for (const [bw, bh, x, y] of [[w, t, 0, h / 2], [w, t, 0, -h / 2], [t, h, -w / 2, 0], [t, h, w / 2, 0]]) {
        const bar = new Mesh(new BoxGeometry(bw + (bh === t ? t : 0), bh, t), solid(color))
        bar.position.set(x, y, 0)
        g.add(bar)
      }
      return g
    }
    const W = HALF_W * 2 + 3, H = HALF_H * 2 + 3
    const gateZ = GATES.map((f) => -f * L)
    // hitlimit: one hard frame, and the limit as a pane of glass
    const g1 = frame(W, H, 0.14, hues[0])
    g1.add(new Mesh(new PlaneGeometry(W, H), solid(hues[0], 0.07)))
    g1.position.z = gateZ[0]
    // bunWay: four films, one after another
    const g2 = new Group()
    for (let k = 0; k < 4; k++) {
      const film = frame(W - k * 0.8, H - k * 0.5, 0.07, hues[1])
      film.add(new Mesh(new PlaneGeometry(W - k * 0.8, H - k * 0.5), solid(hues[1], 0.05)))
      film.position.z = -k * 1.6
      g2.add(film)
    }
    g2.position.z = gateZ[1]
    // Honeycomb: every lane folds through one cell
    const g3 = new Group()
    ;[2.1, 4.4, 7.2].forEach((r, k) => {
      const hex = new Mesh(new TorusGeometry(r, 0.07, 6, 6), solid(hues[2], 1 - k * 0.33))
      hex.rotation.z = Math.PI / 6
      g3.add(hex)
    })
    g3.position.z = gateZ[2]
    // kaput: the switch
    const g4 = new Group()
    g4.add(new Mesh(new TorusGeometry(1.7, 0.07, 8, 72), solid(hues[3])), new Mesh(new BoxGeometry(0.1, 6.4, 0.1), solid(hues[3])))
    g4.position.z = gateZ[3]
    scene.add(g1, g2, g3, g4)
    // the response it is all heading for
    const done = new Group()
    done.add(new Mesh(new TorusGeometry(3.2, 0.09, 8, 72), solid(volt)), new Mesh(new TorusGeometry(5.4, 0.04, 8, 72), solid(volt, 0.5)))
    done.position.z = -L
    scene.add(done)

    // ---- the place: the inside of an optical fibre. Strands of glass twist down the wall, ribs mark the distance,
    // and transistors sit on the wall, their gates switching in the colour of whichever project owns that stretch
    const rnd = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const zone = (z: number) => {
      let k = -1
      while (k + 1 < gateZ.length && z <= gateZ[k + 1]) k++
      return k < 0 ? paper : hues[k]
    }
    const Z0 = 24, Z1 = -L - 40
    const wall = (angle: number, z: number, r = FIBRE) => v.set(Math.cos(angle) * r, Math.sin(angle) * r, z)
    const glass: number[] = [], glassHue: number[] = []
    const seg = (a1: number, z1: number, a2: number, z2: number, dim = 1) => {
      wall(a1, z1).toArray(glass, glass.length)
      wall(a2, z2).toArray(glass, glass.length)
      for (const z of [z1, z2]) {
        const c = zone(z)
        glassHue.push(c.r * dim, c.g * dim, c.b * dim)
      }
    }
    const STRANDS = 44, STEP = 3
    for (let k = 0; k < STRANDS; k++)
      for (let z = Z0; z > Z1; z -= STEP) {
        const a = (k / STRANDS) * Math.PI * 2
        seg(a + z * 0.012, z, a + (z - STEP) * 0.012, z - STEP, 0.55) // a slow twist, like drawn glass
      }
    for (let z = Z0; z > Z1; z -= 6) for (let k = 0; k < 48; k++) seg((k / 48) * Math.PI * 2, z, ((k + 1) / 48) * Math.PI * 2, z, z % 30 === 0 ? 0.9 : 0.28)
    const glassGeo = new BufferGeometry()
    glassGeo.setAttribute('position', new BufferAttribute(new Float32Array(glass), 3))
    glassGeo.setAttribute('color', new BufferAttribute(new Float32Array(glassHue), 3))
    scene.add(new LineSegments(glassGeo, new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, blending: AdditiveBlending, depthWrite: false })))

    // transistors: a body, three legs into the wall (source, gate, drain) and a gate plate that lights when it switches
    const CHIPS = 260
    const lit = new MeshLambertMaterial({ color: new Color('#3b3b58') })
    const bodies = new InstancedMesh(new BoxGeometry(2.6, 0.7, 1.7), lit, CHIPS)
    const legs = new InstancedMesh(new BoxGeometry(0.16, 1.5, 0.16), new MeshLambertMaterial({ color: new Color('#9a9ab8') }), CHIPS * 3)
    const plates = new InstancedMesh(new BoxGeometry(1.5, 0.1, 1.2), new MeshBasicMaterial(), CHIPS)
    const chip = new Object3D(), part = new Object3D()
    chip.add(part)
    const chipHue: Color[] = []
    for (let i = 0; i < CHIPS; i++) {
      const a = rnd(i) * Math.PI * 2, z = -6 - rnd(i + 0.5) * (-Z1 - 12) // none beside the opening shot, where one would fill the screen
      wall(a, z, FIBRE - 1.4)
      chip.position.copy(v)
      chip.up.set(0, 0, 1)
      chip.lookAt(0, 0, z) // +z of the chip points at the axis; its local y runs along the fibre
      chip.rotateX(Math.PI / 2) // stand it so its top faces the axis
      chip.rotateY(rnd(i + 0.2) * Math.PI)
      const put = (mesh: InstancedMesh, at: number, x: number, y: number, zz: number) => {
        part.position.set(x, y, zz)
        chip.updateMatrixWorld(true)
        mesh.setMatrixAt(at, part.matrixWorld)
      }
      put(bodies, i, 0, 0, 0)
      put(plates, i, 0, 0.42, 0)
      ;[-0.95, 0, 0.95].forEach((x, k) => put(legs, i * 3 + k, x, -0.9, 0))
      chipHue.push(zone(z))
    }
    const dust: number[] = []
    for (let i = 0; i < 1100; i++) {
      const a = rnd(i + 0.2) * Math.PI * 2, r = Math.sqrt(rnd(i + 0.4)) * (FIBRE - 2)
      dust.push(Math.cos(a) * r, Math.sin(a) * r, Z0 - rnd(i + 0.7) * (Z0 - Z1))
    }
    const dustGeo = new BufferGeometry()
    dustGeo.setAttribute('position', new BufferAttribute(new Float32Array(dust), 3))
    const lamp = new PointLight(paper, 260, 70, 1.6) // rides with the camera, so the transistors nearby are lit and the far ones fall into fog
    scene.add(bodies, legs, plates, new Points(dustGeo, new PointsMaterial({ size: 0.06, color: paper, transparent: true, opacity: 0.5 })), new HemisphereLight(paper, ground, 0.9), lamp)
    const dark = new Color('#16161f'), mixed = new Color()
    const switchGates = (t: number) => {
      for (let i = 0; i < CHIPS; i++) {
        const on = Math.sin(t * (1.5 + rnd(i + 0.9) * 5) + i) > 0.2 // each one switches at its own clock rate
        plates.setColorAt(i, on ? chipHue[i] : mixed.copy(dark))
      }
      plates.instanceColor!.needsUpdate = true
    }
    const pane = (g1.children[4] as Mesh).material as MeshBasicMaterial // the limit's glass: flashes when it turns a request away

    // where each gate's label hangs
    const anchors = [new Vector3(-W / 2, H / 2, gateZ[0]), new Vector3(-W / 2, H / 2, gateZ[1]), new Vector3(0, 7.4, gateZ[2]), new Vector3(0, 3.3, gateZ[3])]

    // ---- traffic: one instanced box per request, bright at the head, fading to nothing at the tail
    const box = new BoxGeometry(1, 1, 1)
    const shade = new Float32Array(box.attributes.position.count * 3)
    for (let i = 0; i < box.attributes.position.count; i++) shade.fill(box.attributes.position.getZ(i) > 0 ? 1 : 0, i * 3, i * 3 + 3)
    box.setAttribute('color', new BufferAttribute(shade, 3))
    const mesh = new InstancedMesh(box, new MeshBasicMaterial({ vertexColors: true, blending: AdditiveBlending, depthWrite: false, transparent: true }), MAX)
    mesh.frustumCulled = false
    scene.add(mesh)

    let ps: Streak[] = []
    let acc = 0, clock = 0, admitted = 0, refused = 0, flash = 0
    const admit = fixedWindow(LIMIT, 1000)
    const spawn = (col: number, row: number, fast = false, you = false) => {
      if (ps.length >= MAX) return
      const v = (you ? 1 / 13 : 1 / 7.5) * (fast ? 1.8 : 0.8 + Math.random() * 0.5)
      ps.push({ s: you ? 0 : -Math.random() * 0.03, col, row, v, len: you ? 0.1 : 0.025 + v * 0.16, you, checked: false, fall: 0 })
    }
    const step = (dt: number) => {
      clock += dt * 1000
      acc += dt * 13
      while (acc > 1) {
        acc--
        spawn(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS))
      }
      if (!ps.some((p) => p.you)) spawn(3, 3, false, true)
      for (const p of ps) {
        if (p.fall) {
          p.s += p.v * 0.3 * dt
          p.fall += (2 + p.fall * 2.6) * dt
          continue
        }
        p.s += p.v * dt
        if (!p.checked && p.s >= GATES[0]) {
          p.checked = true
          if (p.you || admit(clock)) admitted++
          else {
            p.fall = 0.01
            refused++
            flash = 1
          }
        }
      }
      ps = ps.filter((p) => (p.fall ? p.fall < 9 : p.s - p.len < 1.04))
    }

    const dummy = new Object3D()
    const head = new Vector3(), tail = new Vector3(), you = new Vector3()
    let youLive = false
    const place = () => {
      youLive = false
      ps.forEach((p, i) => {
        lane(p.s, p.col, p.row, head)
        lane(p.s - p.len, p.col, p.row, tail)
        if (p.fall) {
          head.y -= p.fall
          tail.y -= p.fall * 0.8
        }
        dummy.position.copy(tail)
        dummy.lookAt(head)
        dummy.position.lerp(head, 0.5)
        // traffic right next to the lens thins out, or it would fill the screen
        const thick = (p.you ? 0.16 : 0.055) * Math.min(1, Math.max(0.12, dummy.position.distanceTo(camera.position) / 12))
        dummy.scale.set(thick, thick, head.distanceTo(tail))
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        let k = -1
        while (k + 1 < GATES.length && p.s >= GATES[k + 1]) k++
        mesh.setColorAt(i, p.you ? volt : p.fall ? fault : k < 0 ? paper : hues[k])
        if (p.you) {
          you.copy(head)
          youLive = true
        }
      })
      mesh.count = ps.length
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    // ---- camera: an establishing shot from outside, then down the middle of the route
    let w = 0, h = 0
    const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 }
    const look = new Vector3()
    const fly = (t: number) => {
      const p = progress(host)
      const b = smooth(p / 0.16)
      const z = 7 - clamp((p - 0.06) / 0.94) * (L * 0.97)
      const wide = w < h ? 1.5 : 1 // portrait screens stand further back
      eased.x += (pointer.x - eased.x) * 0.06
      eased.y += (pointer.y - eased.y) * 0.06
      camera.position.set(mix(-15 * wide, 0, b) + eased.x * 1.4 + Math.sin(t * 0.3) * 0.25, mix(6.5, 0.95, b) - eased.y * 0.5, mix(15 * wide, z, b))
      look.set(eased.x * 2, mix(-0.6, 0.3, b), mix(-34, z - 30, b))
      camera.lookAt(look)
      lamp.position.copy(camera.position)
    }
    const project = (at: Vector3, el: HTMLElement, far: number) => {
      const depth = v.copy(at).applyMatrix4(camera.matrixWorldInverse).z // negative in front of the camera
      v.copy(at).project(camera)
      const shown = depth < -1.5 && depth > -far && Math.abs(v.x) < 1.15
      el.style.visibility = shown ? 'visible' : 'hidden'
      if (!shown) return
      el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`
      el.style.opacity = String(clamp((far + depth) / 28) * clamp((-depth - 1.5) / 6))
    }
    // ---- narration: which stage the camera is in, and the live counts
    const caps = hud.current!.querySelectorAll<HTMLElement>('.flyby__cap, .flyby__rail li')
    const counts = hud.current!.querySelectorAll<HTMLElement>('.flyby__stats dd')
    let stage = -2, lastCount = 0
    const narrate = (now: number) => {
      const z = camera.position.z
      let next = progress(host) < 0.07 ? -1 : 0
      if (next === 0) {
        while (next < gateZ.length && z <= gateZ[next] + 24) next++
        if (z <= gateZ[3] - 5) next = 5
      }
      if (next !== stage) {
        stage = next
        caps.forEach((el, i) => el.toggleAttribute('data-on', i % tour.length === stage))
      }
      if (now - lastCount > 0.2) {
        lastCount = now
        ;[ps.length, admitted, refused].forEach((n, i) => (counts[i].textContent = n.toLocaleString('en')))
      }
    }
    const draw = (t: number) => {
      place()
      switchGates(t)
      flash *= 0.9
      pane.color.copy(hues[0]).lerp(fault, flash)
      pane.opacity = 0.07 + flash * 0.22
      fly(t)
      camera.updateMatrixWorld()
      renderer.render(scene, camera)
      narrate(t)
      const links = labels.current!.children
      anchors.forEach((a, i) => project(a, links[i] as HTMLElement, 62))
      if (tag.current) {
        if (youLive) project(you, tag.current, 70)
        else tag.current.style.visibility = 'hidden'
      }
    }

    const size = () => {
      const r = c.getBoundingClientRect()
      w = r.width
      h = r.height
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.fov = w < h ? 72 : 55
      camera.updateProjectionMatrix()
    }
    size()
    for (let i = 0; i < 500; i++) step(1 / 60) // start mid-flow
    admitted = refused = 0
    draw(0)
    c.dataset.ready = 'true'

    let raf = 0, last = 0, onScreen = true
    const frame_ = (now: number) => {
      step(Math.min(0.05, (now - last) / 1000 || 0))
      last = now
      draw(now / 1000)
      raf = onScreen && !document.hidden ? requestAnimationFrame(frame_) : 0
    }
    const wake = () => {
      if (!raf && onScreen && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame_)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      wake()
    })
    io.observe(c)
    const ro = new ResizeObserver(size)
    ro.observe(c)
    document.addEventListener('visibilitychange', wake)

    let lastFlood = 0
    const flood = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1
      if (e.timeStamp - lastFlood < 28) return
      lastFlood = e.timeStamp
      for (let k = 0; k < 3; k++) spawn(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS), true)
    }
    host.addEventListener('pointermove', flood as EventListener)
    wake()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
      host.removeEventListener('pointermove', flood as EventListener)
      scene.traverse((o) => {
        const m = o as Mesh
        m.geometry?.dispose()
        ;(m.material as MeshBasicMaterial | undefined)?.dispose?.()
      })
      renderer.dispose()
    }
  }, [onFail])

  return (
    <div className="flyby">
      <canvas ref={canvas} aria-hidden="true" />
      <nav className="flyby__gates stream__gates" ref={labels} aria-label="Projects, in the order a request meets them">
        {GATE_IDS.map((id) => (
          <a key={id} href={FEATURED.includes(id) ? `#${id}` : `#all-${id}`} style={{ borderLeftColor: `var(--hue-${id})` }}>
            <b>{content.projects[id].name}</b>
            <span>{content.projects[id].kind}</span>
          </a>
        ))}
      </nav>
      <span className="stream__you" ref={tag} aria-hidden="true">
        <i>{city ? s.youFrom(city) : s.you}</i>
      </span>
      <div className="flyby__hud" ref={hud}>
        <ol className="flyby__rail mono" aria-hidden="true">
          {tour.map((c) => (
            <li key={c.tag}>{c.tag}</li>
          ))}
        </ol>
        {tour.map((c, i) => (
          <p className="flyby__cap" key={c.tag} data-project={GATE_IDS[i - 1]}>
            <b className="mono">{c.tag}</b>
            <strong>{c.title}</strong>
            <span>{c.body}</span>
          </p>
        ))}
        <dl className="flyby__stats mono" aria-hidden="true">
          {[s.hud.inFlight, s.hud.admitted, s.hud.refused].map((label) => (
            <div key={label}>
              <dd>0</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>
      </div>
      <p className="sr-only">{s.label}</p>
    </div>
  )
}
