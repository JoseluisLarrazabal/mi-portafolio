import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, Color, CubeCamera, DoubleSide,
  InstancedMesh, LineLoop, Material, Mesh, MeshBasicMaterial, Object3D, Points, Scene, ShaderMaterial, SphereGeometry,
  Sprite, SpriteMaterial, SRGBColorSpace, WebGLCubeRenderTarget,
} from 'three'
import type { Body } from '../data/bodies'
import type { Project } from '../data/projects'
import { usePortfolio } from '../store'
import {
  atmoFrag, atmoVert, nebulaFrag, nebulaVert, planetFrag, planetVert, ringFrag, ringVert, starFrag, starVert,
  sunFrag, sunVert,
} from './shaders'
import { coarse, world } from './world'

const reg = (id: string) => (o: Object3D | null) => {
  world.groups[id] = o
}

/* ---------- shared bits ---------- */
let glowTex: CanvasTexture | null = null
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.22, 'rgba(255,255,255,.4)')
  gr.addColorStop(0.6, 'rgba(255,255,255,.07)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  glowTex = new CanvasTexture(c)
  glowTex.colorSpace = SRGBColorSpace
  return glowTex
}

function makeSprite(r: number, g: number, b: number, size: number) {
  const m = new SpriteMaterial({ map: glowTexture(), blending: AdditiveBlending, depthWrite: false, transparent: true })
  m.color.setRGB(r, g, b)
  const s = new Sprite(m)
  s.scale.set(size, size, 1)
  return s
}

const atmoMaterial = (hex: string | Color, intensity: number) =>
  new ShaderMaterial({
    side: BackSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uC: { value: new Color(hex) }, uI: { value: intensity } },
    vertexShader: atmoVert, fragmentShader: atmoFrag,
  })

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Frees GPU resources built in useMemo; R3F does not own <primitive> objects or material props. */
function useDispose(...res: ({ dispose(): void } | null)[]) {
  useEffect(() => () => res.forEach((r) => r?.dispose()), res)
}

const hashStr = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

/* ---------- pointer interaction ---------- */
const canInteract = () => {
  const s = usePortfolio.getState()
  return s.view === 'flight' && s.openId === null
}
const cursor = (e: ThreeEvent<PointerEvent>, v: string) => {
  ;(e.nativeEvent.target as HTMLElement).style.cursor = v
}

function bodyEvents(id: string) {
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 10 || !canInteract()) return
      e.stopPropagation()
      const s = usePortfolio.getState()
      if (s.nearId === id) s.openPanel(id)
      else s.warpTo(id)
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== 'mouse' || !canInteract()) return
      e.stopPropagation()
      world.hover = id
      cursor(e, 'pointer')
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      if (world.hover === id) world.hover = null
      cursor(e, '')
    },
  }
}

function HitSphere({ id, r }: { id: string; r: number }) {
  const ev = useMemo(() => bodyEvents(id), [id])
  return (
    <mesh {...ev}>
      <sphereGeometry args={[r, 16, 12]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

/* ---------- backdrop ---------- */
export function Backdrop({ starsRef }: { starsRef: React.Ref<Points> }) {
  const gl = useThree((t) => t.gl)
  const scene = useThree((t) => t.scene)
  // The nebula is expensive per pixel, so bake it once into a cubemap and use that as the background.
  useLayoutEffect(() => {
    const rt = new WebGLCubeRenderTarget(coarse ? 256 : 512)
    const mat = new ShaderMaterial({ side: BackSide, depthWrite: false, vertexShader: nebulaVert, fragmentShader: nebulaFrag })
    const geo = new SphereGeometry(1, 32, 16)
    const sky = new Scene()
    sky.add(new Mesh(geo, mat))
    new CubeCamera(0.1, 10, rt).update(gl, sky)
    scene.background = rt.texture
    return () => {
      if (scene.background === rt.texture) scene.background = null
      rt.dispose()
      mat.dispose()
      geo.dispose()
    }
  }, [gl, scene])
  const { geo, mat } = useMemo(() => {
    const N = coarse ? 1400 : 2600
    const rnd = mulberry32(1597)
    const pos = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u), R = 600 + rnd() * 500
      pos.set([rr * Math.cos(th) * R, u * R, rr * Math.sin(th) * R], i * 3)
      const bright = rnd() < 0.04
      size[i] = bright ? 3.2 + rnd() * 1.6 : 0.9 + rnd() * 1.5
      const w = rnd()
      const tint = w < 0.2 ? [0.7, 0.8, 1] : w > 0.85 ? [1, 0.85, 0.7] : [0.9, 0.92, 1]
      const g = bright ? 2.2 : 0.45 + rnd() * 0.7
      col.set([tint[0] * g, tint[1] * g, tint[2] * g], i * 3)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new BufferAttribute(size, 1))
    geo.setAttribute('aColor', new BufferAttribute(col, 3))
    const mat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uPR: { value: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2) } },
      vertexShader: starVert, fragmentShader: starFrag,
    })
    return { geo, mat }
  }, [])
  useDispose(geo, mat)
  return <points ref={starsRef} geometry={geo} material={mat} frustumCulled={false} renderOrder={-1} />
}

/* ---------- sun ---------- */
export function Sun({ body }: { body: Body }) {
  const sunMat = useMemo(
    () => new ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: sunVert, fragmentShader: sunFrag }),
    [],
  )
  const atmo = useMemo(() => atmoMaterial('#ff8a2a', 1.1), [])
  const glow = useMemo(() => makeSprite(0.7, 0.32, 0.1, 34), [])
  useDispose(sunMat, atmo, glow.material)
  useFrame(() => {
    sunMat.uniforms.uTime.value = world.t
  })
  return (
    <group ref={reg(body.id)}>
      <mesh material={sunMat}>
        <sphereGeometry args={[body.radius, 96, 64]} />
      </mesh>
      <mesh material={atmo}>
        <sphereGeometry args={[body.radius * 1.45, 48, 32]} />
      </mesh>
      <primitive object={glow} />
      <HitSphere id={body.id} r={body.radius * 1.35} />
    </group>
  )
}

/* ---------- planets ---------- */
const luma = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

// Lift the accent toward a luminous tint for the rim light.
function atmoColor(accent: string) {
  const c = new Color(accent)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  return c.setHSL(hsl.h, hsl.s < 0.1 ? hsl.s : Math.max(hsl.s, 0.5), Math.max(hsl.l, 0.62))
}

const STYLE = { gas: 0, rock: 1, ice: 2 } as const

export function Planet({ body }: { body: Body }) {
  const project = body.project as Project
  const pl = project.planet
  const r = body.radius
  const spin = useRef<Mesh>(null)
  const { mat, atmo, ring, line } = useMemo(() => {
    // dark brand bases get a gain so no planet reads black
    const gain = Math.min(3.4, Math.max(0.8, 0.5 / ((luma(pl.base) + luma(pl.accent)) / 2)))
    const atmoC = atmoColor(pl.accent)
    const mat = new ShaderMaterial({
      uniforms: {
        uBase: { value: new Color(pl.base) }, uAccent: { value: new Color(pl.accent) }, uAtmo: { value: atmoC },
        uStyle: { value: STYLE[pl.surface] }, uSeed: { value: (Math.abs(hashStr(project.slug)) % 1000) / 100 },
        uGain: { value: gain },
      },
      vertexShader: planetVert, fragmentShader: planetFrag,
    })
    const atmo = atmoMaterial(atmoC, gain > 2 ? 1.7 : 1.1)
    const ring = pl.ring
      ? new ShaderMaterial({
          side: DoubleSide, transparent: true, depthWrite: false,
          uniforms: { uC: { value: new Color(pl.ring) }, uIn: { value: r * 1.45 }, uOut: { value: r * 2.35 } },
          vertexShader: ringVert, fragmentShader: ringFrag,
        })
      : null
    const pts: number[] = []
    for (let i = 0; i < 256; i++) {
      const a = (i / 256) * Math.PI * 2
      pts.push(Math.cos(a) * pl.orbit, 0, Math.sin(a) * pl.orbit)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
    const line = new LineLoop(geo, new MeshBasicMaterial({ color: 0x8fa0d0, transparent: true, opacity: 0.16, depthWrite: false }) as Material)
    line.frustumCulled = false
    line.raycast = () => {}
    return { mat, atmo, ring, line }
  }, [pl, project.slug, r])
  useDispose(mat, atmo, ring, line.geometry, line.material as Material)
  useFrame((_, dt) => {
    if (spin.current && world.t > 0) spin.current.rotation.y += Math.min(dt, 0.05) * 0.08
  })
  return (
    <>
      <primitive object={line} />
      <group ref={reg(body.id)}>
        <mesh ref={spin} material={mat}>
          <sphereGeometry args={[r, 64, 48]} />
        </mesh>
        <mesh material={atmo}>
          <sphereGeometry args={[r * 1.2, 48, 32]} />
        </mesh>
        {ring && (
          <mesh material={ring} rotation={[-Math.PI / 2 + 0.42, 0, 0.25]}>
            <ringGeometry args={[r * 1.45, r * 2.35, 160, 1]} />
          </mesh>
        )}
        <HitSphere id={body.id} r={r * 1.5 + (coarse ? 1.2 : 0.6)} />
      </group>
    </>
  )
}

/* ---------- station (contact) ---------- */
export function Station({ body }: { body: Body }) {
  const ring = useRef<Object3D>(null)
  const blink = useRef<MeshBasicMaterial>(null)
  const glow = useMemo(() => makeSprite(1, 0.2, 0.15, 2.4), [])
  useDispose(glow.material)
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += Math.min(dt, 0.05) * (world.t > 0 ? 0.18 : 0)
    const k = 0.12 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(world.t * 2.4), 3)
    blink.current?.color.setRGB(3 * k, 0.35 * k, 0.3 * k)
    ;(glow.material as SpriteMaterial).opacity = k
  })
  return (
    <group ref={reg(body.id)}>
      <group rotation={[0.9, 0.5, 0.2]}>
        <group ref={ring}>
          <mesh>
            <torusGeometry args={[2.5, 0.2, 12, 56]} />
            <meshStandardMaterial color="#aeb6c8" metalness={0.5} roughness={0.4} />
          </mesh>
          {[0, Math.PI / 2].map((a) => (
            <mesh key={a} rotation={[0, 0, a]}>
              <boxGeometry args={[4.8, 0.08, 0.08]} />
              <meshStandardMaterial color="#2a3040" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
        </group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 2.6, 16]} />
          <meshStandardMaterial color="#aeb6c8" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.7, 20, 14]} />
          <meshStandardMaterial color="#c3cad9" metalness={0.4} roughness={0.35} />
        </mesh>
        {[-1.5, 1.5].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[6.4, 0.06, 1.1]} />
            <meshStandardMaterial color="#1b2a55" emissive="#0d1c44" emissiveIntensity={0.6} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <group position={[0, 0, 1.55]}>
          <mesh>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshBasicMaterial ref={blink} />
          </mesh>
          <primitive object={glow} />
        </group>
      </group>
      <HitSphere id={body.id} r={body.radius + 1.6} />
    </group>
  )
}

/* ---------- asteroid belt ---------- */
export function Belt() {
  const mesh = useRef<InstancedMesh>(null)
  const grp = useRef<Object3D>(null)
  const count = coarse ? 150 : 400
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const rnd = mulberry32(62)
    const d = new Object3D()
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, rad = 63.5 + rnd() * 5
      d.position.set(Math.cos(a) * rad, (rnd() - 0.5) * 1.8, Math.sin(a) * rad)
      d.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)
      const s = 0.18 + rnd() * rnd() * 0.8
      d.scale.set(s * (0.8 + rnd() * 0.5), s, s * (0.8 + rnd() * 0.5))
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [count])
  useFrame((_, dt) => {
    if (grp.current && world.t > 0) grp.current.rotation.y += Math.min(dt, 0.05) * 0.006
  })
  return (
    <group ref={grp}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} raycast={() => {}} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#7a7164" roughness={0.95} metalness={0.05} flatShading />
      </instancedMesh>
    </group>
  )
}

/* ---------- ship (nose along +Z) ---------- */
export function Ship() {
  const flame = useMemo(() => makeSprite(0.35, 0.55, 1.4, 1.1), [])
  useDispose(flame.material)
  const sh = world.ship
  useEffect(() => {
    sh.flame = flame
    return () => {
      sh.flame = null
    }
  }, [sh, flame])
  const hull = <meshStandardMaterial color="#aeb6c8" metalness={0.35} roughness={0.42} />
  const dark = <meshStandardMaterial color="#2a3040" metalness={0.5} roughness={0.5} />
  return (
    <group ref={(o) => { sh.obj = o }} scale={0.85} position={sh.pos}>
      <group ref={(o) => { sh.body = o }}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.95]}>
          <coneGeometry args={[0.34, 1.5, 16]} />
          {hull}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.34, 0.26, 1.3, 16]} />
          {hull}
        </mesh>
        <mesh position={[0, 0.22, 0.25]} scale={[1, 0.7, 1.8]}>
          <sphereGeometry args={[0.2, 12, 8]} />
          <meshStandardMaterial color="#101828" metalness={0.8} roughness={0.15} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.7, 0, -0.45]} rotation={[0, -s * 0.38, 0]}>
              <boxGeometry args={[1.15, 0.05, 0.8]} />
              {dark}
            </mesh>
            <mesh position={[s * 1.2, 0, -0.62]}>
              <boxGeometry args={[0.06, 0.3, 0.4]} />
              {hull}
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.34, -0.65]}>
          <boxGeometry args={[0.05, 0.5, 0.55]} />
          {hull}
        </mesh>
        <mesh position={[0, 0, -0.8]}>
          <sphereGeometry args={[0.17, 12, 8]} />
          <meshBasicMaterial color={[2.4, 1.4, 0.7]} />
        </mesh>
        <primitive object={flame} position={[0, 0, -0.95]} />
      </group>
    </group>
  )
}

