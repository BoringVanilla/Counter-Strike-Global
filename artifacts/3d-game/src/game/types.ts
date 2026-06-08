export interface Enemy {
  id: number;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  isDead: boolean;
  state: "patrol" | "chase" | "attack" | "dying";
  patrolTarget: [number, number];
  lastShotTime: number;
  lastHitTime: number;
}

export interface Bullet {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  speed: number;
  fromEnemy: boolean;
  distanceTraveled: number;
  maxDistance: number;
}

export interface HitEffect {
  id: number;
  position: [number, number, number];
  time: number;
  isKill: boolean;
}
