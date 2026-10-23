import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'

export default function App() {
  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#000000']} />
        <Stars />
      </Canvas>
      <h1 className="pointer-events-none absolute inset-x-0 top-8 text-center text-2xl font-semibold tracking-widest text-white">
        Jose Luis Larrazabal
      </h1>
    </div>
  )
}
