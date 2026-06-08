import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { GameStats, WeaponType } from "./Game";
import WeaponModel from "./WeaponModel";
import KnifeModel from "./KnifeModel";
import { resolveCollisions } from "./mapColliders";

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
const PLAYER_RADIUS = 0.38;
const MOVE_SPEED = 8;
const SPRINT_SPEED = 13;
const KNIFE_SPRINT_SPEED = 16;
const JUMP_FORCE = 6.5;
const GRAVITY = -15;
const RELOAD_TIME = 2000;
const BOB_FREQ = 10;
const BOB_AMP = 0.03;
const MOUSE_SENSITIVITY = 0.0015;

export default function PlayerController({
  playerPosRef, onShoot, onKnifeStab, stats, setStats,
}: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const velYRef = useRef(0);
  const onGroundRef = useRef(true);
  const isLockedRef = useRef(false);
  const lastShotRef = useRef(0);
  const lastKnifeRef = useRef(0);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef = useRef(stats);
  const qWasDownRef = useRef(false);

  // Head bob
  const bobTimeRef = useRef(0);
  const bobYRef = useRef(0);
  const wasOnGroundRef = useRef(true);
  const landBounceRef = useRef(0);

  // Camera shake
  const shakeRef = useRef(0);
  const lastDamageFlashRef = useRef(0);

  statsRef.current = stats;

  const [locked, setLocked] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [isStabbing, setIsStabbing] = useState(false);

  // Pointer lock
  useEffect(() => {
    const canvas = gl.domElement;
    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
      pitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
      pitchRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitchRef.current));
    };
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      isLockedRef.current = isLocked;
      setLocked(isLocked);
    };
    const onClick = () => { if (!isLockedRef.current) canvas.requestPointerLock(); };
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
        const now = Date.now();
        if (now - lastKnifeRef.current < 600) return;
        lastKnifeRef.current = now;
        setIsStabbing(true);
        setTimeout(() => setIsStabbing(false), 300);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        onKnifeStab(camera.position.clone(), dir);
      } else {
        if (s.ammo <= 0 || s.isReloading) return;
        const now = Date.now();
        if (now - lastShotRef.current < 90) return;
        lastShotRef.current = now;
        setIsShooting(true);
        setTimeout(() => setIsShooting(false), 80);
        setStats(prev => ({ ...prev, ammo: Math.max(0, prev.ammo - 1) }));
        shakeRef.current = Math.max(shakeRef.current, 0.04);
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

  // Reload key
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

  // Auto-reload on empty
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

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const keys = getKeys();
    const isSprinting = keys.sprint;

    // Weapon switch (Q - edge detection)
    const qDown = keys.switchWeapon;
    if (qDown && !qWasDownRef.current) {
      setStats(prev => {
        const next: WeaponType = prev.weapon === "AK-47" ? "Knife" : "AK-47";
        return { ...prev, weapon: next, isReloading: false };
      });
      if (reloadTimerRef.current) { clearTimeout(reloadTimerRef.current); reloadTimerRef.current = null; }
    }
    qWasDownRef.current = qDown;

    // Damage flash → camera shake
    if (stats.damageFlash !== lastDamageFlashRef.current) {
      lastDamageFlashRef.current = stats.damageFlash;
      shakeRef.current = 0.13;
    }
    shakeRef.current *= Math.pow(0.001, dt);
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;

    // Camera orientation
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    // Movement vectors (horizontal only)
    const fwdX = -Math.sin(yawRef.current);
    const fwdZ = -Math.cos(yawRef.current);
    const rgtX =  Math.cos(yawRef.current);
    const rgtZ = -Math.sin(yawRef.current);

    let moveX = 0, moveZ = 0;
    if (keys.forward) { moveX += fwdX; moveZ += fwdZ; }
    if (keys.back)    { moveX -= fwdX; moveZ -= fwdZ; }
    if (keys.left)    { moveX -= rgtX; moveZ -= rgtZ; }
    if (keys.right)   { moveX += rgtX; moveZ += rgtZ; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = len > 0.001;
    if (isMoving) { moveX /= len; moveZ /= len; }

    const baseSpeed = stats.weapon === "Knife" ? KNIFE_SPRINT_SPEED : MOVE_SPEED;
    const speed = isSprinting ? Math.max(baseSpeed, SPRINT_SPEED) : baseSpeed;

    // Apply movement then resolve collisions
    let px = playerPosRef.current.x + moveX * speed * dt;
    let pz = playerPosRef.current.z + moveZ * speed * dt;
    [px, pz] = resolveCollisions(px, pz, PLAYER_RADIUS);

    // Jump
    if (keys.jump && onGroundRef.current) {
      velYRef.current = JUMP_FORCE;
      onGroundRef.current = false;
    }

    // Gravity + vertical
    velYRef.current += GRAVITY * dt;
    let py = playerPosRef.current.y + velYRef.current * dt;

    const wasGrounded = wasOnGroundRef.current;
    if (py <= PLAYER_HEIGHT) {
      if (!wasGrounded) landBounceRef.current = -0.04; // landing dip
      py = PLAYER_HEIGHT;
      velYRef.current = 0;
      onGroundRef.current = true;
    }
    wasOnGroundRef.current = onGroundRef.current;
    landBounceRef.current *= Math.pow(0.0001, dt);

    // Head bob
    if (isMoving && onGroundRef.current) {
      bobTimeRef.current += dt * BOB_FREQ * (isSprinting ? 1.3 : 1);
      bobYRef.current = Math.sin(bobTimeRef.current) * BOB_AMP;
    } else {
      bobYRef.current *= Math.pow(0.001, dt);
    }

    // Air wobble
    const airWobble = onGroundRef.current ? 0 : Math.sin(t * 5) * 0.004;

    // Write logical position (no shake/bob offsets)
    playerPosRef.current.set(px, py, pz);

    // Apply full camera position (logical + visual offsets)
    camera.position.set(
      px + shakeX,
      py + bobYRef.current + landBounceRef.current + airWobble,
      pz + shakeY * 0.5,
    );
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
