import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface KnifeModelProps {
  isStabbing: boolean;
}

export default function KnifeModel({ isStabbing }: KnifeModelProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const stabRef = useRef(0);
  const bobRef = useRef(0);
  const prevCamPosRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    const speed = camera.position.distanceTo(prevCamPosRef.current) / dt;
    prevCamPosRef.current.copy(camera.position);
    const isMoving = speed > 0.5;

    bobRef.current = isMoving
      ? Math.sin(t * 10) * 0.01
      : THREE.MathUtils.lerp(bobRef.current, 0, 5 * dt);

    if (isStabbing) {
      stabRef.current = 1;
    }
    stabRef.current = THREE.MathUtils.lerp(stabRef.current, 0, 10 * dt);

    // Weapon position relative to camera
    const weaponPos = new THREE.Vector3(
      0.2,
      -0.22 + bobRef.current,
      -0.35 - stabRef.current * 0.25
    );
    weaponPos.applyQuaternion(camera.quaternion);
    weaponPos.add(camera.position);

    groupRef.current.position.copy(weaponPos);
    groupRef.current.quaternion.copy(camera.quaternion);
    // Knife tilted slightly
    groupRef.current.rotateX(-0.15 - stabRef.current * 0.4);
    groupRef.current.rotateZ(0.3);
    groupRef.current.rotateY(0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Handle */}
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[0.025, 0.07, 0.14]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[0.04, 0.015, 0.02]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Blade */}
      <mesh position={[0, 0.012, -0.11]}>
        <boxGeometry args={[0.008, 0.035, 0.19]} />
        <meshStandardMaterial color="#ccc" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Blade tip (tapered) */}
      <mesh position={[0, 0.008, -0.215]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.007, 0.018, 0.04]} />
        <meshStandardMaterial color="#ddd" roughness={0.1} metalness={0.95} />
      </mesh>
      {/* Shine line */}
      <mesh position={[0.003, 0.014, -0.11]}>
        <boxGeometry args={[0.002, 0.01, 0.18]} />
        <meshStandardMaterial color="#fff" roughness={0.05} metalness={1} />
      </mesh>
      {/* Stab flash */}
      {isStabbing && (
        <mesh position={[0, 0.012, -0.24]}>
          <sphereGeometry args={[0.015, 4, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}
