import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { bodies } from '../data/bodies'
import { usePortfolio } from '../store'
import { disableWebGL } from '../webgl'
import { Belt, Planet, Ship, Station, Sun } from './parts'
import Sim from './Sim'
import { coarse, world } from './world'

function Labels() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bodies.map((b) => (
        <div
          key={b.id}
          ref={(el) => { world.labels[b.id] = el }}
          className="absolute left-0 top-0 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.16em] text-white/95 opacity-0 will-change-transform [text-shadow:0_0_3px_rgba(0,0,0,.95),0_1px_10px_rgba(0,0,0,.95)]"
        >
          {b.name}
        </div>
      ))}
    </div>
  )
}

/** A lost GL context (GPU reset, tab eviction) leaves a dead canvas: fall back to the list view. */
function ContextGuard() {
  const el = useThree((s) => s.gl.domElement)
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault()
      disableWebGL()
      usePortfolio.getState().setView('list')
    }
    el.addEventListener('webglcontextlost', lost)
    return () => el.removeEventListener('webglcontextlost', lost)
  }, [el])
  return null
}

export default function Universe() {
  const quality = usePortfolio((s) => s.quality)
  const setQuality = usePortfolio((s) => s.setQuality)
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas
        dpr={quality === 'low' ? 1 : coarse ? [1, 1.5] : [1, 2]}
        camera={{ fov: 54, near: 0.1, far: 2500, position: [0, 26, 80] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        role="img"
        aria-label="Interactive 3D solar system. Each planet is a project. Use the destination list or the list view for an accessible version."
      >
        <ContextGuard />
        <PerformanceMonitor onDecline={() => setQuality('low')} />
        <ambientLight color="#6070a8" intensity={0.55} />
        <pointLight color="#ffd8a8" intensity={5} distance={0} decay={0} />
        <Sim />
        {bodies.map((b) =>
          b.kind === 'sun' ? <Sun key={b.id} body={b} /> : b.kind === 'station' ? <Station key={b.id} body={b} /> : <Planet key={b.id} body={b} />,
        )}
        <Belt />
        <Ship />
        {quality === 'high' && (
          <EffectComposer multisampling={coarse ? 0 : 4}>
            <Bloom intensity={coarse ? 0.5 : 0.62} luminanceThreshold={0.95} luminanceSmoothing={0.2} mipmapBlur radius={0.55} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
      <Labels />
    </div>
  )
}
