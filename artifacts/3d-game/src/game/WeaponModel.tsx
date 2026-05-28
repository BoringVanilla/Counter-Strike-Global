import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface WeaponModelProps {
  isReloading: boolean;
  isShooting: boolean;
}

export default function WeaponModel({ isReloading, isShooting }: WeaponModelProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const kickRef = useRef(0);
  const reloadAngleRef = useRef(0);
  const bobRef = useRef(0);
  const prevCamPosRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Camera movement for weapon bob
    const speed = camera.position.distanceTo(prevCamPosRef.current) / dt;
    prevCamPosRef.current.copy(camera.position);
    const isMoving = speed > 0.5;

    bobRef.current = isMoving
      ? Math.sin(t * 10) * 0.012
      : THREE.MathUtils.lerp(bobRef.current, 0, 5 * dt);

    // Recoil kick
    if (isShooting) {
      kickRef.current = 0.08;
    }
    kickRef.current = THREE.MathUtils.lerp(kickRef.current, 0, 12 * dt);

    // Reload animation
    if (isReloading) {
      reloadAngleRef.current = THREE.MathUtils.lerp(reloadAngleRef.current, -0.5, 6 * dt);
    } else {
      reloadAngleRef.current = THREE.MathUtils.lerp(reloadAngleRef.current, 0, 8 * dt);
    }

    // Position weapon relative to camera
    const weaponPos = new THREE.Vector3(0.22, -0.24 + bobRef.current, -0.45 - kickRef.current);
    weaponPos.applyQuaternion(camera.quaternion);
    weaponPos.add(camera.position);

    groupRef.current.position.copy(weaponPos);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.rotateX(-0.08 + kickRef.current * 0.5 + reloadAngleRef.current);
    groupRef.current.rotateZ(bobRef.current * 0.5);
  });

  return (
    <group ref={groupRef}>
      {/* AK-47 body */}
      <mesh>
        <boxGeometry args={[0.04, 0.075, 0.38]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Stock */}
      <mesh position={[0, -0.01, 0.22]}>
        <boxGeometry args={[0.038, 0.05, 0.14]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.7} />
      </mesh>
      {/* Handguard */}
      <mesh position={[0, -0.005, -0.1]}>
        <boxGeometry args={[0.04, 0.05, 0.14]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.7} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.01, -0.24]}>
        <boxGeometry args={[0.022, 0.022, 0.12]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Magazine */}
      <mesh position={[0, -0.05, -0.02]}>
        <boxGeometry args={[0.032, 0.07, 0.06]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Trigger guard */}
      <mesh position={[0, -0.028, 0.04]}>
        <boxGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Muzzle flash (shown briefly when shooting) */}
      {isShooting && (
        <mesh position={[0, 0.012, -0.32]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color="#ffcc44" />
        </mesh>
      )}
    </group>
  );
}
