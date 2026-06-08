import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import GameScene from "./GameScene";
import HUD from "./HUD";
import Menu from "./Menu";
import GameOver from "./GameOver";

export type GameState = "menu" | "playing" | "dead" | "won";
export type WeaponType = "AK-47" | "Knife";

export interface GameStats {
  health: number;
  armor: number;
  ammo: number;
  totalAmmo: number;
  kills: number;
  round: number;
  totalRounds: number;
  score: number;
  weapon: WeaponType;
  isReloading: boolean;
  damageFlash: number;
}

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  shoot = "shoot",
  reload = "reload",
  sprint = "sprint",
  switchWeapon = "switchWeapon",
}

const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.shoot, keys: ["Mouse0"] },
  { name: Controls.reload, keys: ["KeyR"] },
  { name: Controls.sprint, keys: ["ShiftLeft"] },
  { name: Controls.switchWeapon, keys: ["KeyQ"] },
];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [stats, setStats] = useState<GameStats>({
    health: 100,
    armor: 100,
    ammo: 30,
    totalAmmo: 90,
    kills: 0,
    round: 1,
    totalRounds: 5,
    score: 0,
    weapon: "AK-47",
    isReloading: false,
    damageFlash: 0,
  });

  const startGame = useCallback(() => {
    setStats({
      health: 100,
      armor: 100,
      ammo: 30,
      totalAmmo: 90,
      kills: 0,
      round: 1,
      totalRounds: 5,
      score: 0,
      weapon: "AK-47",
      isReloading: false,
      damageFlash: 0,
    });
    setGameState("playing");
  }, []);

  const handleDied = useCallback(() => setGameState("dead"), []);
  const handleWon = useCallback(() => setGameState("won"), []);

  if (gameState === "menu") return <Menu onStart={startGame} />;
  if (gameState === "dead") return <GameOver won={false} score={stats.score} kills={stats.kills} onRestart={startGame} />;
  if (gameState === "won") return <GameOver won={true} score={stats.score} kills={stats.kills} onRestart={startGame} />;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
      <KeyboardControls map={keyMap}>
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ fov: 75, near: 0.1, far: 200 }}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          dpr={1}
          frameloop="always"
        >
          <GameScene
            stats={stats}
            setStats={setStats}
            onDied={handleDied}
            onWon={handleWon}
          />
        </Canvas>
      </KeyboardControls>
      <HUD stats={stats} />
    </div>
  );
}
