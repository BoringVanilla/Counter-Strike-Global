import React, { useState, useCallback } from "react";
import MenuScreen from "./MenuScreen";
import GameCanvas from "./GameCanvas";
import GameOverScreen from "./GameOverScreen";

type GameState = "menu" | "playing" | "dead";

interface DeathStats {
  score: number;
  kills: number;
  wave: number;
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [deathStats, setDeathStats] = useState<DeathStats>({ score: 0, kills: 0, wave: 1 });
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState("playing");
  }, []);

  const handleDeath = useCallback((stats: DeathStats) => {
    setDeathStats(stats);
    setGameState("dead");
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState("playing");
  }, []);

  if (gameState === "menu") return <MenuScreen onStart={handleStart} />;
  if (gameState === "dead") return <GameOverScreen score={deathStats.score} kills={deathStats.kills} wave={deathStats.wave} onRestart={handleRestart} />;
  return <GameCanvas key={gameKey} onDeath={handleDeath} />;
}
