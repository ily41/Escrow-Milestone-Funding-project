'use client'

import { Suspense, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function Coin({ isHovered }: { isHovered: boolean }) {
  const { scene } = useGLTF('/models/coin/coin.gltf')
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const targetY = isHovered ? 0.05 : 0
      // Smooth lerp for slower movement
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05
    }
  })

  return (
    <group ref={meshRef}>
      <primitive
        object={scene}
        scale={3.0}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </group>
  )
}

interface CoinModelProps {
  size?: 'small' | 'large'
}

export default function CoinModel({ size = 'small' }: CoinModelProps) {
  const containerClass = size === 'large' ? 'w-64 h-64 lg:w-96 lg:h-96' : 'w-12 h-12'
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`${containerClass} relative transition-transform duration-500 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* HDRI Environment - provides realistic lighting and reflections */}
        <Suspense fallback={null}>
          <Environment preset="studio" background={false} environmentIntensity={1} />

          {/* Single strong directional light instead of multiple weak ones */}
          <directionalLight
            intensity={1}
            position={[5, 5, 5]}
            castShadow
          />

          {/* Coin model */}
          <Coin isHovered={isHovered} />

          {/* Controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={true}
            autoRotate
            autoRotateSpeed={2}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Post-processing for bloom effect */}
          <EffectComposer>
            <Bloom intensity={0.001} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
