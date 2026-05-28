import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GameStats } from "./Game";
import { Enemy as EnemyType, Bullet as BulletType } from "./types";
import Map from "./Map";
import EnemyMesh from "./EnemyMesh";
import BulletMesh from "./BulletMesh";
import PlayerController from "./PlayerController";

interface GameSceneProps {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onDied: () => void;
  onWon: () => void;
}

const KNIFE_RANGE = 2.2;
const KNIFE_DAMAGE = 55;

const ROUNDS_CONFIG = [
  { enemies: 3 },
  { enemies: 4 },
  { enemies: 5 },
  { enemies: 6 },
  { enemies: 8 },
];

let enemyIdCounter = 0;
let bulletIdCounter = 0;

const SPAWN_POINTS: [number, number, number][] = [
  [18, 1, 0],
  [-18, 1, 0],
  [0, 1, 18],
  [0, 1, -18],
  [15, 1, 15],
  [-15, 1, 15],
  [15, 1, -15],
  [-15, 1, -15],
  [10, 1, 10],
  [-10, 1, -10],
];

function spawnEnemies(count: number): EnemyType[] {
  const enemies: EnemyType[] = [];
  const shuffled = [...SPAWN_POINTS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    const sp = shuffled[i % shuffled.length];
    enemies.push({
      id: ++enemyIdCounter,
      position: [sp[0] + (Math.random() - 0.5) * 2, 1, sp[2] + (Math.random() - 0.5) * 2],
      health: 100,
      maxHealth: 100,
      isDead: false,
      state: "patrol",
      patrolTarget: [sp[0], sp[2]],
      lastShotTime: 0,
    });
  }
  return enemies;
}

export default function GameScene({ stats, setStats, onDied, onWon }: GameSceneProps) {
  const { camera } = useThree();
  const [enemies, setEnemies] = useState<EnemyType[]>(() => spawnEnemies(ROUNDS_CONFIG[0].enemies));
  const [bullets, setBullets] = useState<BulletType[]>([]);
  const [roundTransition, setRoundTransition] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);

  const playerPosRef = useRef(new THREE.Vector3(0, 1.7, 0));
  const statsRef = useRef(stats);
  const enemiesRef = useRef(enemies);
  const bulletsRef = useRef(bullets);
  const isDiedRef = useRef(false);
  const roundTransitionRef = useRef(false);
  const roundRef = useRef(1);

  statsRef.current = stats;
  enemiesRef.current = enemies;
  bulletsRef.current = bullets;
  roundTransitionRef.current = roundTransition;

  // Set up camera starting position
  useEffect(() => {
    camera.position.set(0, 1.7, 0);
    playerPosRef.current.set(0, 1.7, 0);
  }, [camera]);

  const spawnBullet = useCallback((
    position: THREE.Vector3,
    direction: THREE.Vector3,
    fromEnemy: boolean
  ) => {
    const b: BulletType = {
      id: ++bulletIdCounter,
      position: [position.x, position.y, position.z],
      direction: [direction.x, direction.y, direction.z],
      speed: fromEnemy ? 22 : 60,
      fromEnemy,
      distanceTraveled: 0,
      maxDistance: fromEnemy ? 40 : 120,
    };
    setBullets(prev => [...prev, b]);
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
        }
        return { ...e, health: newHealth, isDead, state: isDead ? "dying" as const : "chase" as const };
      }
      return e;
    }));
  }, [setStats]);

  useFrame((_, delta) => {
    if (isDiedRef.current || roundTransitionRef.current) return;

    const dt = Math.min(delta, 0.05);
    const playerPos = playerPosRef.current;
    const now = Date.now() / 1000;

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

        // Check wall collisions (rough AABB)
        if (Math.abs(nx) > 22 || Math.abs(nz) > 22) continue;

        // Enemy bullets hit player
        if (b.fromEnemy) {
          const dx = nx - playerPos.x;
          const dy = ny - playerPos.y;
          const dz = nz - playerPos.z;
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.8) {
            setHitFlash(true);
            setTimeout(() => setHitFlash(false), 120);
            setStats(s => {
              const newArmor = Math.max(0, s.armor - 20);
              const armorAbsorb = s.armor > 0 ? 10 : 0;
              const newHealth = s.health - (20 - armorAbsorb);
              if (newHealth <= 0 && !isDiedRef.current) {
                isDiedRef.current = true;
                setTimeout(onDied, 500);
              }
              return { ...s, health: Math.max(0, newHealth), armor: newArmor };
            });
            continue;
          }
        }

        // Player bullets hit enemies
        if (!b.fromEnemy) {
          let hit = false;
          setEnemies(prevEnemies => {
            const updated = prevEnemies.map(e => {
              if (e.isDead) return e;
              const dx = nx - e.position[0];
              const dy = ny - e.position[1];
              const dz = nz - e.position[2];
              if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.8) {
                hit = true;
                const newHealth = e.health - 34;
                const isDead = newHealth <= 0;
                if (isDead) {
                  setStats(s => ({
                    ...s,
                    kills: s.kills + 1,
                    score: s.score + 300,
                  }));
                }
                return { ...e, health: newHealth, isDead, state: isDead ? "dying" as const : e.state };
              }
              return e;
            });
            return updated;
          });
          if (hit) continue;
        }

        next.push({
          ...b,
          position: [nx, ny, nz],
          distanceTraveled: traveled,
        });
      }
      return next;
    });

    // Update enemies
    setEnemies(prev => {
      return prev.map(e => {
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

        if (distToPlayer < 18) {
          newState = "chase";
        } else {
          newState = "patrol";
        }

        if (newState === "chase") {
          if (distToPlayer < 12) {
            newState = "attack";
            // Shoot at player
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
          // Move toward player
          if (distToPlayer > 3) {
            const speed = 2.5 * dt;
            const nx = ex + (dx / distToPlayer) * speed;
            const nz = ez + (dz / distToPlayer) * speed;
            // Simple wall bounds
            newPos = [
              Math.max(-21, Math.min(21, nx)),
              e.position[1],
              Math.max(-21, Math.min(21, nz)),
            ];
          }
        } else {
          // Patrol
          const ptx = newPatrol[0] - ex;
          const ptz = newPatrol[1] - ez;
          const ptDist = Math.sqrt(ptx * ptx + ptz * ptz);
          if (ptDist < 1) {
            // Pick new patrol point
            newPatrol = [
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 30,
            ];
          } else {
            const speed = 1.5 * dt;
            const nx = ex + (ptx / ptDist) * speed;
            const nz = ez + (ptz / ptDist) * speed;
            newPos = [
              Math.max(-21, Math.min(21, nx)),
              e.position[1],
              Math.max(-21, Math.min(21, nz)),
            ];
          }
        }

        return {
          ...e,
          position: newPos,
          state: newState,
          patrolTarget: newPatrol,
          lastShotTime,
        };
      });
    });
  });

  // Check round complete
  useEffect(() => {
    const allDead = enemies.length > 0 && enemies.every(e => e.isDead);
    if (allDead && !roundTransition && !isDiedRef.current) {
      setRoundTransition(true);
      roundTransitionRef.current = true;
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;

      if (nextRound > ROUNDS_CONFIG.length) {
        setTimeout(onWon, 1500);
      } else {
        setTimeout(() => {
          const config = ROUNDS_CONFIG[nextRound - 1];
          setStats(s => ({
            ...s,
            round: nextRound,
            health: 100,
            armor: 100,
            ammo: 30,
            totalAmmo: 90,
            score: s.score + 500,
          }));
          setEnemies(spawnEnemies(config.enemies));
          setBullets([]);
          setRoundTransition(false);
          roundTransitionRef.current = false;
        }, 2000);
      }
    }
  }, [enemies, roundTransition, onWon, setStats]);

  return (
    <>
      {/* Lighting - no shadows for performance */}
      <ambientLight intensity={0.6} color="#c8d8ff" />
      <directionalLight position={[10, 20, 10]} intensity={0.9} color="#ffe0b0" />
      <directionalLight position={[-10, 10, -10]} intensity={0.25} color="#8099ff" />
      <hemisphereLight args={["#87ceeb", "#404040", 0.3]} />
      <fog args={["#0a1020", 30, 150]} />

      {/* Hit flash overlay (mesh over camera) */}
      {hitFlash && (
        <mesh position={[camera.position.x, camera.position.y, camera.position.z - 0.1]}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.25} depthTest={false} />
        </mesh>
      )}

      {/* Round transition overlay */}
      {roundTransition && (
        <mesh position={[0, 0, -1]} renderOrder={999}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} depthTest={false} />
        </mesh>
      )}

      <Map />
      <PlayerController
        playerPosRef={playerPosRef}
        onShoot={handlePlayerShoot}
        onKnifeStab={handleKnifeStab}
        stats={stats}
        setStats={setStats}
      />
      {enemies.map(e => (
        <EnemyMesh key={e.id} enemy={e} />
      ))}
      {bullets.map(b => (
        <BulletMesh key={b.id} bullet={b} />
      ))}
    </>
  );
}
