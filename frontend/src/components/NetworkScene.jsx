import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, Environment, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Parallax Camera Controller (Mouse + Scroll)
function CameraRig() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    // Mouse parallax
    const targetX = state.pointer.x * 2;
    // Scroll parallax (moves camera up and tilts slightly down as you scroll)
    const scrollOffset = scrollY * 0.005;
    const targetY = (state.pointer.y * 1) + 5 + scrollOffset;
    const targetZ = 10 - scrollOffset * 0.5;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    
    // Look at center
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// Animated geometric "Car"
function Car({ startPosition, baseSpeed, color, axis = 'z', bound = 25 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  // Create a sleek glowing material
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 3,
    transparent: true,
    opacity: 1,
    toneMapped: false
  }), [color]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const pos = meshRef.current.position[axis];
    
    // Calculate speed based on position (fast in middle, slow at edges)
    // Distance from center (0 to bound)
    const distFromCenter = Math.abs(pos);
    const normalizedDist = distFromCenter / bound; // 0 (mid) to 1 (edge)
    
    // Speed multiplier: 1 in middle, drops to 0.1 at edges
    const speedMult = Math.max(0.1, 1 - Math.pow(normalizedDist, 2));
    const currentSpeed = baseSpeed * speedMult;
    
    meshRef.current.position[axis] += currentSpeed * delta;
    
    // Pulsating height (sin wave based on time and position)
    const pulse = Math.sin(state.clock.elapsedTime * 3 + pos) * 0.5 + 1; // 0.5 to 1.5
    meshRef.current.scale.y = pulse;

    // Fading into oblivion at the edges
    // Fade out starts when normalizedDist > 0.8
    let opacity = 1;
    if (normalizedDist > 0.8) {
      opacity = (1 - normalizedDist) / 0.2; // 1 down to 0
    }
    material.opacity = opacity;
    material.emissiveIntensity = opacity * 3;
    
    // Reset position if it goes out of bounds
    if (baseSpeed > 0 && pos > bound) {
      meshRef.current.position[axis] = -bound + 0.1;
    } else if (baseSpeed < 0 && pos < -bound) {
      meshRef.current.position[axis] = bound - 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={startPosition}>
      <boxGeometry args={axis === 'z' ? [0.3, 0.4, 1.2] : [1.2, 0.4, 0.3]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}

// Generate multiple cars
function Traffic() {
  const cars = useMemo(() => {
    const arr = [];
    const colors = ['#00f0ff', '#00ffaa', '#6b21a8'];
    
    // Z-axis traffic
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.random() * 24) - 12;
      const y = 0.2;
      const z = (Math.random() - 0.5) * 50;
      const speed = (Math.random() * 15 + 10) * (Math.random() > 0.5 ? 1 : -1);
      const color = colors[Math.floor(Math.random() * colors.length)];
      arr.push(<Car key={`z-${i}`} startPosition={[x, y, z]} baseSpeed={speed} color={color} axis="z" />);
    }
    
    // X-axis traffic
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = 0.2;
      const z = Math.floor(Math.random() * 24) - 12;
      const speed = (Math.random() * 15 + 10) * (Math.random() > 0.5 ? 1 : -1);
      const color = colors[Math.floor(Math.random() * colors.length)];
      arr.push(<Car key={`x-${i}`} startPosition={[x, y, z]} baseSpeed={speed} color={color} axis="x" />);
    }
    return arr;
  }, []);

  return <>{cars}</>;
}

export default function NetworkScene() {
  return (
    <Canvas 
      camera={{ position: [0, 5, 10], fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#020205']} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#3b82f6" />
      
      <CameraRig />

      <Grid 
        infiniteGrid 
        fadeDistance={40}
        sectionColor="#1e3a8a" 
        cellColor="#0f172a" 
        sectionSize={1.5}
        cellSize={0.5}
        position={[0, 0, 0]}
      />

      <Sparkles count={300} scale={40} size={2} speed={0.4} opacity={0.4} color="#00f0ff" position={[0, 2, 0]} />

      <Traffic />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 2, -5]}>
          <octahedronGeometry args={[2, 0]} />
          <meshStandardMaterial 
            color="#000000" 
            metalness={0.9} 
            roughness={0.1}
            emissive="#1e3a8a"
            emissiveIntensity={0.5}
            wireframe
          />
        </mesh>
      </Float>
    </Canvas>
  );
}
