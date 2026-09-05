import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { Attribution } from '@/lib/types';
import { featureMeta } from '@/lib/ui';

function Bar({ attr, index, total }: { attr: Attribution; index: number; total: number }) {
  const meta = featureMeta(attr.feature);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Base values
  const height = Math.max(0.1, Math.abs(attr.value) * 6); // scale height for visibility
  const isPositive = attr.value >= 0;
  
  // We position bars along the X axis
  const spacing = 1.2;
  const startX = -((total - 1) * spacing) / 2;
  const x = startX + index * spacing;
  
  // Animation state
  const [targetScale] = useState(1);
  const [currentScale, setCurrentScale] = useState(0);

  useFrame((state, delta) => {
    // Delay animation based on index
    if (state.clock.elapsedTime > index * 0.1) {
      setCurrentScale((prev) => THREE.MathUtils.damp(prev, targetScale, 4, delta));
    }
    if (meshRef.current) {
      meshRef.current.scale.y = currentScale;
      // Position so it grows upward from 0
      meshRef.current.position.y = (height * currentScale) / 2;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial 
          color={meta.hex} 
          emissive={meta.hex}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Label under the bar */}
      <Text
        position={[0, -0.4, 0.5]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.2}
        color={isPositive ? '#fda4af' : '#6ee7b7'} // rose-300 : emerald-300
        anchorX="center"
        anchorY="middle"
      >
        {isPositive ? '+' : ''}{attr.value.toFixed(3)}
      </Text>
      <Text
        position={[0, -0.8, 0.6]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.15}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
        textAlign="center"
      >
        {meta.label}
      </Text>
    </group>
  );
}

export function ShapScene3D({ attributions }: { attributions: Attribution[] }) {
  // Sort attributions by absolute impact if not already
  const sorted = useMemo(() => {
    return [...attributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [attributions]);

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl bg-black">
      <Canvas shadows camera={{ position: [4, 4, 6], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[5, 8, 5]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4f46e5" />
        <pointLight position={[5, 5, -5]} intensity={0.5} color="#ec4899" />

        <Grid 
          infiniteGrid 
          fadeDistance={20} 
          sectionColor="#334155" 
          cellColor="#1e293b"
          sectionSize={1}
          cellSize={0.5}
        />

        <group position={[0, 0, -1]}>
          {sorted.map((attr, i) => (
            <Bar key={attr.feature} attr={attr} index={i} total={sorted.length} />
          ))}
        </group>

        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={3}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
