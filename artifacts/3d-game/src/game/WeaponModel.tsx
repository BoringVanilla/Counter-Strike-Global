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
  const muzzleRef = useRef<THREE.Mesh>(null);
  const muzzleRingRef = useRef<THREE.Mesh>(null);

  const kickRef = useRef(0);
  const kickXRef = useRef(0);
  const reloadAngleRef = useRef(0);
  const bobYRef = useRef(0);
  const bobXRef = useRef(0);
  const swayXRef = useRef(0);
  const swayYRef = useRef(0);
  const prevCamPosRef = useRef(new THREE.Vector3());
  const prevYawRef = useRef(0);
  const prevPitchRef = useRef(0);
  const muzzleFlashTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Movement speed for bob
    const camDelta = camera.position.distanceTo(prevCamPosRef.current);
    const speed = camDelta / dt;
    prevCamPosRef.current.copy(camera.position);
    const isMoving = speed > 0.5;

    // Extract camera yaw/pitch for sway
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    const yawDelta = euler.y - prevYawRef.current;
    const pitchDelta = euler.x - prevPitchRef.current;
    prevYawRef.current = euler.y;
    prevPitchRef.current = euler.x;

    // Weapon sway based on mouse movement
    swayXRef.current = THREE.MathUtils.lerp(swayXRef.current, -yawDelta * 18, 1 - Math.pow(0.01, dt));
    swayYRef.current = THREE.MathUtils.lerp(swayYRef.current, -pitchDelta * 14, 1 - Math.pow(0.01, dt));
    swayXRef.current = THREE.MathUtils.clamp(swayXRef.current, -0.06, 0.06);
    swayYRef.current = THREE.MathUtils.clamp(swayYRef.current, -0.04, 0.04);

    // Head bob
    const targetBobY = isMoving ? Math.sin(t * 10) * 0.018 : 0;
    const targetBobX = isMoving ? Math.sin(t * 5) * 0.010 : 0;
    bobYRef.current = THREE.MathUtils.lerp(bobYRef.current, targetBobY, isMoving ? 1 - Math.pow(0.001, dt) : 1 - Math.pow(0.05, dt));
    bobXRef.current = THREE.MathUtils.lerp(bobXRef.current, targetBobX, 1 - Math.pow(0.01, dt));

    // Recoil kick
    if (isShooting) {
      kickRef.current = 0.1;
      kickXRef.current = (Math.random() - 0.5) * 0.04;
      muzzleFlashTimeRef.current = t;
    }
    kickRef.current = THREE.MathUtils.lerp(kickRef.current, 0, 1 - Math.pow(0.001, dt));
    kickXRef.current = THREE.MathUtils.lerp(kickXRef.current, 0, 1 - Math.pow(0.001, dt));

    // Reload animation
    if (isReloading) {
      reloadAngleRef.current = THREE.MathUtils.lerp(reloadAngleRef.current, -0.55, 1 - Math.pow(0.001, dt));
    } else {
      reloadAngleRef.current = THREE.MathUtils.lerp(reloadAngleRef.current, 0, 1 - Math.pow(0.0001, dt));
    }

    // Idle breathing
    const breathY = Math.sin(t * 1.2) * 0.003;
    const breathX = Math.sin(t * 0.8) * 0.002;

    // Position weapon relative to camera
    const offsetX = 0.22 + swayXRef.current + bobXRef.current + kickXRef.current;
    const offsetY = -0.24 + bobYRef.current + swayYRef.current + breathY;
    const offsetZ = -0.45 - kickRef.current;

    const weaponPos = new THREE.Vector3(offsetX, offsetY, offsetZ);
    weaponPos.applyQuaternion(camera.quaternion);
    weaponPos.add(camera.position);

    groupRef.current.position.copy(weaponPos);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.rotateX(-0.08 + kickRef.current * 0.6 + reloadAngleRef.current + breathX);
    groupRef.current.rotateZ(bobYRef.current * 0.6 + swayXRef.current * 0.3);
    groupRef.current.rotateY(kickXRef.current * 2);

    // Muzzle flash animation
    const flashAge = t - muzzleFlashTimeRef.current;
    if (muzzleRef.current && muzzleRingRef.current) {
      const flashVisible = flashAge < 0.06;
      muzzleRef.current.visible = flashVisible;
      muzzleRingRef.current.visible = flashVisible;
      if (flashVisible) {
        const fade = 1 - flashAge / 0.06;
        (muzzleRef.current.material as THREE.MeshBasicMaterial).opacity = fade;
        const s = 0.5 + fade * 1.5;
        muzzleRef.current.scale.setScalar(s);
        muzzleRingRef.current.scale.setScalar(s * 1.4);
        muzzleRingRef.current.rotation.z = t * 20;
        (muzzleRingRef.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.7;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* AK-47 receiver body */}
      <mesh>
        <boxGeometry args={[0.04, 0.075, 0.38]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Top rail */}
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[0.03, 0.01, 0.32]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Stock */}
      <mesh position={[0, -0.012, 0.23]}>
        <boxGeometry args={[0.038, 0.05, 0.13]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.8} />
      </mesh>
      {/* Stock cheek piece */}
      <mesh position={[0, 0.01, 0.27]}>
        <boxGeometry args={[0.035, 0.03, 0.06]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.85} />
      </mesh>
      {/* Handguard */}
      <mesh position={[0, -0.005, -0.1]}>
        <boxGeometry args={[0.04, 0.05, 0.14]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.8} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.012, -0.27]}>
        <boxGeometry args={[0.02, 0.02, 0.17]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Gas tube */}
      <mesh position={[0, 0.028, -0.16]}>
        <boxGeometry args={[0.01, 0.01, 0.14]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Magazine */}
      <mesh position={[0, -0.058, -0.02]}>
        <boxGeometry args={[0.032, 0.075, 0.055]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Pistol grip */}
      <mesh position={[0, -0.055, 0.07]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.03, 0.06, 0.035]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>
      {/* Charging handle */}
      <mesh position={[0.025, 0.02, 0.08]}>
        <boxGeometry args={[0.018, 0.012, 0.02]} />
        <meshStandardMaterial color="#333" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Muzzle flash */}
      <mesh ref={muzzleRef} position={[0, 0.012, -0.37]} visible={false}>
        <planeGeometry args={[0.12, 0.12]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Muzzle ring */}
      <mesh ref={muzzleRingRef} position={[0, 0.012, -0.37]} visible={false}>
        <ringGeometry args={[0.04, 0.09, 8]} />
        <meshBasicMaterial color="#ff9900" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
