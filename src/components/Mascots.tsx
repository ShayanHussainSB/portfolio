import { useEffect, useRef } from 'react'
import {
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { ICONS } from '../lib/icons'

/**
 * The contact links' characters, modelled like soft clay toys: everything rounded, matte, a little glossy.
 * They are original characters; the GitHub and LinkedIn marks appear only on the badges two of them hold.
 */
/** `x` is excited time (excitement summed over time): extra speed goes into the phase through it, so a hover never makes the phase jump. */
type Act = (t: number, excited: number, x: number) => void
const clay = (color: string, roughness = 0.5) => new MeshStandardMaterial({ color: new Color(color), roughness, metalness: 0 })
const at = <T extends Object3D>(o: T, x = 0, y = 0, z = 0): T => {
  o.position.set(x, y, z)
  return o
}
const ball = (r: number, m: MeshStandardMaterial, sx = 1, sy = 1, sz = 1) => {
  const b = new Mesh(new SphereGeometry(r, 40, 28), m)
  b.scale.set(sx, sy, sz)
  return b
}
const slab = (w: number, h: number, d: number, m: MeshStandardMaterial, r = 0.12) =>
  new Mesh(new RoundedBoxGeometry(w, h, d, 5, Math.min(r, w / 2, h / 2, d / 2)), m)
/** An arm that swings from its shoulder. */
const arm = (m: MeshStandardMaterial, x: number, y: number) => {
  const pivot = at(new Group(), x, y, 0)
  pivot.add(at(new Mesh(new CapsuleGeometry(0.13, 0.34, 8, 16), m), 0, -0.24, 0))
  return pivot
}
/** A round badge carrying a logo, drawn from its 24×24 path. */
function badge(path: string, ground: string, ink: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = ground
  g.fillRect(0, 0, 256, 256)
  g.translate(128, 128)
  g.rotate(-Math.PI / 2) // a cylinder's cap is mapped a quarter turn round
  g.scale(6.4, 6.4)
  g.translate(-12, -12)
  g.fillStyle = ink
  g.fill(new Path2D(path))
  const map = new CanvasTexture(c)
  map.colorSpace = SRGBColorSpace
  const side = clay(ground)
  const coin = new Mesh(new CylinderGeometry(0.5, 0.5, 0.14, 48), [side, new MeshStandardMaterial({ map, roughness: 0.45 }), side])
  coin.rotation.x = Math.PI / 2
  const g2 = new Group()
  g2.add(coin)
  return g2
}

/** A round little creature: body, big head, eyes that blink, cheeks, a smile, two arms, two feet. */
function buddy(color: string, belly: string) {
  const skin = clay(color),
    white = clay('#ffffff', 0.3),
    dark = clay('#15151f', 0.25)
  const g = new Group(),
    head = at(new Group(), 0, 0.55, 0),
    eyes = new Group()
  for (const x of [-0.27, 0.27])
    eyes.add(
      at(ball(0.19, white, 1, 1.15, 0.55), x, 0.06, 0.6),
      at(ball(0.1, dark, 1, 1.15, 0.6), x * 0.96, 0.05, 0.69),
      at(ball(0.035, white), x * 0.96 + 0.035, 0.1, 0.75),
    )
  const smile = at(new Mesh(new TorusGeometry(0.1, 0.028, 10, 20, Math.PI), dark), 0, -0.17, 0.66)
  smile.rotation.z = Math.PI
  head.add(
    ball(0.74, skin, 1.08, 0.94, 1),
    eyes,
    smile,
    at(ball(0.1, clay('#ff9a9a'), 1, 0.6, 0.4), -0.5, -0.12, 0.52),
    at(ball(0.1, clay('#ff9a9a'), 1, 0.6, 0.4), 0.5, -0.12, 0.52),
  )
  const left = arm(skin, -0.58, -0.12),
    right = arm(skin, 0.58, -0.12)
  left.rotation.z = -0.35
  right.rotation.z = 0.35
  g.add(at(ball(0.6, skin, 1, 1.05, 0.9), 0, -0.4, 0), at(ball(0.42, clay(belly), 1, 1.05, 0.5), 0, -0.42, 0.36), head, left, right)
  for (const x of [-0.27, 0.27]) g.add(at(ball(0.2, skin, 1, 0.6, 1.25), x, -1, 0.12))
  const blink = (t: number) => (eyes.scale.y = (t * 0.37) % 1 > 0.96 ? 0.12 : 1)
  return { g, head, left, right, skin, blink }
}
/** The little pool each character stands on. */
const pool = (color: string) => at(new Mesh(new CylinderGeometry(1.25, 1.25, 0.08, 56), clay(color, 0.35)), 0, -1.16, 0)

/** The four characters, in the order of content.response.links: GitHub, LinkedIn, JointOps, Email. */
function cast(): { g: Group; act: Act }[] {
  // GitHub: a violet cat who carries the GitHub mark, tail wagging
  const cat = buddy('#8f6ae0', '#d9c8ff')
  for (const x of [-0.46, 0.46]) {
    const ear = at(new Mesh(new ConeGeometry(0.26, 0.42, 24), cat.skin), x, 0.66, 0)
    ear.rotation.z = -x * 0.5
    cat.head.add(ear, at(ball(0.11, clay('#ffb3c7'), 1, 1.3, 0.5), x * 0.98, 0.6, 0.1))
  }
  for (const x of [-1, 1])
    for (const k of [-1, 1]) {
      const w = at(new Mesh(new CylinderGeometry(0.012, 0.012, 0.6, 6), clay('#ffffff')), x * 0.92, -0.1 + k * 0.07, 0.4)
      w.rotation.z = Math.PI / 2 + x * k * 0.16
      cat.head.add(w)
    }
  const tail = at(new Group(), 0.3, -0.75, -0.35)
  const curl = new Mesh(new TorusGeometry(0.42, 0.1, 12, 28, Math.PI * 1.15), cat.skin)
  curl.rotation.y = Math.PI / 2
  tail.add(at(curl, 0.42, 0.3, 0))
  const hub = at(badge(ICONS.github, '#ffffff', '#15151f'), 0, -0.42, 0.72)
  const catAll = new Group()
  catAll.add(cat.g, tail, hub, pool('#3d2c66'))
  cat.left.rotation.set(-0.9, 0, 0.5)
  cat.right.rotation.set(-0.9, 0, -0.5)
  const purr: Act = (t, e, x) => {
    cat.blink(t)
    tail.rotation.z = Math.sin(t * 3 + x * 6) * 0.4
    cat.head.rotation.z = Math.sin(t * 1.4) * 0.09
    hub.position.y = -0.42 + Math.abs(Math.sin(t * 2 + x * 5)) * (0.05 + e * 0.35)
    hub.rotation.y = Math.sin(t * 2) * 0.25 + e * Math.sin(t * 9) * 0.5
  }
  // LinkedIn: a blue fellow in a tie, waving, with the LinkedIn mark floating beside him
  const pro = buddy('#4f86e8', '#ffffff')
  pro.g.add(at(new Mesh(new ConeGeometry(0.11, 0.42, 4), clay('#15151f', 0.3)), 0, -0.36, 0.6), at(ball(0.07, clay('#15151f', 0.3)), 0, -0.12, 0.6))
  ;(pro.g.children[pro.g.children.length - 2] as Mesh).rotation.x = Math.PI
  const inn = at(badge(ICONS.linkedin, '#ffffff', '#2f6bd8'), -1.05, 0.25, 0.2)
  const proAll = new Group()
  proAll.add(at(pro.g, 0.25, 0, 0), inn, pool('#1c3566'))
  const wave: Act = (t, e, x) => {
    pro.blink(t + 1.3)
    pro.right.rotation.z = 2.35 + Math.sin(t * 6 + x * 9) * 0.4
    pro.head.rotation.z = Math.sin(t * 1.7) * 0.1
    pro.g.position.y = Math.abs(Math.sin(t * 2 + x * 4)) * (0.04 + e * 0.3)
    inn.position.y = 0.25 + Math.sin(t * 1.8) * 0.12
    inn.rotation.y = 0.35 + Math.sin(t * 1.1) * 0.3 + x * 4
  }
  // JointOps: an open parcel, with three packages (hitlimit, bunWay, kaput) bobbing out of it
  const card = clay('#e2a12a'),
    parcel = new Group()
  const lidL = at(new Group(), -0.9, 0.45, 0),
    lidR = at(new Group(), 0.9, 0.45, 0)
  lidL.add(at(slab(0.9, 0.1, 1.5, card, 0.05), -0.45, 0, 0))
  lidR.add(at(slab(0.9, 0.1, 1.5, card, 0.05), 0.45, 0, 0))
  const pkgs = ['#b688ff', '#72a3fe', '#06c281'].map((c, i) => at(slab(0.5, 0.5, 0.5, clay(c), 0.12), (i - 1) * 0.55, 0.5, (i % 2) * 0.3 - 0.15))
  parcel.add(at(slab(1.8, 1.1, 1.5, card, 0.14), 0, -0.1, 0), at(slab(0.3, 1.12, 1.52, clay('#f4d48a'), 0.05), 0, -0.1, 0), lidL, lidR, ...pkgs)
  const parcelAll = new Group()
  parcelAll.add(at(parcel, 0, -0.5, 0), pool('#5a3d05'))
  const unpack: Act = (t, e, x) => {
    lidL.rotation.z = 0.9 + Math.sin(t * 1.6) * 0.15
    lidR.rotation.z = -0.9 - Math.sin(t * 1.6 + 1) * 0.15
    pkgs.forEach((p, i) => {
      p.position.y = 0.75 + Math.sin(t * 2 + x * 4 + i * 1.9) * (0.28 + e * 0.5) + i * 0.12
      p.rotation.set(Math.sin(t + i) * 0.3, t * 0.8 + x * 3 + i * 2, 0)
    })
  }
  // Email: an open envelope; the letter rides up out of it, and an @ badge bobs above
  const blue = clay('#5b6ee8'),
    paler = clay('#7d8df2')
  const tri = (pts: [number, number][], m: MeshStandardMaterial, depth: number) => {
    const s = new Shape()
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
    s.closePath()
    return new Mesh(new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 }), m)
  }
  const letter = new Group()
  letter.add(
    slab(1.7, 1.3, 0.08, clay('#f4f4f1'), 0.04),
    at(slab(1.2, 0.14, 0.04, clay('#ff9d4d'), 0.02), 0, 0.2, 0.05),
    at(slab(1.2, 0.14, 0.04, clay('#ff9d4d'), 0.02), 0, -0.08, 0.05),
    at(slab(0.7, 0.14, 0.04, clay('#ffc48f'), 0.02), -0.25, -0.36, 0.05),
  )
  const env = new Group()
  env.add(
    at(slab(2.2, 1.4, 0.16, blue, 0.08), 0, 0, -0.16), // back
    at(
      tri(
        [
          [-1.1, 0],
          [1.1, 0],
          [0, 0.95],
        ],
        blue,
        0.08,
      ),
      0,
      0.66,
      -0.24,
    ), // the open flap, standing up behind
    letter,
    at(
      tri(
        [
          [-1.1, -0.7],
          [1.1, -0.7],
          [1.1, 0.62],
          [0, -0.12],
          [-1.1, 0.62],
        ],
        paler,
        0.1,
      ),
      0,
      0,
      0.1,
    ), // the pocket, in front
  )
  const mailAll = new Group()
  mailAll.add(at(env, 0, -0.35, 0), pool('#232a66'))
  const post: Act = (t, e, x) => {
    letter.position.y = 0.42 + Math.sin(t * 1.6 + x * 4) * (0.2 + e * 0.2)
    env.rotation.z = Math.sin(t * 1.2) * 0.05
    env.position.y = -0.35 + Math.abs(Math.sin(t * 2 + x * 4)) * e * 0.25
  }
  return [
    { g: catAll, act: purr },
    { g: proAll, act: wave },
    { g: parcelAll, act: unpack },
    { g: mailAll, act: post },
  ]
}

/**
 * One WebGL canvas laid over the list, drawing each character into its link's stage (one viewport per link).
 * Hovering or focusing a link excites its character. Decorative; without WebGL the links keep their flat icons.
 */
export default function Mascots() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const list = c.parentElement!
    const stages = [...list.querySelectorAll<HTMLElement>('.links__stage')]
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ canvas: c, antialias: true, alpha: true })
    } catch {
      return
    }
    list.dataset.live = 'true'
    const scene = new Scene()
    const key = at(new DirectionalLight('#ffffff', 2.6), 3, 5, 6)
    const rim = at(new DirectionalLight('#b9c4ff', 1.6), -5, 2, -4)
    scene.add(new HemisphereLight('#ffffff', '#54547a', 1.9), key, rim)
    const camera = new PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 1.1, 7.4)
    camera.lookAt(0, -0.05, 0)
    const actors = cast()
    actors.forEach((a) => scene.add(a.g))
    const excited = actors.map(() => 0)
    const xt = actors.map(() => 0) // each character's excited time
    const hot = stages.map((s) => s.closest('a')!)

    // Compare against what THIS renderer applied, never the canvas: under StrictMode a second renderer inherits
    // an already-sized canvas but starts at pixel ratio 1 (and three floors sizes, so rounding never matches anyway).
    let applied = ''
    let last = 1.2
    const draw = (t: number) => {
      const dt = Math.min(0.1, Math.max(0, t - last)) // a paused tab resumes without a leap
      last = t
      const r = c.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1) // capped: four characters at 3× cost too much on a mid-range phone
      const size = `${r.width}x${r.height}@${dpr}`
      if (size !== applied) {
        applied = size
        renderer.setPixelRatio(dpr)
        renderer.setSize(r.width, r.height, false)
      }
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.setScissorTest(true)
      stages.forEach((stage, i) => {
        const a = actors[i]
        if (!a) return
        const s = stage.getBoundingClientRect()
        excited[i] += ((hot[i].matches(':hover, :focus-visible, :active') ? 1 : 0) - excited[i]) * 0.1
        actors.forEach((x) => (x.g.visible = x === a))
        a.g.rotation.y = -0.3 + Math.sin(t * 0.6 + i) * 0.22
        xt[i] += excited[i] * dt
        a.act(t, excited[i], xt[i])
        const x = s.left - r.left,
          y = r.bottom - s.bottom
        renderer.setViewport(x, y, s.width, s.height)
        renderer.setScissor(x, y, s.width, s.height)
        camera.aspect = s.width / s.height
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
      })
    }
    draw(1.2)
    // resizing or rotating moves the stages: redraw at once (the only redraw under reduced motion)
    const ro = new ResizeObserver(() => draw(last))
    ro.observe(list)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches)
      return () => {
        ro.disconnect()
        renderer.dispose()
      }

    // touch has no hover: a press pops the character to full excitement, so even a quick tap shows it
    const press = (e: PointerEvent) => {
      const i = hot.indexOf((e.target as Element).closest('a')!)
      if (i >= 0) excited[i] = 1
    }
    list.addEventListener('pointerdown', press)
    let raf = 0,
      onScreen = false
    const frame = (now: number) => {
      draw(now / 1000)
      raf = onScreen && !document.hidden ? requestAnimationFrame(frame) : 0
    }
    const wake = () => void (!raf && onScreen && !document.hidden && (raf = requestAnimationFrame(frame)))
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
      list.removeEventListener('pointerdown', press)
      document.removeEventListener('visibilitychange', wake)
      renderer.dispose()
    }
  }, [])
  return <canvas ref={ref} className="links__canvas" aria-hidden="true" />
}
