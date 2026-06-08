import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HitEffect } from "./types";

const DURATION = 0.55;
const PARTICLE_COUNT = 7;

interface SingleEffectProps {
  effect: HitEffect;
  onExpire: (id: number) => void;
}

function SingleHitEffect({ effect, onExpire }: SingleEffectProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const expired = useRef(false);

  const vels = useMemo(() => {
    const seed = effect.id;
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = ((seed * 37 + i * 73) % 360) * (Math.PI / 180);
      const upward = 0.5 + ((seed * 13 + i * 41) % 100) / 100;
      return {
        x: Math.cos(angle) * 2.5,
        y: upward * 4 + 1,
        z: Math.sin(angle) * 2.5,
      };
    });
  }, [effect.id]);

  useFrame(() => {
    if (expired.current) return;
    const elapsed = (Date.now() - effect.time) / 1000;
    if (elapsed > DURATION) {
      expired.current = true;
      onExpire(effect.id);
      return;
    }
    const t = elapsed / DURATION;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const vel = vels[i];
      mesh.position.set(
        effect.position[0] + vel.x * elapsed,
        effect.position[1] + vel.y * elapsed - 8 * elapsed * elapsed,
        effect.position[2] + vel.z * elapsed,
      );
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t * 1.4);
      const scale = (1 - t * 0.6) * 0.9;
      mesh.scale.setScalar(scale);
    });
  });

  const color = effect.isKill ? "#ffaa00" : "#dd2222";

  return (
    <>
      {vels.map((_, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el; }}
          position={effect.position}
        >
          <sphereGeometry args={[0.07, 4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} />
        </mesh>
      ))}
      {/* Central flash */}
      <mesh position={effect.position}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={effect.isKill ? "#ffffff" : "#ff4444"} transparent opacity={Math.max(0, 1 - (Date.now() - effect.time) / 150)} depthWrite={false} />
      </mesh>
    </>
  );
}

interface HitEffectsProps {
  effects: HitEffect[];
  onExpire: (id: number) => void;
}

export default function HitEffects({ effects, onExpire }: HitEffectsProps) {
  return (
    <>
      {effects.map(e => (
        <SingleHitEffect key={e.id} effect={e} onExpire={onExpire} />
      ))}
    </>
  );
}
