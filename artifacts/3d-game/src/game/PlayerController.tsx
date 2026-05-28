import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { GameStats, WeaponType } from "./Game";
import WeaponModel from "./WeaponModel";
import KnifeModel from "./KnifeModel";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  sprint = "sprint",
  switchWeapon = "switchWeapon",
}

interface PlayerControllerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onShoot: (pos: THREE.Vector3, dir: THREE.Vector3) => void;
  onKnifeStab: (pos: THREE.Vector3, dir: THREE.Vector3) => void;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
}

const PLAYER_HEIGHT = 1.7;
const MOVE_SPEED = 8;
const SPRINT_SPEED = 13;
const KNIFE_SPRINT_SPEED = 16;
const JUMP_FORCE = 6;
const GRAVITY = -18;
const RELOAD_TIME = 2000;

function clampToMap(x: number, z: number): [number, number] {
  return [Math.max(-21.5, Math.min(21.5, x)), Math.max(-21.5, Math.min(21.5, z))];
}

export default function PlayerController({ playerPosRef, onShoot, onKnifeStab, stats, setStats }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const velocityY = useRef(0);
  const onGround = useRef(true);
  const isLockedRef = useRef(false);
  const lastShotRef = useRef(0);
  const lastKnifeRef = useRef(0);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef = useRef(stats);
  const qWasDownRef = useRef(false);
  statsRef.current = stats;

  const [locked, setLocked] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [isStabbing, setIsStabbing] = useState(false);

  // Pointer lock
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      const sens = 0.0018;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchRef.current));
    };

    const onLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      isLockedRef.current = isLocked;
      setLocked(isLocked);
    };

    const onClick = () => {
      if (!isLockedRef.current) canvas.requestPointerLock();
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [gl]);

  // Mouse shoot / stab
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isLockedRef.current || e.button !== 0) return;
      const s = statsRef.current;

      if (s.weapon === "Knife") {
        // Knife melee
        const now = Date.now();
        if (now - lastKnifeRef.current < 600) return;
        lastKnifeRef.current = now;
        setIsStabbing(true);
        setTimeout(() => setIsStabbing(false), 300);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        onKnifeStab(camera.position.clone(), dir);
      } else {
        // AK-47 shoot
        if (s.ammo <= 0 || s.isReloading) return;
        const now = Date.now();
        if (now - lastShotRef.current < 90) return;
        lastShotRef.current = now;
        setIsShooting(true);
        setTimeout(() => setIsShooting(false), 80);
        setStats(prev => ({ ...prev, ammo: Math.max(0, prev.ammo - 1) }));
        const pos = camera.position.clone();
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const spread = 0.012;
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.normalize();
        onShoot(pos, dir);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [camera, onShoot, onKnifeStab, setStats]);

  // Reload keybinding (R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyR") {
        const s = statsRef.current;
        if (s.weapon === "Knife" || s.isReloading || s.ammo === 30 || s.totalAmmo === 0) return;
        setStats(prev => ({ ...prev, isReloading: true }));
        reloadTimerRef.current = setTimeout(() => {
          setStats(prev => {
            const needed = 30 - prev.ammo;
            const take = Math.min(needed, prev.totalAmmo);
            return { ...prev, ammo: prev.ammo + take, totalAmmo: prev.totalAmmo - take, isReloading: false };
          });
        }, RELOAD_TIME);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [setStats]);

  // Auto-reload when ammo hits 0
  useEffect(() => {
    if (stats.ammo === 0 && !stats.isReloading && stats.totalAmmo > 0 && stats.weapon === "AK-47") {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      setStats(prev => ({ ...prev, isReloading: true }));
      reloadTimerRef.current = setTimeout(() => {
        setStats(prev => {
          const needed = 30 - prev.ammo;
          const take = Math.min(needed, prev.totalAmmo);
          return { ...prev, ammo: prev.ammo + take, totalAmmo: prev.totalAmmo - take, isReloading: false };
        });
      }, RELOAD_TIME);
    }
  }, [stats.ammo, stats.isReloading, stats.totalAmmo, stats.weapon, setStats]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = getKeys();
    const isSprinting = keys.sprint;

    // Q weapon switch (edge detection — only trigger once per press)
    const qDown = keys.switchWeapon;
    if (qDown && !qWasDownRef.current) {
      setStats(prev => {
        const next: WeaponType = prev.weapon === "AK-47" ? "Knife" : "AK-47";
        return { ...prev, weapon: next, isReloading: false };
      });
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
    }
    qWasDownRef.current = qDown;

    // Camera rotation from mouse
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    // Movement
    const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));

    let moveX = 0;
    let moveZ = 0;
    if (keys.forward) { moveX += forward.x; moveZ += forward.z; }
    if (keys.back) { moveX -= forward.x; moveZ -= forward.z; }
    if (keys.left) { moveX -= right.x; moveZ -= right.z; }
    if (keys.right) { moveX += right.x; moveZ += right.z; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    // Knife allows faster movement
    const baseSpeed = stats.weapon === "Knife" ? KNIFE_SPRINT_SPEED : MOVE_SPEED;
    const speed = isSprinting ? Math.max(baseSpeed, SPRINT_SPEED) : baseSpeed;
    let nx = camera.position.x + moveX * speed * dt;
    let nz = camera.position.z + moveZ * speed * dt;

    // Jump
    if (keys.jump && onGround.current) {
      velocityY.current = JUMP_FORCE;
      onGround.current = false;
    }

    // Gravity
    velocityY.current += GRAVITY * dt;
    let ny = camera.position.y + velocityY.current * dt;
    if (ny <= PLAYER_HEIGHT) {
      ny = PLAYER_HEIGHT;
      velocityY.current = 0;
      onGround.current = true;
    }

    const [cx, cz] = clampToMap(nx, nz);
    camera.position.set(cx, ny, cz);
    playerPosRef.current.set(cx, ny, cz);
  });

  if (!locked) return null;

  return (
    <>
      {stats.weapon === "AK-47" && (
        <WeaponModel isReloading={stats.isReloading} isShooting={isShooting} />
      )}
      {stats.weapon === "Knife" && (
        <KnifeModel isStabbing={isStabbing} />
      )}
    </>
  );
}
