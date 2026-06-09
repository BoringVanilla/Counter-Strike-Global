import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GameStats } from "./Game";
import { Enemy as EnemyType, Bullet as BulletType, HitEffect } from "./types";
import { resolveCollisions } from "./mapColliders";
import Map from "./Map";
import EnemyMesh from "./EnemyMesh";
import BulletMesh from "./BulletMesh";
import PlayerController from "./PlayerController";
import HitEffects from "./HitEffects";

interface GameSceneProps {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onDied: () => void;
  isPaused: boolean;
}

const KNIFE_RANGE = 2.2;
const KNIFE_DAMAGE = 55;
const WAVE_INTERVAL = 25;  // seconds between waves
const WAVE_SIZE = 5;        // enemies per wave
const DEAD_CLEANUP_MS = 3000; // remove corpses after 3s

// Start from random offsets so HMR reloads don't cause key collisions with
// enemies/bullets still alive in React state from the previous module instance.
let enemyIdCounter = Math.round(Math.random() * 1e9);
let bulletIdCounter = Math.round(Math.random() * 1e9);
let hitEffectIdCounter = Math.round(Math.random() * 1e9);

// Player starts at (4, 1.7, 0) facing +Z (Math.PI yaw).
// FRONT = positive Z half, BACK = negative Z half.
const FRONT_SPAWNS: [number, number, number][] = [
  [0, 1, 18], [14, 1, 14], [-14, 1, 14],
  [18, 1, 5], [-18, 1, 5], [8, 1, 12], [-8, 1, 12],
];
const ALL_SPAWNS: [number, number, number][] = [
  ...FRONT_SPAWNS,
  [18, 1, -5], [-18, 1, -5],
  [14, 1, -14], [-14, 1, -14],
  [0, 1, -18], [8, 1, -12], [-8, 1, -12],
];

function spawnEnemies(count: number, frontOnly: boolean): EnemyType[] {
  const pool = frontOnly ? FRONT_SPAWNS : ALL_SPAWNS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => {
    const sp = shuffled[i % shuffled.length];
    return {
      id: ++enemyIdCounter,
      position: [sp[0] + (Math.random() - 0.5) * 2, 1, sp[2] + (Math.random() - 0.5) * 2] as [number, number, number],
      health: 100,
      maxHealth: 100,
      isDead: false,
      state: "patrol" as const,
      patrolTarget: [sp[0], sp[2]] as [number, number],
      lastShotTime: 0,
      lastHitTime: 0,
    };
  });
}

export default function GameScene({ stats, setStats, onDied, isPaused }: GameSceneProps) {
  const { camera } = useThree();
  // Wave 1: front-only so player isn't ambushed immediately
  const [enemies, setEnemies] = useState<EnemyType[]>(() => spawnEnemies(WAVE_SIZE, true));
  const [bullets, setBullets] = useState<BulletType[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);

  const playerPosRef = useRef(new THREE.Vector3(0, 1.7, 0));
  const statsRef = useRef(stats);
  const isDiedRef = useRef(false);
  const waveTimerRef = useRef(0);   // counts up to WAVE_INTERVAL
  const waveCountRef = useRef(1);   // current wave number

  statsRef.current = stats;

  useEffect(() => {
    // Clear of the center corridor wall (x: -0.3–0.3, z: -6–6).
    camera.position.set(4, 1.7, 0);
    playerPosRef.current.set(4, 1.7, 0);
  }, [camera]);

  const spawnBullet = useCallback((pos: THREE.Vector3, dir: THREE.Vector3, fromEnemy: boolean) => {
    const b: BulletType = {
      id: ++bulletIdCounter,
      position: [pos.x, pos.y, pos.z],
      direction: [dir.x, dir.y, dir.z],
      speed: fromEnemy ? 22 : 60,
      fromEnemy,
      distanceTraveled: 0,
      maxDistance: fromEnemy ? 40 : 120,
    };
    setBullets(prev => [...prev, b]);
  }, []);

  const addHitEffect = useCallback((pos: [number, number, number], isKill: boolean) => {
    const effect: HitEffect = {
      id: ++hitEffectIdCounter,
      position: pos,
      time: Date.now(),
      isKill,
    };
    setHitEffects(prev => [...prev, effect]);
  }, []);

  const removeHitEffect = useCallback((id: number) => {
    setHitEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const handlePlayerShoot = useCallback((pos: THREE.Vector3, dir: THREE.Vector3) => {
    spawnBullet(pos, dir, false);
  }, [spawnBullet]);

  const handleKnifeStab = useCallback((pos: THREE.Vector3, _dir: THREE.Vector3) => {
    setEnemies(prev => prev.map(e => {
      if (e.isDead) return e;
      const dx = e.position[0] - pos.x;
      const dz = e.position[2] - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < KNIFE_RANGE) {
        const newHealth = e.health - KNIFE_DAMAGE;
        const isDead = newHealth <= 0;
        if (isDead) {
          setStats(s => ({ ...s, kills: s.kills + 1, score: s.score + 500 }));
          addHitEffect([e.position[0], e.position[1] + 0.5, e.position[2]], true);
        } else {
          addHitEffect([e.position[0], e.position[1] + 0.5, e.position[2]], false);
        }
        return {
          ...e,
          health: newHealth,
          isDead,
          lastHitTime: Date.now(),
          state: isDead ? "dying" as const : "chase" as const,
        };
      }
      return e;
    }));
  }, [setStats, addHitEffect]);

  useFrame((_, delta) => {
    if (isDiedRef.current || isPaused) return;

    const dt = Math.min(delta, 0.05);
    const playerPos = playerPosRef.current;
    const now = Date.now() / 1000;

    // Wave timer — every WAVE_INTERVAL seconds spawn WAVE_SIZE new enemies
    waveTimerRef.current += dt;
    let spawnWave: EnemyType[] | null = null;
    if (waveTimerRef.current >= WAVE_INTERVAL) {
      waveTimerRef.current -= WAVE_INTERVAL;
      waveCountRef.current += 1;
      const newWave = waveCountRef.current;
      // Wave 1-2 are front-only; after that all directions
      spawnWave = spawnEnemies(WAVE_SIZE, newWave <= 2);
      setStats(s => ({ ...s, round: newWave }));
    }

    // Update bullets
    setBullets(prev => {
      const next: BulletType[] = [];
      for (const b of prev) {
        const dist = b.speed * dt;
        const nx = b.position[0] + b.direction[0] * dist;
        const ny = b.position[1] + b.direction[1] * dist;
        const nz = b.position[2] + b.direction[2] * dist;
        const traveled = b.distanceTraveled + dist;

        if (traveled > b.maxDistance) continue;
        if (Math.abs(nx) > 22 || Math.abs(nz) > 22) continue;

        // Enemy bullet hits player
        if (b.fromEnemy) {
          const dx = nx - playerPos.x;
          const dy = ny - playerPos.y;
          const dz = nz - playerPos.z;
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.8) {
            setStats(s => {
              const newArmor = Math.max(0, s.armor - 20);
              const armorAbsorb = s.armor > 0 ? 10 : 0;
              const newHealth = s.health - (20 - armorAbsorb);
              if (newHealth <= 0 && !isDiedRef.current) {
                isDiedRef.current = true;
                setTimeout(onDied, 500);
              }
              return {
                ...s,
                health: Math.max(0, newHealth),
                armor: newArmor,
                damageFlash: Date.now(),
              };
            });
            continue;
          }
        }

        // Player bullet hits enemy
        if (!b.fromEnemy) {
          let hit = false;
          setEnemies(prevEnemies => prevEnemies.map(e => {
            if (e.isDead) return e;
            const dx = nx - e.position[0];
            const dy = ny - e.position[1];
            const dz = nz - e.position[2];
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.8) {
              hit = true;
              const newHealth = e.health - 34;
              const isDead = newHealth <= 0;
              if (isDead) {
                setStats(s => ({ ...s, kills: s.kills + 1, score: s.score + 300 }));
                addHitEffect([nx, ny, nz], true);
              } else {
                addHitEffect([nx, ny, nz], false);
              }
              return {
                ...e,
                health: newHealth,
                isDead,
                lastHitTime: Date.now(),
                state: isDead ? "dying" as const : e.state,
              };
            }
            return e;
          }));
          if (hit) continue;
        }

        next.push({ ...b, position: [nx, ny, nz], distanceTraveled: traveled });
      }
      return next;
    });

    // Update enemies: AI + dead cleanup + wave spawn (single setState to avoid conflicts)
    setEnemies(prev => {
      const nowMs = Date.now();
      // Remove corpses that have been dead long enough
      const filtered = prev.filter(e => !(e.isDead && nowMs - e.lastHitTime > DEAD_CLEANUP_MS));

      const updated = filtered.map(e => {
        if (e.isDead) return e;

        const ex = e.position[0];
        const ez = e.position[2];
        const dx = playerPos.x - ex;
        const dz = playerPos.z - ez;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);

        let newState = e.state;
        let newPos: [number, number, number] = [...e.position];
        let newPatrol = e.patrolTarget;
        let lastShotTime = e.lastShotTime;

        newState = distToPlayer < 18 ? "chase" : "patrol";

        if (newState === "chase") {
          if (distToPlayer < 12) {
            newState = "attack";
            if (now - lastShotTime > 1.4) {
              lastShotTime = now;
              const dir = new THREE.Vector3(dx, 0.1, dz).normalize();
              const jitter = 0.08;
              dir.x += (Math.random() - 0.5) * jitter;
              dir.z += (Math.random() - 0.5) * jitter;
              dir.normalize();
              spawnBullet(new THREE.Vector3(ex, e.position[1], ez), dir, true);
            }
          }
          if (distToPlayer > 3) {
            const speed = 2.5 * dt;
            let nx = ex + (dx / distToPlayer) * speed;
            let nz = ez + (dz / distToPlayer) * speed;
            [nx, nz] = resolveCollisions(nx, nz, 0.35);
            newPos = [nx, e.position[1], nz];
          }
        } else {
          const ptx = newPatrol[0] - ex;
          const ptz = newPatrol[1] - ez;
          const ptDist = Math.sqrt(ptx * ptx + ptz * ptz);
          if (ptDist < 1) {
            let px = (Math.random() - 0.5) * 36;
            let pz = (Math.random() - 0.5) * 36;
            [px, pz] = resolveCollisions(px, pz, 0.5);
            newPatrol = [px, pz];
          } else {
            const speed = 1.5 * dt;
            let nx = ex + (ptx / ptDist) * speed;
            let nz = ez + (ptz / ptDist) * speed;
            [nx, nz] = resolveCollisions(nx, nz, 0.35);
            newPos = [nx, e.position[1], nz];
          }
        }

        return { ...e, position: newPos, state: newState, patrolTarget: newPatrol, lastShotTime };
      });

      // Append new wave if one spawned this frame
      return spawnWave ? [...updated, ...spawnWave] : updated;
    });
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} color="#c8d8ff" />
      <directionalLight position={[10, 20, 10]} intensity={0.9} color="#ffe0b0" />
      <directionalLight position={[-10, 10, -10]} intensity={0.25} color="#8099ff" />
      <hemisphereLight args={["#87ceeb", "#404040", 0.3]} />
      <fog args={["#0a1020", 30, 150]} />

      <Map />

      <PlayerController
        playerPosRef={playerPosRef}
        onShoot={handlePlayerShoot}
        onKnifeStab={handleKnifeStab}
        stats={stats}
        setStats={setStats}
      />

      {enemies.map(e => <EnemyMesh key={e.id} enemy={e} />)}
      {bullets.map(b => <BulletMesh key={b.id} bullet={b} />)}
      <HitEffects effects={hitEffects} onExpire={removeHitEffect} />
    </>
  );
}
