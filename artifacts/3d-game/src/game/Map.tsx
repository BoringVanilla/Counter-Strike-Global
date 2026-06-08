import { useMemo } from "react";
import * as THREE from "three";

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roughness?: number;
}

function Wall({ position, size, color = "#8a7a6a", roughness = 0.85 }: WallProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />
    </mesh>
  );
}

interface BoxProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function Box({ position, size, color = "#7a6a5a" }: BoxProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

export default function Map() {
  // Pre-compute random decoration positions
  const decorations = useMemo(() => {
    const boxes: Array<{ pos: [number, number, number]; size: [number, number, number]; color: string }> = [];
    const positions: Array<[number, number]> = [
      [6, 6], [-6, 6], [6, -6], [-6, -6],
      [10, 0], [-10, 0], [0, 10], [0, -10],
      [4, 12], [-4, -12], [12, 4], [-12, -4],
    ];
    positions.forEach(([x, z]) => {
      const h = 1 + Math.abs(x * z * 0.01) % 1.5;
      boxes.push({
        pos: [x, h / 2, z],
        size: [1.2, h, 1.2],
        color: x > 0 ? "#6a7a5a" : "#5a6a7a",
      });
    });
    return boxes;
  }, []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4a5244" roughness={0.95} metalness={0} />
      </mesh>

      {/* Floor grid lines (painted on) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3a4234" roughness={1} transparent opacity={0.3} />
      </mesh>

      {/* Outer walls */}
      <Wall position={[0, 3, -22.5]} size={[45, 6, 1]} color="#6a5a4a" />
      <Wall position={[0, 3, 22.5]} size={[45, 6, 1]} color="#6a5a4a" />
      <Wall position={[-22.5, 3, 0]} size={[1, 6, 45]} color="#5a6a4a" />
      <Wall position={[22.5, 3, 0]} size={[1, 6, 45]} color="#5a6a4a" />

      {/* Ceiling */}
      <mesh position={[0, 6, 0]}>
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial color="#2a2a2a" roughness={1} side={THREE.BackSide} />
      </mesh>

      {/* Dust2-inspired interior walls */}
      {/* Mid boxes (bombsite A style) */}
      <Wall position={[8, 1.5, -5]} size={[5, 3, 0.6]} color="#7a6a54" />
      <Wall position={[-8, 1.5, 5]} size={[5, 3, 0.6]} color="#7a6a54" />
      <Wall position={[5, 1.5, 8]} size={[0.6, 3, 5]} color="#7a6a54" />
      <Wall position={[-5, 1.5, -8]} size={[0.6, 3, 5]} color="#7a6a54" />

      {/* Long corridor walls */}
      <Wall position={[0, 1.5, 0]} size={[0.6, 3, 12]} color="#8a7a64" />
      <Wall position={[15, 1.5, 0]} size={[0.6, 3, 8]} color="#6a7a54" />
      <Wall position={[-15, 1.5, 0]} size={[0.6, 3, 8]} color="#6a7a54" />

      {/* Cover boxes */}
      {decorations.map((d, i) => (
        <Box key={i} position={d.pos} size={d.size} color={d.color} />
      ))}

      {/* Sandbag-style cover */}
      <Box position={[3, 0.6, 3]} size={[2.5, 1.2, 1]} color="#8a7a5a" />
      <Box position={[-3, 0.6, -3]} size={[2.5, 1.2, 1]} color="#8a7a5a" />
      <Box position={[3, 0.6, -3]} size={[1, 1.2, 2.5]} color="#7a8a5a" />
      <Box position={[-3, 0.6, 3]} size={[1, 1.2, 2.5]} color="#7a8a5a" />

      {/* Additional cover near center */}
      <Box position={[0, 0.75, 0]} size={[1.5, 1.5, 1.5]} color="#6a6a5a" />

      {/* Bombsite A platform area */}
      <mesh position={[18, 0.25, -18]} receiveShadow>
        <boxGeometry args={[6, 0.5, 6]} />
        <meshStandardMaterial color="#5a5a4a" roughness={0.9} />
      </mesh>
      <Box position={[18, 0.9, -18]} size={[1, 0.8, 1]} color="#7a7a6a" />
      <Box position={[16, 0.65, -16]} size={[1.5, 0.5, 1.5]} color="#6a6a5a" />

      {/* Bombsite B platform area */}
      <mesh position={[-18, 0.25, 18]} receiveShadow>
        <boxGeometry args={[6, 0.5, 6]} />
        <meshStandardMaterial color="#5a5a4a" roughness={0.9} />
      </mesh>
      <Box position={[-18, 0.9, 18]} size={[1, 0.8, 1]} color="#7a7a6a" />
      <Box position={[-16, 0.65, 16]} size={[1.5, 0.5, 1.5]} color="#6a6a5a" />

      {/* Pillars */}
      <Wall position={[10, 2, -10]} size={[0.8, 4, 0.8]} color="#8a7a6a" />
      <Wall position={[-10, 2, 10]} size={[0.8, 4, 0.8]} color="#8a7a6a" />
      <Wall position={[10, 2, 10]} size={[0.8, 4, 0.8]} color="#8a7a6a" />
      <Wall position={[-10, 2, -10]} size={[0.8, 4, 0.8]} color="#8a7a6a" />
    </group>
  );
}
