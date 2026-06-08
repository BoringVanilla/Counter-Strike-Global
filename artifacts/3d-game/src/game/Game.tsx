import { useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import GameScene from "./GameScene";
import HUD from "./HUD";
import Menu from "./Menu";
import GameOver from "./GameOver";
import PauseMenu from "./PauseMenu";

export type GameState = "menu" | "playing" | "paused" | "dead" | "won";
export type WeaponType = "AK-47" | "Knife";
export type FireMode = "auto" | "semi" | "single";

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
  fireMode: FireMode;
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

const DEFAULT_STATS: GameStats = {
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
  fireMode: "auto",
};

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Detect ESC / pointer lock release → pause
  useEffect(() => {
    const handleLockChange = () => {
      if (!document.pointerLockElement && gameStateRef.current === "playing") {
        setGameState("paused");
      }
    };
    document.addEventListener("pointerlockchange", handleLockChange);
    return () => document.removeEventListener("pointerlockchange", handleLockChange);
  }, []);

  const startGame = useCallback(() => {
    setStats(DEFAULT_STATS);
    setGameState("playing");
  }, []);

  const requestLock = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    // Browser requires ~500ms after ESC before re-locking
    setTimeout(() => {
      canvas.requestPointerLock().catch(() => {
        // If still too soon, wait and retry once
        setTimeout(() => canvas.requestPointerLock().catch(() => {}), 400);
      });
    }, 200);
  }, []);

  const handleResume = useCallback(() => {
    setGameState("playing");
    requestLock();
  }, [requestLock]);

  const handleRestart = useCallback(() => {
    setStats(DEFAULT_STATS);
    setGameState("playing");
    requestLock();
  }, [requestLock]);

  const handleExit = useCallback(() => {
    document.exitPointerLock();
    setGameState("menu");
  }, []);

  const handleDied = useCallback(() => setGameState("dead"), []);
  const handleWon = useCallback(() => setGameState("won"), []);

  if (gameState === "menu") return <Menu onStart={startGame} />;
  if (gameState === "dead") return <GameOver won={false} score={stats.score} kills={stats.kills} onRestart={startGame} />;
  if (gameState === "won") return <GameOver won={true} score={stats.score} kills={stats.kills} onRestart={startGame} />;

  const isPaused = gameState === "paused";

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
            isPaused={isPaused}
          />
        </Canvas>
      </KeyboardControls>

      {!isPaused && <HUD stats={stats} />}

      {isPaused && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
