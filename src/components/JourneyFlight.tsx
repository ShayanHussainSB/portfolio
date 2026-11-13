import { useEffect, useRef } from 'react'
import {
  BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, DirectionalLight, DoubleSide,
  Fog, Group, HemisphereLight, Line, LineBasicMaterial, BufferGeometry,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry,
  Raycaster, Scene, SphereGeometry, SRGBColorSpace, Texture, TextureLoader, TubeGeometry,
  Vector2, Vector3, WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { progress } from '../lib/scroll'
import { link, short } from '../lib/chain'

const files = import.meta.glob('../assets/photos/journey-*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const ledger = link(Array.from({ length: 9 }, (_, i) => ({ year: 'Example', headline: `Block ${i + 1}`, line: 'Illustrative ledger records' })))

/** One linked ledger in a quiet space. The camera follows its curve without rolling. */
export default function JourneyFlight({ onFail, theme }: { onFail: () => void; theme: 'light' | 'dark' | 'darker' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const statusRef=useRef<HTMLSpanElement>(null)
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
    renderer.autoClear = false
    const scene = new Scene()
    const background = new Color(0xeaf2ef), targetBackground = new Color(0xeaf2ef)
    scene.fog = new Fog(background, 25, 85)
    const camera = new PerspectiveCamera(58, 1, .5, 100)
    const route = new CatmullRomCurve3([
      new Vector3(0, 0, 12), new Vector3(0, -1, -20), new Vector3(12, -5, -65),
      new Vector3(-9, -13, -115), new Vector3(11, -21, -170),
      new Vector3(-6, -29, -230), new Vector3(0, -35, -280),
    ])
    const frames = route.computeFrenetFrames(400, false)
    const at = (t: number, x = 0, y = 0) => {
      t = Math.max(0, Math.min(.999, t))
      const k = Math.round(t * 400)
      return route.getPointAt(t).addScaledVector(frames.normals[k], x).addScaledVector(frames.binormals[k], y)
    }
    scene.add(new HemisphereLight(0xe3f3ff, 0x152335, 2.6))
    const key = new DirectionalLight(0xcdf7ee, 2.1)
    key.position.set(-6, 12, 10)
    scene.add(key, key.target)
    const fill = new DirectionalLight(0xadc4ff, 1.3)
    fill.position.set(8, -2, -10)
    scene.add(fill, fill.target)

    const bodyMaterial = new MeshStandardMaterial({ color: 0x243c40, metalness: .3, roughness: .5 })
    const trimMaterial = new MeshBasicMaterial({ color: 0xa0d9c4, transparent: true, opacity: .7 })
    const recordMaterial = new MeshStandardMaterial({ color: 0x80b9a8, metalness: .25, roughness: .45 })
    const textures: Texture[] = []
    const blockGeo = new RoundedBoxGeometry(4.4, 4.8, 6, 3, .16)
    const recordGeo = new BoxGeometry(.36, .2, .06)
    const railGeo = new BoxGeometry(.035, 4.2, .035)
    const blockTimes = ledger.map((_, i) => .2 + i * .087)

    const blocks: { group:Group; body:Mesh<RoundedBoxGeometry,MeshStandardMaterial>; records:Mesh[]; label:Mesh; scanner:Mesh; paint:(stage:string)=>void; openness:number }[]=[]
    ledger.forEach((block, i) => {
      const t = blockTimes[i], group = new Group()
      const body=new Mesh(blockGeo,bodyMaterial.clone())
      body.material.transparent=true
      group.add(body)
      const records:Mesh[]=[]
      // The face holds records, a block hash and its predecessor: the visible grammar of a chain.
      for (let n = 0; n < 16; n++) {
        const record = new Mesh(recordGeo, recordMaterial)
        record.position.set((n % 4 - 1.5) * .55, .4 - Math.floor(n / 4) * .38, 3.04)
        group.add(record)
        records.push(record)
      }
      for (const x of [-1.95, 1.95]) {
        const rail = new Mesh(railGeo, trimMaterial)
        rail.position.set(x, 0, 3.025)
        group.add(rail)
      }
      const c = document.createElement('canvas')
      c.width = 1024; c.height = 360
      const g = c.getContext('2d')!
      const drawLabel=(stage:string)=>{
        g.clearRect(0,0,c.width,c.height)
        g.fillStyle='#d3eee3';g.font='500 47px monospace'
        g.fillText(`BLOCK ${String(i+1).padStart(2,'0')}`,30,65)
        g.font='28px monospace';g.fillStyle='#9fbbb7'
        g.fillText(`hash  ${short(block.hash)}`,30,137)
        g.fillText(`prev  ${short(block.prev)}`,30,190)
        g.font='27px monospace';g.fillStyle='#bdf4d8'
        g.fillText(stage,30,295)
      }
      drawLabel('ILLUSTRATIVE LEDGER')
      const texture = new CanvasTexture(c)
      texture.colorSpace = SRGBColorSpace
      textures.push(texture)
      const label = new Mesh(new PlaneGeometry(3.7, 1.3), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }))
      label.position.set(0, 1.35, 3.04)
      group.add(label)
      group.scale.setScalar(.55)
      group.position.copy(at(t))
      group.lookAt(at(t - .04))
      scene.add(group)
      const scanner=new Mesh(new PlaneGeometry(3.2,.055),new MeshBasicMaterial({color:0xc7ffe1,transparent:true,opacity:.9,side:DoubleSide}))
      scanner.position.set(0,.6,3.12);scanner.visible=false;group.add(scanner)
      blocks.push({group,body,records,label,scanner,openness:0,paint:stage=>{drawLabel(stage);texture.needsUpdate=true}})
    })

    // One line joins successive block bodies. No wall tiles, grids or crossing decoration.
    const chainRoute = new CatmullRomCurve3(blockTimes.map(t => at(t)))
    scene.add(new Mesh(new TubeGeometry(chainRoute, 150, .055, 6, false), trimMaterial))
    const pulse = new Mesh(new SphereGeometry(.12, 8, 8), new MeshBasicMaterial({ color: 0xb9f0d8 }))
    scene.add(pulse)

    // The collection surface dissolves as the visitor enters the ledger.
    const surface = new Group()
    const surfaceMaterials: MeshBasicMaterial[] = []
    const loader = new TextureLoader()
    let alive = true
    Object.values(files).forEach((url, i) => {
      const texture = loader.load(url, () => {
        if (!alive) { texture.dispose(); return }
        texture.colorSpace = SRGBColorSpace
        for (let repeat = 0; repeat < 2; repeat++) {
          const index = i + repeat * Object.keys(files).length
          const t = .025 + index / (Object.keys(files).length * 2) * .13, a = index * 2.399
          const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true })
          surfaceMaterials.push(material)
          const card = new Mesh(new PlaneGeometry(1.05, 1.05), material)
          card.position.copy(at(t, Math.cos(a) * 5.8, Math.sin(a) * 5.8))
          card.lookAt(at(Math.max(0, t - .03)))
          surface.add(card)
        }
      })
      textures.push(texture)
    })
    for (let lane = 0; lane < 6; lane++) {
      const points: Vector3[] = []
      for (let i = 0; i <= 55; i++) {
        const t = i / 56 * .17, a = lane / 6 * Math.PI * 2 + t
        points.push(at(t, Math.cos(a) * 9, Math.sin(a) * 9))
      }
      surface.add(new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: 0x80afaa, transparent: true, opacity: .12 })))
    }
    scene.add(surface)

    const transaction=new Mesh(new BoxGeometry(.13,.13,.13),new MeshBasicMaterial({color:0xd6ffe8}))
    transaction.visible=false;scene.add(transaction)
    const raycaster=new Raycaster(),mouse=new Vector2(10,10)
    let hovered=-1,active=-1,started=0,phase=-1,lastChapter=-1
    const closestBlock=()=>{
      const t=.001+progress(host)*.9
      const index=blockTimes.findIndex(x=>x>t+.01)
      return Math.min(blocks.length-2,index<0?blocks.length-2:index)
    }
    const start=(index=hovered>=0?hovered:closestBlock())=>{
      if(progress(host)<.1)return
      if(active>=0){blocks[active].scanner.visible=false;blocks[active].paint('ILLUSTRATIVE LEDGER');blocks[active+1]?.paint('ILLUSTRATIVE LEDGER')}
      active=Math.min(blocks.length-2,index);started=performance.now();phase=-1
    }
    const press=(e:PointerEvent)=>{if(e.button===0)start()}
    const keyboard=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();start()}}
    const leave=()=>{hovered=-1;mouse.set(10,10)}
    canvas.addEventListener('pointerdown',press)
    canvas.addEventListener('keydown',keyboard)
    canvas.addEventListener('pointerleave',leave)
    let pointerX = 0, pointerY = 0
    const pointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointerX = (e.clientX - r.left) / r.width - .5
      pointerY = (e.clientY - r.top) / r.height - .5
      if(e.target===canvas)mouse.set(pointerX*2,-pointerY*2)
      else leave()
    }
    host.addEventListener('pointermove', pointer as EventListener)
    let width=1,height=1
    const size = () => {
      const r = canvas.getBoundingClientRect()
      width=r.width;height=r.height
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
      renderer.setSize(r.width, r.height, false)
      camera.aspect = r.width / r.height
      camera.fov = r.width < r.height ? 72 : 58
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size); ro.observe(canvas)
    let raf = 0, visible = false, lastTheme = '', lastFrame = 0
    const frame = (now: number) => {
      if (!visible || document.hidden) { raf = 0; return }
      const mode = themeRef.current
      if (lastTheme !== mode) {
        lastTheme = mode
        targetBackground.setHex(mode === 'light' ? 0xeaf2ef : mode === 'darker' ? 0x020409 : 0x080d19)
        bodyMaterial.color.setHex(mode === 'light' ? 0x789894 : 0x40645f)
      }
      const dt=lastFrame?Math.min(.2,(now-lastFrame)/1000):.016
      lastFrame=now
      background.lerp(targetBackground, 1-Math.exp(-dt*8))
      renderer.setClearColor(background)
      ;(scene.fog as Fog).color.copy(background)
      const p = progress(host), t = .001 + p * .9
      const outside = Math.max(0,Math.min(1,(p-.07)/.1))
      camera.position.copy(at(t, outside*8 + pointerX * .25, -pointerY * .2))
      camera.up.set(0, 1, 0)
      camera.lookAt(at(t + .055))
      const chapter=Math.min(5,Math.round(p*5))
      if(chapter!==lastChapter){lastChapter=chapter;if(chapter>0&&chapter<5)start(closestBlock())}
      const opacity = Math.max(0, Math.min(1, (.17 - p) / .07))
      surface.visible = opacity > 0
      surfaceMaterials.forEach(m => { m.opacity = opacity })
      pulse.position.copy(chainRoute.getPointAt((now * .000015) % 1))
      renderer.setScissorTest(false)
      renderer.setViewport(0,0,width,height)
      renderer.clear()
      camera.fov=width<height?72:58
      camera.aspect=width/height
      camera.updateProjectionMatrix()
      key.position.copy(camera.position).add(new Vector3(-8, 9, 6))
      key.target.position.copy(at(t))
      fill.position.copy(camera.position).add(new Vector3(7, -1, -4))
      fill.target.position.copy(at(t))
      camera.updateMatrixWorld()
      raycaster.setFromCamera(mouse,camera)
      const hit=raycaster.intersectObjects(blocks.map(b=>b.body),false)[0]
      hovered=hit?blocks.findIndex(b=>b.body===hit.object):-1
      canvas.style.cursor=hovered>=0?'zoom-in':'crosshair'
      const elapsed=active>=0?Math.max(0,(now-started)/1000):0
      blocks.forEach((block,i)=>{
        const target=i===hovered||i===active&&elapsed<3.2?1:0
        block.openness+=(target-block.openness)*(1-Math.exp(-dt*7))
        block.body.material.color.copy(bodyMaterial.color)
        block.body.material.opacity=1-block.openness*.82
        block.records.forEach((record,n)=>{
          record.position.z=3.04+block.openness*(.45+(n%4)*.35)
          record.scale.setScalar(i===active&&elapsed<1.6?Math.max(.15,Math.min(1,elapsed*1.5-n*.06)):1)
        })
        block.label.position.z=3.04+block.openness*.35
      })
      if(active>=0){
        const block=blocks[active],next=Math.min(3,Math.floor(elapsed/1.4))
        if(next!==phase){phase=next;const stages=['COLLECTING RECORDS','VALIDATING RECORDS','SEALING / HASH','LINKING NEXT BLOCK'];block.paint(stages[next]);if(statusRef.current)statusRef.current.textContent=`Example transaction: ${stages[next].toLowerCase()}.`}
        transaction.visible=true
        if(elapsed<1.4){
          const q=elapsed/1.4,from=block.group.localToWorld(new Vector3(-5,2,6)),to=block.group.localToWorld(new Vector3(0,0,4))
          transaction.position.copy(from.lerp(to,q));block.scanner.visible=false
        }else if(elapsed<2.8){
          transaction.visible=false;block.scanner.visible=true;block.scanner.position.y=.6-(elapsed-1.4)/1.4*1.7
        }else if(elapsed<4.2){
          transaction.visible=false;block.scanner.visible=false
        }else if(elapsed<5.6){
          block.scanner.visible=false
          transaction.position.copy(at(blockTimes[active]+(blockTimes[active+1]-blockTimes[active])*(elapsed-4.2)/1.4))
          blocks[active+1].paint('PREV / '+short(ledger[active].hash))
        }else{
          block.paint('SEALED / '+short(ledger[active].hash));blocks[active+1].paint('ILLUSTRATIVE LEDGER')
          if(statusRef.current)statusRef.current.textContent='Example sealed. The next block references its hash. Click or press Enter to replay.'
          transaction.visible=false;active=-1
        }
      }
      renderer.render(scene, camera)
      canvas.dataset.ready = 'true'
      raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (visible && !document.hidden && !raf) raf = requestAnimationFrame(frame) }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake() }); io.observe(canvas)
    const lost = (e: Event) => { e.preventDefault(); onFail() }
    canvas.addEventListener('webglcontextlost', lost)
    document.addEventListener('visibilitychange', wake)
    return () => {
      alive = false
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
      host.removeEventListener('pointermove', pointer as EventListener)
      canvas.removeEventListener('pointerdown',press);canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('pointerleave',leave)
      canvas.removeEventListener('webglcontextlost', lost)
      document.removeEventListener('visibilitychange', wake)
      const geometries = new Set<BufferGeometry>()
      const materials = new Set<MeshBasicMaterial | MeshStandardMaterial | LineBasicMaterial>()
      scene.traverse(o => {
        if (o instanceof Mesh || o instanceof Line) {
          geometries.add(o.geometry)
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m)
        }
      })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
      textures.forEach(t => t.dispose()); bodyMaterial.dispose(); renderer.dispose()
    }
  }, [onFail])
  return <><canvas className="journey__flight" ref={ref} tabIndex={0} role="button" aria-label="Explore the illustrative blockchain animation. Hover to open a block; click or press Enter to follow an example transaction." aria-describedby="journey-animation-status" /><span className="sr-only" ref={statusRef} id="journey-animation-status" aria-live="polite" /></>
}
