"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

function AnimatedPoints() {
  const ref = useRef<THREE.Points>(null!)

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(3000 * 3)

    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25
    }

    return positions
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.03
      ref.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <Points ref={ref} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff4757"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

function JetBrainsObjects() {
  const groupRef = useRef<THREE.Group>(null!)
  const cubesRef = useRef<THREE.Group>(null!)
  const spheresRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.02
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
    if (cubesRef.current) {
      cubesRef.current.rotation.z = state.clock.elapsedTime * 0.05
    }
    if (spheresRef.current) {
      spheresRef.current.rotation.x = -state.clock.elapsedTime * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {/* Floating wireframe cubes */}
      <group ref={cubesRef}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 0.6) * 10, Math.cos(i * 0.8) * 8, Math.sin(i * 0.4) * 6]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#ff4757" : i % 3 === 1 ? "#c44569" : "#8b2635"}
              transparent
              opacity={0.2}
              wireframe
            />
          </mesh>
        ))}
      </group>

      {/* Floating gradient spheres */}
      <group ref={spheresRef}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.9) * 12, Math.sin(i * 0.7) * 10, Math.cos(i * 0.5) * 8]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#ff6b6b" : "#ff3838"} transparent opacity={0.15} />
          </mesh>
        ))}
      </group>

      {/* Rotating torus rings */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, 0, 0]} rotation={[(i * Math.PI) / 4, (i * Math.PI) / 3, 0]}>
          <torusGeometry args={[6 + i * 2, 0.1, 8, 32]} />
          <meshBasicMaterial color="#ff4757" transparent opacity={0.1} />
        </mesh>
      ))}
    </group>
  )
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff4757" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#c44569" />
        <AnimatedPoints />
        <JetBrainsObjects />
      </Canvas>
    </div>
  )
}
