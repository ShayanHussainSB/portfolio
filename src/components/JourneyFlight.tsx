import { useEffect, useRef } from 'react'
import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DoubleSide, Fog,
  HemisphereLight, InstancedMesh, LineBasicMaterial, LineSegments, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Points, PointsMaterial, Scene, SphereGeometry, SRGBColorSpace,
  Texture, TextureLoader, TorusGeometry, Vector3, WebGLRenderer,
} from 'three'
import { progress } from '../lib/scroll'
import { link, short } from '../lib/chain'

const files = import.meta.glob('../assets/photos/journey-*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const RINGS = 12
const ledger = link(Array.from({ length: RINGS }, (_, i) => ({ year: 'Example', headline: `Block ${i + 1}`, line: 'Illustrative ledger records' })))
const R = 8 // tunnel radius
const N = 1200 // route samples
const RECORDS = 28 // records per block ring
const ringT = ledger.map((_, i) => .2 + i * .06)
// one hue per chapter stretch: collections, ownership, compression, indexing, tooling, next
const HUES = ['#f2c66d', '#ff9a6b', '#b48cff', '#58c8f2', '#7ef0b0', '#a0f1d0'].map(h => new Color(h))
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => (x = clamp(x), x * x * (3 - 2 * x))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const zone = (t: number) => HUES[Math.min(5, Math.max(0, Math.round((t - .001) / .9 * 5)))]

/**
 * The Solana story as a flight: NFT portraits at the mouth, then a winding tunnel builds around them,
 * its wall carrying chained blocks, records and traffic. Block rings fill with records and seal as the
 * camera nears; each label shows its hash and the previous block's. Illustrative, not live chain data.
 */
export default function JourneyFlight({ onFail, theme }: { onFail: () => void; theme: 'light' | 'dark' | 'darker' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    const canvas = ref.current!
    const host = canvas.closest('.journey__pin')!
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    } catch { onFail(); return }
    renderer.outputColorSpace = SRGBColorSpace
    const scene = new Scene()
    const background = new Color(0xeaf2ef), targetBackground = new Color(0xeaf2ef)
    scene.fog = new Fog(background, 16, 80)
    const camera = new PerspectiveCamera(58, 1, .3, 120)
    const say = (text: string) => { if (statusRef.current) statusRef.current.textContent = text }

    // ---- the route: a winding curve, sampled once so per-frame lookups allocate nothing
    const route = new CatmullRomCurve3([
      new Vector3(0, 0, 12), new Vector3(0, -1, -20), new Vector3(14, -6, -65),
      new Vector3(-10, -14, -115), new Vector3(12, -22, -170),
      new Vector3(-8, -30, -230), new Vector3(4, -36, -285), new Vector3(0, -38, -320),
    ])
    const LEN = route.getLength()
    const pts = route.getSpacedPoints(N)
    const { normals, binormals, tangents } = route.computeFrenetFrames(N, false)
    const at = (t: number, x = 0, y = 0, out = new Vector3()) => {
      const f = clamp(t) * N, i = Math.min(N - 1, Math.floor(f))
      return out.lerpVectors(pts[i], pts[i + 1], f - i).addScaledVector(normals[i], x).addScaledVector(binormals[i], y)
    }
    const wall = (t: number, a: number, r = R, out?: Vector3) => at(t, Math.cos(a) * r, Math.sin(a) * r, out)
    const o = new Object3D(), v = new Vector3()
    // a wall-mounted transform: local +z faces the axis, local y runs along the tunnel
    const onWall = (t: number, a: number, r: number) => {
      wall(t, a, r, o.position)
      o.up.copy(tangents[Math.round(clamp(t) * N)])
      o.lookAt(at(t, 0, 0, v))
      o.updateMatrix()
      return o.matrix
    }
    const lamp = new PointLight(0xffffff, 160, 45, 1.6) // rides with the camera: near detail lit, far detail in fog
    scene.add(new HemisphereLight(0xdff6ff, 0x101820, 1.1), lamp)

    // ---- the tunnel: strands twisting down the wall, ribs marking distance, tinted per chapter
    const glass: number[] = [], glassHue: number[] = []
    const seg = (t1: number, a1: number, t2: number, a2: number, dim: number) => {
      wall(t1, a1, R, v).toArray(glass, glass.length)
      wall(t2, a2, R, v).toArray(glass, glass.length)
      for (const t of [t1, t2]) { const c = zone(t); glassHue.push(c.r * dim, c.g * dim, c.b * dim) }
    }
    const STEPS = 500
    for (let k = 0; k < 40; k++) for (let i = 0; i < STEPS; i++) {
      const t1 = i / STEPS, t2 = (i + 1) / STEPS, a = k / 40 * Math.PI * 2
      seg(t1, a + t1 * 14, t2, a + t2 * 14, .55)
    }
    for (let i = 0; i <= 160; i++) for (let k = 0; k < 48; k++) seg(i / 160, k / 48 * Math.PI * 2, i / 160, (k + 1) / 48 * Math.PI * 2, i % 10 === 0 ? .9 : .25)
    const glassGeo = new BufferGeometry()
    glassGeo.setAttribute('position', new BufferAttribute(new Float32Array(glass), 3))
    glassGeo.setAttribute('color', new BufferAttribute(new Float32Array(glassHue), 3))
    const glassMat = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false })
    scene.add(new LineSegments(glassGeo, glassMat))

    // ---- wall detail: short chains of blocks, linked, their record plates switching like gates
    const CHAINS = 90, PER = 4, gap = 2.6 / LEN
    const bodyMat = new MeshLambertMaterial({ color: 0x253242, transparent: true, opacity: 0 })
    const bodies = new InstancedMesh(new BoxGeometry(1, 1.3, .5), bodyMat, CHAINS * PER)
    const links = new InstancedMesh(new BoxGeometry(.12, 1.4, .12), bodyMat, CHAINS * (PER - 1))
    const plateMat = new MeshBasicMaterial({ transparent: true, opacity: 0 })
    const plates = new InstancedMesh(new BoxGeometry(.72, .95, .06), plateMat, CHAINS * PER)
    const plateHue: Color[] = []
    for (let c = 0; c < CHAINS; c++) {
      const t0 = .06 + rnd(c) * .8, a = rnd(c + .3) * Math.PI * 2
      for (let j = 0; j < PER; j++) {
        const t = t0 + j * gap, i = c * PER + j
        bodies.setMatrixAt(i, onWall(t, a, R - .3))
        plates.setMatrixAt(i, onWall(t, a, R - .58))
        plateHue.push(zone(t))
        if (j < PER - 1) links.setMatrixAt(c * (PER - 1) + j, onWall(t + gap / 2, a, R - .3))
      }
    }
    scene.add(bodies, links, plates)

    // ---- block rings: records fill as the camera nears, then the ring seals and flashes
    const recordMat = new MeshBasicMaterial({ transparent: true, opacity: 0 })
    const records = new InstancedMesh(new BoxGeometry(1.2, .7, .35), recordMat, RINGS * RECORDS)
    ringT.forEach((t, i) => { for (let k = 0; k < RECORDS; k++) records.setMatrixAt(i * RECORDS + k, onWall(t, k / RECORDS * Math.PI * 2 + i, R - .35)) })
    scene.add(records)
    const textures: Texture[] = []
    const rings = ringT.map((t, i) => {
      const glow = new Mesh(new TorusGeometry(R - .2, .06, 6, 72), new MeshBasicMaterial({ color: zone(t), transparent: true, opacity: 0 }))
      at(t, 0, 0, glow.position)
      glow.lookAt(at(t + .01))
      const c = document.createElement('canvas')
      c.width = 1024; c.height = 320
      const g = c.getContext('2d')!
      const texture = new CanvasTexture(c)
      texture.colorSpace = SRGBColorSpace
      textures.push(texture)
      const paint = (stage: string) => {
        g.clearRect(0, 0, c.width, c.height)
        g.fillStyle = '#060b14cc'; g.fillRect(0, 0, c.width, c.height)
        g.fillStyle = '#' + zone(t).getHexString(); g.fillRect(0, 0, 8, c.height)
        g.font = '500 50px monospace'; g.fillStyle = '#e6f6f0'
        g.fillText(`BLOCK ${String(i + 1).padStart(2, '0')}`, 36, 70)
        g.font = '30px monospace'; g.fillStyle = '#9fbbb7'
        g.fillText(`hash  ${short(ledger[i].hash)}`, 36, 140)
        g.fillText(`prev  ${short(ledger[i].prev)}`, 36, 192)
        g.fillStyle = '#' + zone(t).getHexString(); g.fillText(stage, 36, 272)
        texture.needsUpdate = true
      }
      paint('PENDING')
      const label = new Mesh(new PlaneGeometry(4.2, 1.3), new MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false }))
      at(t - .006, (i % 2 ? 1 : -1) * R * .45, R * .3, label.position)
      label.lookAt(at(t - .05))
      scene.add(glow, label)
      return { glow, label, paint, fill: -1, flashAt: -1e9 }
    })

    // ---- inside: dust, and transactions streaking down the tunnel
    const dust: number[] = []
    for (let i = 0; i < 1600; i++) wall(rnd(i + .7), rnd(i + .2) * Math.PI * 2, Math.sqrt(rnd(i + .4)) * (R - 1.2), v).toArray(dust, dust.length)
    const dustGeo = new BufferGeometry()
    dustGeo.setAttribute('position', new BufferAttribute(new Float32Array(dust), 3))
    const dustMat = new PointsMaterial({ size: .06, color: 0xcfeee6, transparent: true, opacity: 0, depthWrite: false })
    scene.add(new Points(dustGeo, dustMat))
    const box = new BoxGeometry(1, 1, 1)
    const shade = new Float32Array(box.attributes.position.count * 4)
    for (let i = 0; i < box.attributes.position.count; i++) shade.set([1, 1, 1, box.attributes.position.getZ(i) > 0 ? 1 : 0], i * 4) // bright head, clear tail
    box.setAttribute('color', new BufferAttribute(shade, 4))
    const streakMat = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false })
    const STREAKS = 260
    const streakMesh = new InstancedMesh(box, streakMat, STREAKS)
    streakMesh.frustumCulled = false
    scene.add(streakMesh)
    const streaks = Array.from({ length: STREAKS }, (_, i) => ({ s: -1, a: rnd(i + .1) * Math.PI * 2, r: 1.5 + rnd(i + .6) * (R - 2.8), v: (12 + rnd(i + .8) * 16) / LEN, len: (2 + rnd(i + .9) * 4) / LEN }))
    const head = new Vector3(), tail = new Vector3()

    // ---- the mouth: NFT portraits, which drift out onto the wall as the tunnel forms
    const cards: { mesh: Mesh<PlaneGeometry, MeshBasicMaterial>; t: number; a: number; r: number }[] = []
    const loader = new TextureLoader()
    const urls = Object.values(files)
    let alive = true
    urls.forEach((url, i) => {
      const texture = loader.load(url, () => {
        if (!alive) { texture.dispose(); return }
        texture.colorSpace = SRGBColorSpace
        for (let repeat = 0; repeat < 2; repeat++) {
          const index = i + repeat * urls.length
          const mesh = new Mesh(new PlaneGeometry(1.1, 1.1), new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true }))
          cards.push({ mesh, t: .012 + index / (urls.length * 2) * .11, a: index * 2.399, r: 5.4 + rnd(index) * 1.6 })
          scene.add(mesh)
        }
      })
      textures.push(texture)
    })

    // ---- a visitor's transaction: click or Enter sends a packet to the next block ahead
    const packet = new Mesh(new SphereGeometry(.22, 12, 12), new MeshBasicMaterial({ color: 0xffffff }))
    packet.visible = false
    scene.add(packet)
    let camT = 0, reveal = 0, sending = -1, sentAt = 0, fromT = 0
    const send = () => {
      const target = ringT.findIndex(t => t > camT + .02)
      if (reveal < .5 || target < 0 || sending >= 0) return
      sending = target; sentAt = performance.now(); fromT = camT + .006
      say(`Example transaction sent toward block ${target + 1}.`)
    }
    const press = (e: PointerEvent) => { if (e.button === 0) send() }
    const keyboard = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send() } }
    canvas.addEventListener('pointerdown', press)
    canvas.addEventListener('keydown', keyboard)
    const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 }
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = (e.clientX - r.left) / r.width - .5
      pointer.y = (e.clientY - r.top) / r.height - .5
    }
    host.addEventListener('pointermove', move as EventListener)

    const size = () => {
      const r = canvas.getBoundingClientRect()
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
      renderer.setSize(r.width, r.height, false)
      camera.aspect = r.width / r.height
      camera.fov = r.width < r.height ? 72 : 58
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size); ro.observe(canvas)

    const dim = new Color(), white = new Color(0xffffff), look = new Vector3()
    const dustDark = new Color(0xcfeee6), dustLight = new Color(0x2f5a55), bodyDark = new Color(0x253242), bodyLight = new Color(0x8fa7a4)
    let raf = 0, visible = false, lastFrame = 0, ink = 1, inkTarget = 1, lastTheme = ''
    const frame = (now: number) => {
      if (!visible || document.hidden) { raf = 0; return }
      const dt = lastFrame ? Math.min(.1, (now - lastFrame) / 1000) : .016
      lastFrame = now
      const mode = themeRef.current
      if (mode !== lastTheme) {
        lastTheme = mode
        targetBackground.setHex(mode === 'light' ? 0xeaf2ef : mode === 'darker' ? 0x020409 : 0x080d19)
        inkTarget = mode === 'light' ? 0 : 1
      }
      const k = 1 - Math.exp(-dt * 6)
      background.lerp(targetBackground, k)
      ink += (inkTarget - ink) * k
      renderer.setClearColor(background)
      ;(scene.fog as Fog).color.copy(background)
      const light = mix(.5, 1, ink) // pastel hues darken on the light palette so they still read
      glassMat.color.setScalar(light); plateMat.color.setScalar(light); recordMat.color.setScalar(light); streakMat.color.setScalar(light)
      dustMat.color.lerpColors(dustLight, dustDark, ink)
      bodyMat.color.lerpColors(bodyLight, bodyDark, ink)

      // camera: down the middle of the curve, never rolling
      const p = progress(host)
      camT = .001 + p * .9
      reveal = smooth((p - .05) / .13)
      eased.x += (pointer.x - eased.x) * .06
      eased.y += (pointer.y - eased.y) * .06
      const sway = Math.sin(now * .0004) * .25
      at(camT, eased.x * 1.2 + sway, -eased.y * .8, camera.position)
      camera.up.set(0, 1, 0)
      camera.lookAt(at(camT + .03, eased.x * 2.5, -eased.y * 1.5, look))
      lamp.position.copy(camera.position)

      const detail = reveal * (1 - smooth((p - .86) / .1)) // the outro keeps only the tunnel lines behind its heading
      glassMat.opacity = .75 * reveal * (1 - .5 * smooth((p - .86) / .1))
      bodyMat.opacity = plateMat.opacity = recordMat.opacity = detail
      bodyMat.visible = plateMat.visible = detail > 0
      dustMat.opacity = .55 * reveal
      streakMat.opacity = detail
      streakMesh.visible = dustMat.visible = reveal > 0

      // portraits spread to the wall and fade as the tunnel takes over
      const cardFade = .7 * (1 - smooth((p - .07) / .1))
      for (const c of cards) {
        c.mesh.visible = cardFade > 0
        c.mesh.material.opacity = cardFade
        wall(c.t, c.a + reveal * .6, mix(c.r, R - .6, reveal), c.mesh.position)
        c.mesh.lookAt(at(c.t - .03, 0, 0, v))
      }

      const seconds = now / 1000
      for (let i = 0; i < plateHue.length; i++) plates.setColorAt(i, Math.sin(seconds * (1.5 + rnd(i + .9) * 4) + i) > .2 ? plateHue[i] : dim.copy(plateHue[i]).multiplyScalar(.15))
      plates.instanceColor!.needsUpdate = true

      rings.forEach((ring, i) => {
        const fill = Math.round(smooth((.11 - (ringT[i] - camT)) / .06) * RECORDS)
        if (fill !== ring.fill) {
          if (fill === RECORDS && ring.fill >= 0 && ring.fill < RECORDS) ring.flashAt = now
          ring.fill = fill
          ring.paint(fill === 0 ? 'PENDING' : fill < RECORDS ? `COLLECTING ${fill}/${RECORDS}` : 'SEALED')
        }
        const flash = Math.exp(-(now - ring.flashAt) / 500)
        for (let n = 0; n < RECORDS; n++) records.setColorAt(i * RECORDS + n, n < fill ? dim.copy(zone(ringT[i])).lerp(white, flash * .7) : dim.copy(zone(ringT[i])).multiplyScalar(.15))
        ring.glow.material.opacity = detail * (.3 + flash * .7)
        ring.label.material.opacity = detail
      })
      records.instanceColor!.needsUpdate = true

      for (let i = 0; i < STREAKS; i++) {
        const s = streaks[i]
        s.s += s.v * dt
        if (s.s < camT - .04 || s.s > camT + .26) s.s = s.s < 0 ? camT - .01 + rnd(i) * .27 : camT - .01 + rnd(i + now) * .03
        wall(s.s, s.a, s.r, head)
        wall(s.s - s.len, s.a, s.r, tail)
        o.position.copy(tail)
        o.up.set(0, 1, 0)
        o.lookAt(head)
        o.position.lerp(head, .5)
        const thick = .06 * Math.min(1, Math.max(.15, o.position.distanceTo(camera.position) / 10)) // thin near the lens
        o.scale.set(thick, thick, head.distanceTo(tail))
        o.updateMatrix()
        o.scale.set(1, 1, 1)
        streakMesh.setMatrixAt(i, o.matrix)
        streakMesh.setColorAt(i, zone(s.s))
      }
      streakMesh.instanceMatrix.needsUpdate = true
      streakMesh.instanceColor!.needsUpdate = true

      if (sending >= 0) {
        const q = (now - sentAt) / 1300
        packet.visible = q < 1
        at(mix(fromT, ringT[sending], smooth(q)), 0, -.6, packet.position)
        if (q >= 1) {
          rings[sending].flashAt = now
          say(`Recorded in block ${sending + 1}. Its hash ${short(ledger[sending].hash)} becomes the next block's prev. Click or press Enter to send another.`)
          sending = -1
        }
      }

      renderer.render(scene, camera)
      canvas.dataset.ready = 'true'
      raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (visible && !document.hidden && !raf) { lastFrame = 0; raf = requestAnimationFrame(frame) } }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake() }); io.observe(canvas)
    const lost = (e: Event) => { e.preventDefault(); onFail() }
    canvas.addEventListener('webglcontextlost', lost)
    document.addEventListener('visibilitychange', wake)
    return () => {
      alive = false
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
      host.removeEventListener('pointermove', move as EventListener)
      canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('keydown', keyboard)
      canvas.removeEventListener('webglcontextlost', lost)
      document.removeEventListener('visibilitychange', wake)
      const geometries = new Set<BufferGeometry>(), materials = new Set<Material>()
      scene.traverse(x => {
        const m = x as Mesh
        if (m.geometry) geometries.add(m.geometry)
        if (m.material) for (const mat of Array.isArray(m.material) ? m.material : [m.material]) materials.add(mat)
      })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
      textures.forEach(t => t.dispose()); renderer.dispose()
    }
  }, [onFail])
  return <><canvas className="journey__flight" ref={ref} tabIndex={0} role="button" aria-label="Fly through an illustrative blockchain tunnel. Click or press Enter to send an example transaction to the next block." aria-describedby="journey-animation-status" /><span className="sr-only" ref={statusRef} id="journey-animation-status" aria-live="polite" /></>
}
