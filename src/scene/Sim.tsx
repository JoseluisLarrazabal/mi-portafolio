import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, LineBasicMaterial, DirectionalLight, LineSegments, Object3D, PerspectiveCamera, Points, Vector3 } from 'three'
import { input } from '../input'
import { usePortfolio } from '../store'
import {
  clampArena, createWarp, dockRange, evalWarp, keepOutFor, orbitPosition, pushOutside, standoffFor, stepFree,
} from './flight'
import { Backdrop } from './parts'
import { coarse, orbiterById, orbiters, reduced, world } from './world'

const KMAP: Record<string, 'w' | 's' | 'a' | 'd' | 'shift'> = {
  KeyW: 'w', ArrowUp: 'w', KeyS: 's', ArrowDown: 's', KeyA: 'a', ArrowLeft: 'a', KeyD: 'd', ArrowRight: 'd',
  ShiftLeft: 'shift', ShiftRight: 'shift',
}
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v))
const dead = (v: number) => (Math.abs(v) < 0.08 ? 0 : v)

/** Keyboard only listens while flying with no panel open. */
function useKeys() {
  const active = usePortfolio((s) => s.view === 'flight' && s.openId === null)
  useEffect(() => {
    const k = world.keys
    const reset = () => {
      k.w = k.s = k.a = k.d = k.shift = false
    }
    if (!active) return reset
    const typing = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    }
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return
      if (e.code === 'KeyE') {
        const s = usePortfolio.getState()
        if (s.nearId) {
          e.preventDefault()
          s.openPanel(s.nearId)
        }
        return
      }
      const key = KMAP[e.code]
      if (!key) return
      k[key] = true
      if (key !== 'shift') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      const key = KMAP[e.code]
      if (key) k[key] = false
    }
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    addEventListener('blur', reset)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      removeEventListener('blur', reset)
      reset()
    }
  }, [active])
}

const SK = 120

/** Per-frame label scratch, indexed like `orbiters`. */
const NB = orbiters.length
const LB = {
  op: new Float32Array(NB), x: new Float32Array(NB), y: new Float32Array(NB), cx: new Float32Array(NB), cy: new Float32Array(NB),
  w: new Float32Array(NB), key: new Float32Array(NB), ord: new Uint8Array(NB), pl: new Uint8Array(NB),
}

/** Everything that moves: orbits, ship, camera, warp effects, labels. One priority -2 frame so all readers see fresh data. */
export default function Sim() {
  useKeys()
  const stars = useRef<Points>(null)
  const fill = useRef<DirectionalLight>(null)
  const streakGroup = useRef<Object3D>(null)

  const st = useMemo(() => {
    const pos = new Float32Array(SK * 6)
    const x = new Float32Array(SK), y = new Float32Array(SK), z = new Float32Array(SK)
    for (let i = 0; i < SK; i++) {
      const a = Math.random() * Math.PI * 2, r = 2.6 + Math.random() * 12
      x[i] = Math.cos(a) * r
      y[i] = Math.sin(a) * r * 0.7
      z[i] = -90 * Math.random()
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    const mat = new LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
    mat.color.setRGB(1.1, 1.5, 2.4)
    const lines = new LineSegments(geo, mat)
    lines.frustumCulled = false
    lines.visible = false
    lines.raycast = () => {}
    return {
      pos, x, y, z, geo, mat, lines,
      camPos: new Vector3(0, 26, 80), camLook: new Vector3(), want: new Vector3(), look: new Vector3(),
      tmp: new Vector3(), aim: new Vector3(),
      warpAmt: 0, camK: 2.2, introT: 0, side: 1 as 1 | -1, baseFov: 54, activeTarget: null as string | null,
    }
  }, [])

  useEffect(() => () => { st.geo.dispose(); st.mat.dispose() }, [st])

  function clearWarp() {
    const sh = world.ship
    sh.warp = null
    sh.warpId = null
    st.activeTarget = null
  }

  function endWarpFree() {
    clearWarp()
    world.ship.mode = 'free'
    world.ship.speed = 10
  }

  function arrive(id: string) {
    const sh = world.ship
    clearWarp()
    sh.mode = 'hold'
    sh.holdId = id
    sh.speed = 0
    usePortfolio.setState({ targetId: null, warping: false })
    usePortfolio.getState().setNear(id)
  }

  function startWarp(id: string) {
    const o = orbiterById(id)
    if (!o) return usePortfolio.setState({ targetId: null })
    const sh = world.ship
    const standoff = standoffFor(o.body.kind, o.body.radius)
    const path = createWarp(sh.pos, o.pos, standoff, st.side, reduced, world.clk)
    st.side = (st.side * -1) as 1 | -1
    st.activeTarget = id
    if (!path) {
      sh.holdOff.copy(sh.pos).sub(o.pos)
      return arrive(id)
    }
    sh.mode = 'warp'
    sh.warp = path
    sh.warpId = id
    sh.holdId = null
    usePortfolio.getState().setNear(null)
    usePortfolio.getState().setWarping(true)
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const store = usePortfolio.getState()
    const sh = world.ship
    const camera = state.camera as PerspectiveCamera
    world.clk += dt
    if (!reduced) {
      world.t += dt
      world.orbitClock += dt
    }

    for (const o of orbiters) {
      orbitPosition(o.pos, o.orbit, o.phase, o.speed, world.orbitClock)
      world.groups[o.body.id]?.position.copy(o.pos)
    }

    if (store.view !== 'launch' && sh.mode === 'intro') {
      sh.mode = 'free'
      sh.speed = 0
      st.camK = 1.6
    } else if (store.view === 'launch' && sh.mode !== 'intro') {
      // back from the list view: orbit the system again
      clearWarp()
      sh.mode = 'intro'
      sh.holdId = null
      sh.speed = 0
      usePortfolio.setState({ targetId: null, warping: false, nearId: null })
    }

    /* input */
    const act = store.view === 'flight' && store.openId === null
    const k = world.keys
    const thrust = act ? clamp1(dead(k.w ? 1 : 0) - (k.s ? 1 : 0) + dead(input.joyY)) : 0
    const turn = act ? clamp1((k.a ? 1 : 0) - (k.d ? 1 : 0) - dead(input.joyX)) : 0
    const manual = Math.abs(thrust) > 0.05 || Math.abs(turn) > 0.05

    if (store.targetId && store.view === 'flight' && store.targetId !== st.activeTarget) startWarp(store.targetId)
    else if (!store.targetId && sh.mode === 'warp') {
      // cancelled from the UI
      endWarpFree()
      store.setWarping(false)
    }
    if (manual && sh.mode === 'warp') {
      endWarpFree()
      store.cancelWarp()
    }
    if (manual && sh.mode === 'hold') {
      sh.mode = 'free'
      sh.holdId = null
    }

    /* integrate */
    if (sh.mode === 'free') {
      stepFree(sh, thrust, turn, k.shift, dt)
    } else if (sh.mode === 'warp' && sh.warp && sh.warpId) {
      const o = orbiterById(sh.warpId)!
      const u = Math.min(1, (world.clk - sh.warp.t0) / sh.warp.dur)
      st.tmp.copy(sh.pos)
      evalWarp(sh.warp, o.pos, u, sh.pos, sh.heading)
      sh.speed = st.tmp.distanceTo(sh.pos) / Math.max(dt, 1e-3)
      sh.bank *= 1 - Math.min(1, dt * 4)
      if (u >= 1) {
        sh.holdOff.copy(sh.pos).sub(o.pos)
        arrive(sh.warpId)
      }
    } else if (sh.mode === 'hold' && sh.holdId) {
      const o = orbiterById(sh.holdId)!
      sh.pos.copy(o.pos).add(sh.holdOff)
      st.tmp.copy(o.pos).sub(sh.pos).setY(0)
      if (st.tmp.lengthSq() > 1e-6) sh.heading.lerp(st.tmp.normalize(), Math.min(1, dt * 3)).normalize()
      sh.speed = 0
      sh.bank *= 1 - Math.min(1, dt * 4)
    }
    if (sh.mode !== 'hold') {
      for (const o of orbiters) {
        if (pushOutside(sh.pos, o.pos, keepOutFor(o.body.kind, o.body.radius))) sh.speed *= 0.5
      }
    }
    clampArena(sh.pos)

    if (sh.obj) {
      sh.obj.position.copy(sh.pos)
      sh.obj.lookAt(st.tmp.copy(sh.pos).add(sh.heading))
    }
    if (sh.body) sh.body.rotation.z = sh.bank

    const wTarget = sh.mode === 'warp' && sh.warp && !reduced
      ? Math.pow(Math.sin(Math.PI * Math.min(1, (world.clk - sh.warp.t0) / sh.warp.dur)), 0.7)
      : 0
    st.warpAmt += (wTarget - st.warpAmt) * Math.min(1, dt * (wTarget > st.warpAmt ? 6 : 4))
    const wa = st.warpAmt
    if (sh.flame) {
      const sc = (1 + Math.min(1, Math.abs(sh.speed) / 40) * 1.4 + wa * 0.8) * 0.9
      sh.flame.scale.set(sc, sc, 1)
    }

    /* dock candidate */
    let near: string | null = null
    if (store.view === 'flight' && (sh.mode === 'free' || sh.mode === 'hold')) {
      let best = 1e9
      for (const o of orbiters) {
        const d = sh.pos.distanceTo(o.pos) - o.body.radius
        if (d < dockRange(o.body.kind) && d < best) {
          best = d
          near = o.body.id
        }
      }
    }
    if (near !== store.nearId && sh.mode !== 'warp') store.setNear(near)

    /* camera */
    const aspect = state.size.width / state.size.height
    st.baseFov = aspect < 0.8 ? 70 : aspect < 1.2 ? 62 : 54
    if (sh.mode === 'intro') {
      if (store.view === 'launch' && !reduced) st.introT += dt
      const a = (reduced ? 0.6 : st.introT * 0.045 + 0.6)
      const rad = coarse ? 130 : 96
      st.look.set(0, 0, 0)
      st.want.set(Math.sin(a) * rad, coarse ? 52 : 38, Math.cos(a) * rad)
    } else {
      const back = 9 + Math.min(1, Math.abs(sh.speed) / 50) * 3 + wa * 5
      st.want.copy(sh.pos).addScaledVector(sh.heading, -back)
      st.want.y += 3.4 + wa * 0.8
      st.look.copy(sh.pos).addScaledVector(sh.heading, 7)
      st.look.y += 0.7
    }
    st.camK += ((reduced ? 40 : 8) - st.camK) * Math.min(1, dt * 0.7)
    const kk = 1 - Math.exp(-dt * st.camK)
    st.camPos.lerp(st.want, kk)
    st.camLook.lerp(st.look, kk)
    camera.position.copy(st.camPos)
    camera.lookAt(st.camLook)
    const fov = st.baseFov + wa * 20
    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    /* warp streaks live in camera space */
    const on = wa > 0.02
    st.lines.visible = on
    if (on) {
      st.mat.opacity = Math.min(1, wa * 0.85)
      const len = 2 + 28 * wa, v = 50 + 190 * wa
      for (let i = 0; i < SK; i++) {
        let z = st.z[i] + v * dt
        if (z > 4) z = -95 - Math.random() * 20
        st.z[i] = z
        const j = i * 6
        st.pos[j] = st.pos[j + 3] = st.x[i]
        st.pos[j + 1] = st.pos[j + 4] = st.y[i]
        st.pos[j + 2] = z
        st.pos[j + 5] = z - len
      }
      st.geo.attributes.position.needsUpdate = true
    }
    streakGroup.current?.position.copy(camera.position)
    streakGroup.current?.quaternion.copy(camera.quaternion)
    stars.current?.position.copy(camera.position)
    fill.current?.position.copy(camera.position).add(st.tmp.set(-20, 30, 10))

    /* labels: projected DOM; cull off-screen, fade by distance, drop overlaps (no allocations) */
    const W = state.size.width, H = state.size.height
    const narrow = coarse || W <= 760
    const hide = store.view !== 'flight' || (narrow && !!store.openId)
    const far = narrow ? 45 : 70, M = 12, maxShown = narrow ? 6 : orbiters.length
    const dim = store.openId ? 0.4 : 1
    let n = 0
    for (let i = 0; i < orbiters.length; i++) {
      const o = orbiters[i], el = world.labels[o.body.id]
      if (!el) continue
      LB.op[i] = 0
      if (hide) continue
      st.aim.copy(o.pos)
      st.aim.y += o.body.radius * 1.25 + 0.9
      st.aim.project(camera)
      const x = (st.aim.x * 0.5 + 0.5) * W
      const y = (-st.aim.y * 0.5 + 0.5) * H
      if (st.aim.z >= 1 || x < 0 || x > W || y < 0 || y > H) continue
      const pri = o.body.id === sh.warpId || o.body.id === sh.holdId || o.body.id === world.hover
      const d = camera.position.distanceTo(o.pos)
      let op: number
      if (pri) op = 1
      else if (o.body.id === store.nearId) op = Math.max(0, Math.min(1, (sh.pos.distanceTo(o.pos) - o.body.radius - 5) / 10))
      else op = d >= far ? 0 : Math.min(1, (far - d) / (far * 0.4)) * 0.95
      if (op <= 0.02) continue
      LB.op[i] = op * dim
      LB.x[i] = x
      LB.y[i] = y
      LB.key[i] = (pri ? 0 : 1e6) + d
      LB.w[i] = o.body.name.length * 9.2 + 8 // 12px mono + 0.16em tracking
      LB.ord[n++] = i
    }
    // insertion sort by priority then distance (n <= ~12)
    for (let i = 1; i < n; i++) {
      const v = LB.ord[i]
      let j = i - 1
      while (j >= 0 && LB.key[LB.ord[j]] > LB.key[v]) { LB.ord[j + 1] = LB.ord[j]; j-- }
      LB.ord[j + 1] = v
    }
    let placed = 0
    for (let k = 0; k < n; k++) {
      const i = LB.ord[k], hw = LB.w[i] / 2
      // partially overflowing: keep text inside the margin
      const cx = Math.min(Math.max(LB.x[i], M + hw), Math.max(M + hw, W - M - hw))
      const cy = Math.min(Math.max(LB.y[i], M + 16), Math.max(M + 16, H - M))
      let ok = placed < maxShown
      for (let q = 0; ok && q < placed; q++) {
        const j = LB.pl[q]
        if (Math.abs(cx - LB.cx[j]) < hw + LB.w[j] / 2 + 4 && Math.abs(cy - LB.cy[j]) < 18) ok = false
      }
      if (!ok) { LB.op[i] = 0; continue }
      LB.pl[placed++] = i
      LB.cx[i] = cx
      LB.cy[i] = cy
      world.labels[orbiters[i].body.id]!.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) translate(-50%,-100%)`
    }
    for (let i = 0; i < orbiters.length; i++) {
      const el = world.labels[orbiters[i].body.id]
      if (!el) continue
      const v = LB.op[i] === 0 ? '0' : LB.op[i].toFixed(2)
      if (el.style.opacity !== v) el.style.opacity = v
    }
  }, -2)

  return (
    <>
      <Backdrop starsRef={stars} />
      <group ref={streakGroup}>
        <primitive object={st.lines} />
      </group>
      <directionalLight ref={fill} color="#9db4ff" intensity={1.1} />
    </>
  )
}
