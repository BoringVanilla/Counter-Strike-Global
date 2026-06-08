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
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const deathAngleRef = useRef(0);
  const deathYRef = useRef(enemy.position[1]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Hit flash on body material
    if (bodyMatRef.current) {
      const msSinceHit = Date.now() - enemy.lastHitTime;
      if (msSinceHit < 200 && !enemy.isDead) {
        const flash = 1 - msSinceHit / 200;
        bodyMatRef.current.color.setRGB(0.55 + 0.45 * flash, 0.1 + 0.26 * (1 - flash), 0.1);
        bodyMatRef.current.emissiveIntensity = flash * 0.6;
        bodyMatRef.current.emissive.setRGB(1, 0, 0);
      } else if (!enemy.isDead) {
        const baseColor = enemy.state === "attack" ? "#cc3333" : "#2a5c3a";
        bodyMatRef.current.color.set(baseColor);
        bodyMatRef.current.emissiveIntensity = 0;
        bodyMatRef.current.emissive.setRGB(0, 0, 0);
      }
    }

    if (enemy.isDead) {
      // Animated ragdoll death — tilt forward/side and sink
      deathAngleRef.current = THREE.MathUtils.lerp(deathAngleRef.current, Math.PI / 2, 0.07);
      deathYRef.current = THREE.MathUtils.lerp(deathYRef.current, -0.2, 0.06);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, Math.PI / 2, 0.07);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.3 * (enemy.id % 2 === 0 ? 1 : -1), 0.05);
      groupRef.current.position.y = deathYRef.current;

      // Fling arms out on death
      if (leftArmRef.current) leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -1.5, 0.08);
      if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 1.5, 0.08);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0.8, 0.07);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.5, 0.07);
      return;
    }

    // --- Alive animations ---
    groupRef.current.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
    groupRef.current.rotation.x = 0;
    groupRef.current.rotation.z = 0;
    deathAngleRef.current = 0;
    deathYRef.current = enemy.position[1];

    const isMoving = enemy.state === "patrol" || enemy.state === "chase";

    // Footstep bob
    if (isMoving) {
      const bob = Math.sin(t * 8) * 0.06;
      groupRef.current.position.y = enemy.position[1] + Math.abs(bob) * 0.5;

      // Leg swing
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 8) * 0.4;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * 8) * 0.4;

      // Arm counter-swing
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(t * 8) * 0.3;
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t * 8) * 0.3;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1);
      }
    } else {
      // Idle: gentle sway
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (leftArmRef.current) {
        const attackSway = enemy.state === "attack" ? Math.sin(t * 6) * 0.15 : 0;
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, attackSway, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1);
      }
      if (rightArmRef.current) {
        const attackSway = enemy.state === "attack" ? -Math.sin(t * 6 + 0.5) * 0.2 : 0;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, attackSway, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1);
      }
    }

    // Head look-around / aim
    if (headRef.current) {
      if (enemy.state === "attack") {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.sin(t * 3) * 0.1, 0.05);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.1, 0.05);
      } else {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.35;
        headRef.current.rotation.x = 0;
      }
    }
  });

  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
  const bodyColor = enemy.isDead ? "#553333" : enemy.state === "attack" ? "#cc3333" : "#2a5c3a";

  return (
    <group ref={groupRef} position={enemy.position}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.6, 1.0, 0.35]} />
        <meshStandardMaterial ref={bodyMatRef} color={bodyColor} roughness={0.7} emissive="#000" emissiveIntensity={0} />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.15, -0.75, 0]}>
        <boxGeometry args={[0.22, 0.55, 0.28]} />
        <meshStandardMaterial color="#1a3a28" roughness={0.8} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, -0.75, 0]}>
        <boxGeometry args={[0.22, 0.55, 0.28]} />
        <meshStandardMaterial color="#1a3a28" roughness={0.8} />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.42, 0.05, 0]}>
        <boxGeometry args={[0.18, 0.55, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.42, 0.05, 0]}>
        <boxGeometry args={[0.18, 0.55, 0.22]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.72, 0]}>
        <boxGeometry args={[0.4, 0.38, 0.38]} />
        <meshStandardMaterial color="#c8a080" roughness={0.6} />
      </mesh>

      {/* Helmet */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.44, 0.18, 0.42]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.5} />
      </mesh>

      {/* Gun in hand */}
      {!enemy.isDead && (
        <group ref={rightArmRef as React.RefObject<THREE.Group>}>
          <mesh position={[0.55, 0, 0.22]}>
            <boxGeometry args={[0.07, 0.1, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* Health bar */}
      {!enemy.isDead && (
        <group position={[0, 1.35, 0]}>
          <mesh>
            <planeGeometry args={[0.7, 0.08]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          <mesh position={[-(0.7 - 0.7 * healthPercent) / 2, 0, 0.001]}>
            <planeGeometry args={[0.7 * healthPercent, 0.065]} />
            <meshBasicMaterial color={healthPercent > 0.5 ? "#00cc44" : healthPercent > 0.25 ? "#ffaa00" : "#ff3344"} />
          </mesh>
        </group>
      )}
    </group>
  );
}
