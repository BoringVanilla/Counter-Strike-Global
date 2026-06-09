import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveCollisions, WALL_COLLIDERS } from "@/game/mapColliders";
import VirtualJoystick from "./VirtualJoystick";
import ActionButtons from "./ActionButtons";
import GameHUD from "./GameHUD";

// ─── Types ────────────────────────────────────────────────
interface Player { x: number; z: number; angle: number; health: number; armor: number; }
interface Enemy {
  id: number; x: number; z: number; angle: number; health: number; maxHealth: number;
  state: "patrol" | "chase" | "attack" | "dead"; hitTimer: number; attackTimer: number; patrolAngle: number;
}
interface Bullet { id: number; x: number; z: number; dx: number; dz: number; dist: number; fromPlayer: boolean; }
interface DisplayStats {
  health: number; armor: number; ammo: number; totalAmmo: number;
  kills: number; score: number; wave: number;
  weapon: "AK-47" | "Knife"; fireMode: "auto" | "semi" | "single"; isReloading: boolean;
}

// ─── Constants ─────────────────────────────────────────────
const PLAYER_SPEED = 7;
const PLAYER_RADIUS = 0.38;
const ENEMY_RADIUS = 0.55;
const BULLET_SPEED = 36;
const BULLET_RANGE = 40;
const FIRE_RATE = { auto: 0.09, semi: 0.18, single: 0.55 };
const RELOAD_TIME = 2.5;
const AK_DAMAGE = 35;
const AK_AMMO = 30;
const AK_TOTAL_AMMO = 900;
const ENEMY_SPEED = 2.8;
const ENEMY_CHASE_DIST = 14;
const ENEMY_ATTACK_DIST = 1.2;
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RATE = 1.2;
const KNIFE_RANGE = 2.2;
const KNIFE_DAMAGE = 55;
const WAVE_INTERVAL = 25;
const WAVE_SIZE = 5;
const LOOK_SENS = 0.005;
const SPAWN_RING = 18;

// ─── Spawn helpers ─────────────────────────────────────────
function randomSpawn(): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = SPAWN_RING + Math.random() * 3;
  let x = Math.cos(angle) * r;
  let z = Math.sin(angle) * r;
  x = Math.max(-20, Math.min(20, x));
  z = Math.max(-20, Math.min(20, z));
  return { x, z };
}

function spawnWave(waveNum: number, startId: number): Enemy[] {
  const enemies: Enemy[] = [];
  for (let i = 0; i < WAVE_SIZE; i++) {
    const { x, z } = randomSpawn();
    enemies.push({
      id: startId + i, x, z,
      angle: Math.random() * Math.PI * 2,
      health: 80 + waveNum * 10,
      maxHealth: 80 + waveNum * 10,
      state: "patrol",
      hitTimer: 0,
      attackTimer: 0,
      patrolAngle: Math.random() * Math.PI * 2,
    });
  }
  return enemies;
}

// ─── Main component ────────────────────────────────────────
interface Props { onDeath: (stats: DisplayStats) => void; }

export default function GameCanvas({ onDeath }: Props) {
  const { width: SW, height: SH } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;
  const leftPad = Platform.OS === "web" ? 0 : insets.left;
  const rightPad = Platform.OS === "web" ? 0 : insets.right;

  const GAME_H = SH - topPad - 60;
  const GAME_W = SW;
  const SCALE = Math.min(GAME_W, GAME_H) / 16;
  const CX = GAME_W / 2;
  const CY = topPad + GAME_H / 2;

  // ── Game state refs ──────────────────────────────────────
  const playerRef = useRef<Player>({ x: 4, z: 0, angle: 0, health: 100, armor: 100 });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lastTimeRef = useRef(Date.now());
  const shootTimerRef = useRef(0);
  const reloadTimerRef = useRef(-1);
  const waveTimerRef = useRef(0);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(WAVE_SIZE);
  const killsRef = useRef(0);
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const ammoRef = useRef(AK_AMMO);
  const totalAmmoRef = useRef(AK_TOTAL_AMMO);
  const weaponRef = useRef<"AK-47" | "Knife">("AK-47");
  const fireModeRef = useRef<"auto" | "semi" | "single">("auto");
  const deadRef = useRef(false);
  const semiJustFiredRef = useRef(false);

  // ── Input refs ────────────────────────────────────────────
  const joyRef = useRef({ dx: 0, dy: 0 });
  const shootingRef = useRef(false);
  const justKnifeRef = useRef(false);
  const justReloadRef = useRef(false);
  const justSwitchRef = useRef(false);
  const justJumpRef = useRef(false);

  // ── Display state ─────────────────────────────────────────
  const [displayStats, setDisplayStats] = useState<DisplayStats>({
    health: 100, armor: 100, ammo: AK_AMMO, totalAmmo: AK_TOTAL_AMMO,
    kills: 0, score: 0, wave: 1, weapon: "AK-47", fireMode: "auto", isReloading: false,
  });
  const [tick, setTick] = useState(0);

  // ── Look (right-side pan) ─────────────────────────────────
  const lookRef = useRef(0);
  const lookLastX = useRef(0);
  const lookResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => { lookLastX.current = e.nativeEvent.pageX; },
      onPanResponderMove: (e) => {
        const dx = e.nativeEvent.pageX - lookLastX.current;
        lookLastX.current = e.nativeEvent.pageX;
        playerRef.current.angle += dx * LOOK_SENS;
      },
    })
  ).current;

  // ── Init first wave ───────────────────────────────────────
  useEffect(() => {
    enemiesRef.current = spawnWave(1, 0);
    waveTimerRef.current = 0;
  }, []);

  // ── Game loop ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (deadRef.current) return;
      const now = Date.now();
      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 0.05);

      const player = playerRef.current;

      // ── Wave timer ──────────────────────────────────────
      waveTimerRef.current += dt;
      if (waveTimerRef.current >= WAVE_INTERVAL) {
        waveTimerRef.current = 0;
        waveRef.current += 1;
        const newEnemies = spawnWave(waveRef.current, enemyIdRef.current);
        enemyIdRef.current += WAVE_SIZE;
        enemiesRef.current = [...enemiesRef.current.filter(e => e.state !== "dead"), ...newEnemies];
      }

      // ── Reload timer ────────────────────────────────────
      if (reloadTimerRef.current >= 0) {
        reloadTimerRef.current -= dt;
        if (reloadTimerRef.current <= 0) {
          reloadTimerRef.current = -1;
          const reload = Math.min(AK_AMMO - ammoRef.current, totalAmmoRef.current);
          ammoRef.current += reload;
          totalAmmoRef.current -= reload;
        }
      }

      // ── Handle switch ────────────────────────────────────
      if (justSwitchRef.current) {
        justSwitchRef.current = false;
        weaponRef.current = weaponRef.current === "AK-47" ? "Knife" : "AK-47";
      }

      // ── Handle reload ────────────────────────────────────
      if (justReloadRef.current) {
        justReloadRef.current = false;
        if (weaponRef.current === "AK-47" && reloadTimerRef.current < 0 && ammoRef.current < AK_AMMO && totalAmmoRef.current > 0) {
          reloadTimerRef.current = RELOAD_TIME;
        }
      }

      // ── Player movement ─────────────────────────────────
      const { dx: jx, dy: jy } = joyRef.current;
      if (jx !== 0 || jy !== 0) {
        const a = player.angle;
        const fwdX = Math.sin(a);
        const fwdZ = -Math.cos(a);
        const rgtX = Math.cos(a);
        const rgtZ = Math.sin(a);
        const mv = Math.min(Math.sqrt(jx * jx + jy * jy), 1);
        const worldDx = rgtX * jx + fwdX * (-jy);
        const worldDz = rgtZ * jx + fwdZ * (-jy);
        const len = Math.sqrt(worldDx * worldDx + worldDz * worldDz);
        if (len > 0.01) {
          let nx = player.x + (worldDx / len) * mv * PLAYER_SPEED * dt;
          let nz = player.z + (worldDz / len) * mv * PLAYER_SPEED * dt;
          [nx, nz] = resolveCollisions(nx, nz, PLAYER_RADIUS);
          player.x = nx;
          player.z = nz;
        }
      }

      // ── Knife attack ─────────────────────────────────────
      if (justKnifeRef.current) {
        justKnifeRef.current = false;
        const fwdX = Math.sin(player.angle);
        const fwdZ = -Math.cos(player.angle);
        let hit = false;
        enemiesRef.current.forEach(e => {
          if (e.state === "dead") return;
          const tipX = player.x + fwdX * KNIFE_RANGE * 0.5;
          const tipZ = player.z + fwdZ * KNIFE_RANGE * 0.5;
          const dx = e.x - tipX, dz = e.z - tipZ;
          if (Math.sqrt(dx * dx + dz * dz) < KNIFE_RANGE) {
            e.health -= KNIFE_DAMAGE;
            e.hitTimer = 0.15;
            e.state = "chase";
            hit = true;
            if (e.health <= 0) {
              e.state = "dead";
              killsRef.current += 1;
              scoreRef.current += 150;
            }
          }
        });
        if (hit && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // ── Shooting ─────────────────────────────────────────
      shootTimerRef.current = Math.max(0, shootTimerRef.current - dt);
      const fm = fireModeRef.current;
      const canShoot = shootTimerRef.current <= 0 && weaponRef.current === "AK-47" && reloadTimerRef.current < 0;

      const wantsShoot = shootingRef.current;
      const shouldFire =
        canShoot && ammoRef.current > 0 && (
          fm === "auto" ? wantsShoot :
          fm === "semi" ? (wantsShoot && !semiJustFiredRef.current) :
          (wantsShoot && !semiJustFiredRef.current)
        );

      if (!wantsShoot) semiJustFiredRef.current = false;

      if (shouldFire) {
        shootTimerRef.current = FIRE_RATE[fm];
        if (fm !== "auto") semiJustFiredRef.current = true;
        ammoRef.current -= 1;
        if (ammoRef.current === 0 && totalAmmoRef.current > 0) {
          reloadTimerRef.current = RELOAD_TIME;
        }
        const spread = 0.04;
        const angleJitter = (Math.random() - 0.5) * spread;
        const shotAngle = player.angle + angleJitter;
        const bdx = Math.sin(shotAngle);
        const bdz = -Math.cos(shotAngle);
        bulletsRef.current.push({
          id: bulletIdRef.current++,
          x: player.x + bdx * 0.5,
          z: player.z + bdz * 0.5,
          dx: bdx, dz: bdz, dist: 0, fromPlayer: true,
        });
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // ── Update bullets ────────────────────────────────────
      const bulletStep = BULLET_SPEED * dt;
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.x += b.dx * bulletStep;
        b.z += b.dz * bulletStep;
        b.dist += bulletStep;
        if (b.dist > BULLET_RANGE) return false;

        // wall hit
        for (const w of WALL_COLLIDERS) {
          if (b.x >= w.minX && b.x <= w.maxX && b.z >= w.minZ && b.z <= w.maxZ) return false;
        }

        // enemy hit (player bullets only)
        if (b.fromPlayer) {
          for (const e of enemiesRef.current) {
            if (e.state === "dead") continue;
            const dx = b.x - e.x, dz = b.z - e.z;
            if (Math.sqrt(dx * dx + dz * dz) < ENEMY_RADIUS + 0.15) {
              e.health -= AK_DAMAGE;
              e.hitTimer = 0.1;
              e.state = "chase";
              scoreRef.current += 10;
              if (e.health <= 0) {
                e.state = "dead";
                killsRef.current += 1;
                scoreRef.current += 100;
              }
              return false;
            }
          }
        }

        // player hit (enemy bullets)
        if (!b.fromPlayer) {
          const dx = b.x - player.x, dz = b.z - player.z;
          if (Math.sqrt(dx * dx + dz * dz) < PLAYER_RADIUS + 0.15) {
            let dmg = ENEMY_DAMAGE;
            if (player.armor > 0) {
              const armorAbsorb = Math.min(player.armor, dmg * 0.6);
              player.armor -= armorAbsorb;
              dmg -= armorAbsorb;
            }
            player.health -= dmg;
            if (player.health <= 0) {
              deadRef.current = true;
              onDeath({ ...displayStats, kills: killsRef.current, score: scoreRef.current, wave: waveRef.current });
            }
            return false;
          }
        }
        return true;
      });

      // ── Enemy AI ──────────────────────────────────────────
      enemiesRef.current.forEach(e => {
        if (e.state === "dead") return;
        e.hitTimer = Math.max(0, e.hitTimer - dt);
        e.attackTimer = Math.max(0, e.attackTimer - dt);

        const dx = player.x - e.x;
        const dz = player.z - e.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < ENEMY_CHASE_DIST) {
          e.state = dist < ENEMY_ATTACK_DIST ? "attack" : "chase";
        } else if (e.state === "chase") {
          e.state = "patrol";
        }

        if (e.state === "patrol") {
          e.patrolAngle += dt * 0.3 + (Math.random() - 0.5) * 0.1;
          const px = Math.cos(e.patrolAngle) * ENEMY_SPEED * 0.3 * dt;
          const pz = Math.sin(e.patrolAngle) * ENEMY_SPEED * 0.3 * dt;
          const [nx, nz] = resolveCollisions(e.x + px, e.z + pz, ENEMY_RADIUS);
          e.x = nx; e.z = nz;
        } else if (e.state === "chase") {
          const len = dist < 0.01 ? 1 : dist;
          const [nx, nz] = resolveCollisions(
            e.x + (dx / len) * ENEMY_SPEED * dt,
            e.z + (dz / len) * ENEMY_SPEED * dt,
            ENEMY_RADIUS
          );
          e.x = nx; e.z = nz;
          // also spawn enemy bullets occasionally
          if (dist > 3 && Math.random() < dt * 0.8) {
            const bdx = dx / len;
            const bdz = dz / len;
            bulletsRef.current.push({
              id: bulletIdRef.current++,
              x: e.x + bdx * 0.5, z: e.z + bdz * 0.5,
              dx: bdx + (Math.random() - 0.5) * 0.1,
              dz: bdz + (Math.random() - 0.5) * 0.1,
              dist: 0, fromPlayer: false,
            });
          }
        } else if (e.state === "attack") {
          if (e.attackTimer <= 0) {
            e.attackTimer = ENEMY_ATTACK_RATE;
            let dmg = ENEMY_DAMAGE * 2;
            if (player.armor > 0) {
              const a = Math.min(player.armor, dmg * 0.5);
              player.armor -= a; dmg -= a;
            }
            player.health -= dmg;
            if (player.health <= 0) {
              deadRef.current = true;
              onDeath({ ...displayStats, kills: killsRef.current, score: scoreRef.current, wave: waveRef.current });
            }
          }
        }

        // face player
        e.angle = Math.atan2(dx, -dz);
      });

      // ── Update display ─────────────────────────────────────
      setDisplayStats({
        health: Math.max(0, Math.round(player.health)),
        armor: Math.max(0, Math.round(player.armor)),
        ammo: ammoRef.current,
        totalAmmo: totalAmmoRef.current,
        kills: killsRef.current,
        score: scoreRef.current,
        wave: waveRef.current,
        weapon: weaponRef.current,
        fireMode: fireModeRef.current,
        isReloading: reloadTimerRef.current > 0,
      });
      setTick(t => t + 1);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // ── Render ─────────────────────────────────────────────────
  const player = playerRef.current;
  const fwdX = Math.sin(player.angle);
  const fwdZ = -Math.cos(player.angle);

  const toScreen = (wx: number, wz: number) => ({
    left: CX + (wx - player.x) * SCALE,
    top: CY + (wz - player.z) * SCALE,
  });

  const PRpx = PLAYER_RADIUS * SCALE;

  return (
    <View style={styles.root}>
      {/* ── Floor ───────────────────────────────────────── */}
      <View style={[styles.floor, { top: topPad, height: GAME_H }]} />

      {/* ── Grid lines (subtle) ─────────────────────────── */}
      {Array.from({ length: 9 }, (_, i) => {
        const worldX = -20 + i * 5;
        const sx = CX + (worldX - player.x) * SCALE;
        return (
          <View key={`gx${i}`} style={{ position: "absolute", left: sx, top: topPad, width: 1, height: GAME_H, backgroundColor: "rgba(255,255,255,0.025)" }} />
        );
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const worldZ = -20 + i * 5;
        const sz = CY + (worldZ - player.z) * SCALE;
        return (
          <View key={`gz${i}`} style={{ position: "absolute", left: 0, top: sz, width: GAME_W, height: 1, backgroundColor: "rgba(255,255,255,0.025)" }} />
        );
      })}

      {/* ── Walls ────────────────────────────────────────── */}
      {WALL_COLLIDERS.map((w, i) => {
        const s = toScreen(w.minX, w.minZ);
        const ww = (w.maxX - w.minX) * SCALE;
        const wh = (w.maxZ - w.minZ) * SCALE;
        if (s.left + ww < 0 || s.left > GAME_W || s.top + wh < topPad || s.top > topPad + GAME_H) return null;
        return (
          <View key={i} style={{
            position: "absolute", left: s.left, top: s.top, width: ww, height: wh,
            backgroundColor: "#2a3040",
            borderWidth: 1, borderColor: "#3c4558",
          }} />
        );
      })}

      {/* ── Enemy bullets ────────────────────────────────── */}
      {bulletsRef.current.filter(b => !b.fromPlayer).map(b => {
        const s = toScreen(b.x, b.z);
        return (
          <View key={b.id} style={{
            position: "absolute",
            left: s.left - 3, top: s.top - 3,
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: "#ff4422",
          }} />
        );
      })}

      {/* ── Player bullets ───────────────────────────────── */}
      {bulletsRef.current.filter(b => b.fromPlayer).map(b => {
        const s = toScreen(b.x, b.z);
        return (
          <View key={b.id} style={{
            position: "absolute",
            left: s.left - 3, top: s.top - 3,
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: "#ffdd44",
          }} />
        );
      })}

      {/* ── Enemies ──────────────────────────────────────── */}
      {enemiesRef.current.filter(e => e.state !== "dead").map(e => {
        const s = toScreen(e.x, e.z);
        const er = ENEMY_RADIUS * SCALE;
        const hp = e.health / e.maxHealth;
        const hue = e.hitTimer > 0 ? "#ff8844" : "#cc2222";
        const isChasing = e.state === "chase" || e.state === "attack";
        return (
          <View key={e.id} style={{ position: "absolute", left: s.left - er, top: s.top - er }}>
            {/* Enemy body */}
            <View style={{ width: er * 2, height: er * 2, borderRadius: er, backgroundColor: hue, borderWidth: 1.5, borderColor: isChasing ? "#ff6644" : "#991111" }} />
            {/* Direction indicator */}
            <View style={{
              position: "absolute",
              left: er + Math.sin(e.angle) * (er + 2) - 2,
              top: er - Math.cos(e.angle) * (er + 2) - 2,
              width: 4, height: 4, borderRadius: 2, backgroundColor: "#ff9966",
            }} />
            {/* Health bar */}
            <View style={{ position: "absolute", top: -7, left: 0, width: er * 2, height: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 2, overflow: "hidden" }}>
              <View style={{ width: `${hp * 100}%` as any, height: "100%", backgroundColor: hp > 0.5 ? "#44dd44" : hp > 0.25 ? "#ddaa00" : "#dd2222" }} />
            </View>
          </View>
        );
      })}

      {/* ── Player ───────────────────────────────────────── */}
      <View style={{
        position: "absolute",
        left: CX - PRpx, top: CY - PRpx,
        width: PRpx * 2, height: PRpx * 2, borderRadius: PRpx,
        backgroundColor: "#e8e8e8",
        borderWidth: 2, borderColor: "#ffffff",
        zIndex: 10,
      }} />
      {/* Direction indicator */}
      <View style={{
        position: "absolute",
        left: CX + fwdX * (PRpx + 5) - 3,
        top: CY + fwdZ * (PRpx + 5) - 3,
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: "#ff6a00",
        zIndex: 11,
      }} />
      {/* Second dot further out (aim line) */}
      <View style={{
        position: "absolute",
        left: CX + fwdX * (PRpx + 15) - 2,
        top: CY + fwdZ * (PRpx + 15) - 2,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: "rgba(255,106,0,0.5)",
        zIndex: 11,
      }} />

      {/* ── Crosshair ────────────────────────────────────── */}
      <View style={{ position: "absolute", left: CX - 10, top: CY - 1, width: 20, height: 2, backgroundColor: "rgba(255,255,255,0.4)", zIndex: 20, pointerEvents: "none" }} />
      <View style={{ position: "absolute", left: CX - 1, top: CY - 10, width: 2, height: 20, backgroundColor: "rgba(255,255,255,0.4)", zIndex: 20, pointerEvents: "none" }} />
      <View style={{ position: "absolute", left: CX - 2, top: CY - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,150,0,0.8)", zIndex: 20, pointerEvents: "none" }} />

      {/* ── Wave timer bar ────────────────────────────────── */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "rgba(255,255,255,0.05)", zIndex: 20, pointerEvents: "none" }}>
        <View style={{ width: `${(waveTimerRef.current / WAVE_INTERVAL) * 100}%` as any, height: "100%", backgroundColor: "#ff6a00" }} />
      </View>

      {/* ── HUD ──────────────────────────────────────────── */}
      <GameHUD {...displayStats} />

      {/* ── Look area (right side, behind buttons) ───────── */}
      <View
        style={{ position: "absolute", right: 0, top: topPad, width: SW * 0.55, height: GAME_H, zIndex: 30 }}
        {...lookResponder.panHandlers}
      />

      {/* ── Joystick (bottom-left) ───────────────────────── */}
      <View style={{ position: "absolute", bottom: 24 + bottomPad, left: 24 + leftPad, zIndex: 40 }}>
        <VirtualJoystick onMove={(dx, dy) => { joyRef.current = { dx, dy }; }} />
      </View>

      {/* ── Action buttons (bottom-right) ────────────────── */}
      <View style={{ position: "absolute", bottom: 20 + bottomPad, right: 20 + rightPad, zIndex: 50 }}>
        <ActionButtons
          weapon={displayStats.weapon}
          isReloading={displayStats.isReloading}
          ammo={displayStats.ammo}
          onShootStart={() => { shootingRef.current = true; }}
          onShootEnd={() => { shootingRef.current = false; }}
          onKnife={() => { justKnifeRef.current = true; }}
          onReload={() => { justReloadRef.current = true; }}
          onSwitch={() => { justSwitchRef.current = true; }}
          onJump={() => { justJumpRef.current = true; }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0c10", overflow: "hidden" },
  floor: {
    position: "absolute", left: 0, right: 0,
    backgroundColor: "#13161e",
  },
});
