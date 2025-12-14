'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function Coin({ isHovered, opacity = 1 }: { isHovered: boolean; opacity?: number }) {
  const { scene } = useGLTF('/models/coin/coin.gltf')
  const meshRef = useRef<THREE.Group>(null)

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = opacity;
          });
        } else {
          mesh.material.transparent = true;
          mesh.material.opacity = opacity;
        }
      }
    });
  }, [scene, opacity]);

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
        scale={4.5}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </group>
  )
}

interface CoinModelProps {
  size?: 'small' | 'large'
  opacity?: number
}

export default function CoinModel({ size = 'large', opacity = 1 }: CoinModelProps) {
  const containerClass = size === 'large' ? 'w-80 h-80 lg:w-[500px] lg:h-[500px]' : 'w-16 h-16'
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`${containerClass} relative transition-transform duration-500 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
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
          <Coin isHovered={isHovered} opacity={opacity} />

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
