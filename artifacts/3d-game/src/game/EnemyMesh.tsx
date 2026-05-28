import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Enemy } from "./types";

interface EnemyMeshProps {
  enemy: Enemy;
}

export default function EnemyMesh({ enemy }: EnemyMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (enemy.isDead) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.08);
    } else {
      groupRef.current.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
      groupRef.current.rotation.z = 0;

      // Bob when moving
      if (enemy.state === "patrol" || enemy.state === "chase") {
        groupRef.current.position.y = enemy.position[1] + Math.sin(t * 8) * 0.05;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 2) * 0.3;
    }
  });

  const healthPercent = enemy.health / enemy.maxHealth;
  const bodyColor = enemy.isDead ? "#553333" : enemy.state === "attack" ? "#cc3333" : "#2a5c3a";

  return (
    <group ref={groupRef} position={enemy.position}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 1.0, 0.35]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, -0.75, 0]} castShadow>
        <boxGeometry args={[0.22, 0.55, 0.28]} />
        <meshStandardMaterial color="#1a3a28" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, -0.75, 0]} castShadow>
        <boxGeometry args={[0.22, 0.55, 0.28]} />
        <meshStandardMaterial color="#1a3a28" roughness={0.8} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.42, 0.05, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.42, 0.05, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.4, 0.38, 0.38]} />
        <meshStandardMaterial color="#c8a080" roughness={0.6} />
      </mesh>

      {/* Helmet */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.44, 0.18, 0.42]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.5} />
      </mesh>

      {/* Gun in hand */}
      {!enemy.isDead && (
        <mesh position={[0.5, 0, 0.2]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.45]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
      )}

      {/* Health bar */}
      {!enemy.isDead && (
        <group position={[0, 1.3, 0]}>
          <mesh>
            <planeGeometry args={[0.7, 0.08]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          <mesh position={[-(0.7 - 0.7 * healthPercent) / 2, 0, 0.001]}>
            <planeGeometry args={[0.7 * healthPercent, 0.07]} />
            <meshBasicMaterial color={healthPercent > 0.5 ? "#00cc44" : healthPercent > 0.25 ? "#ffaa00" : "#ff3344"} />
          </mesh>
        </group>
      )}
    </group>
  );
}
