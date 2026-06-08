import { useState, useEffect } from "react";
import { GameStats } from "./Game";

interface HUDProps {
  stats: GameStats;
}

export default function HUD({ stats }: HUDProps) {
  const healthColor = stats.health > 50 ? "#00ff88" : stats.health > 25 ? "#ffaa00" : "#ff3344";
  const isKnife = stats.weapon === "Knife";
  const isLowHealth = stats.health <= 30;

  // Damage vignette
  const [damageVignette, setDamageVignette] = useState(false);
  useEffect(() => {
    if (stats.damageFlash > 0) {
      setDamageVignette(true);
      const t = setTimeout(() => setDamageVignette(false), 400);
      return () => clearTimeout(t);
    }
  }, [stats.damageFlash]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", fontFamily: "'Segoe UI', sans-serif", color: "#fff" }}>

      {/* Damage vignette overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: damageVignette
          ? "radial-gradient(ellipse at center, transparent 30%, rgba(200,0,0,0.55) 100%)"
          : "transparent",
        transition: "background 0.08s ease",
        pointerEvents: "none",
        zIndex: 10,
      }} />

      {/* Low health pulse vignette */}
      {isLowHealth && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.28) 100%)",
          animation: "lowHealthPulse 1s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 9,
        }} />
      )}

      {/* Crosshair */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "22px",
        height: "22px",
      }}>
        {isKnife ? (
          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            border: "2px solid #ffcc44",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 6px #ffcc44",
          }} />
        ) : (
          <>
            {/* Top */}
            <div style={{ position: "absolute", left: "50%", top: "0", width: "2px", height: "7px", background: "#00ff88", transform: "translateX(-50%)" }} />
            {/* Bottom */}
            <div style={{ position: "absolute", left: "50%", bottom: "0", width: "2px", height: "7px", background: "#00ff88", transform: "translateX(-50%)" }} />
            {/* Left */}
            <div style={{ position: "absolute", top: "50%", left: "0", width: "7px", height: "2px", background: "#00ff88", transform: "translateY(-50%)" }} />
            {/* Right */}
            <div style={{ position: "absolute", top: "50%", right: "0", width: "7px", height: "2px", background: "#00ff88", transform: "translateY(-50%)" }} />
          </>
        )}
      </div>

      {/* Round indicator - top center */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "8px 20px",
      }}>
        <span style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", textTransform: "uppercase" }}>Round</span>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#ff6a00" }}>{stats.round}</span>
        <span style={{ fontSize: "14px", color: "#444" }}>/</span>
        <span style={{ fontSize: "14px", color: "#555" }}>{stats.totalRounds}</span>
        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />
        <span style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", textTransform: "uppercase" }}>Score</span>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{stats.score.toLocaleString()}</span>
      </div>

      {/* Kill feed - top right */}
      {stats.kills > 0 && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,106,0,0.3)",
          borderRadius: "6px",
          padding: "6px 14px",
        }}>
          <span style={{ fontSize: "11px", color: "#888", letterSpacing: "1px", textTransform: "uppercase" }}>Kills</span>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#ff6a00" }}>{stats.kills}</span>
        </div>
      )}

      {/* Weapon switcher - bottom center */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "8px",
        alignItems: "center",
      }}>
        {(["AK-47", "Knife"] as const).map((w) => (
          <div key={w} style={{
            background: stats.weapon === w ? "rgba(255,106,0,0.2)" : "rgba(0,0,0,0.4)",
            border: `1px solid ${stats.weapon === w ? "#ff6a00" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "5px",
            padding: "5px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            transition: "all 0.15s ease",
            boxShadow: stats.weapon === w ? "0 0 10px rgba(255,106,0,0.25)" : "none",
          }}>
            <span style={{ fontSize: "14px" }}>{w === "AK-47" ? "🔫" : "🔪"}</span>
            <span style={{ fontSize: "9px", color: stats.weapon === w ? "#ff6a00" : "#555", letterSpacing: "1px", textTransform: "uppercase" }}>{w}</span>
          </div>
        ))}
        <span style={{ fontSize: "10px", color: "#444", letterSpacing: "1px" }}>Q</span>
      </div>

      {/* Bottom left — Health & Armor */}
      <div style={{ position: "absolute", bottom: "24px", left: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", width: "12px" }}>♥</div>
          <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${stats.health}%`, height: "100%", background: healthColor, transition: "width 0.15s ease", borderRadius: "2px" }} />
          </div>
          <span style={{
            fontSize: "18px",
            fontWeight: 700,
            color: healthColor,
            minWidth: "36px",
            animation: isLowHealth ? "lowHealthPulse 1s ease-in-out infinite" : "none",
          }}>
            {stats.health}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", width: "12px" }}>⬡</div>
          <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${stats.armor}%`, height: "100%", background: "#4488ff", transition: "width 0.15s ease", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#4488ff", minWidth: "36px" }}>{stats.armor}</span>
        </div>
      </div>

      {/* Bottom right — Weapon, Fire Mode & Ammo */}
      <div style={{ position: "absolute", bottom: "24px", right: "24px", textAlign: "right" }}>
        {/* Weapon name */}
        <div style={{
          fontSize: "11px",
          color: isKnife ? "#ffcc44" : "#666",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "6px",
          transition: "color 0.2s",
        }}>
          {stats.weapon}
        </div>

        {/* Fire mode selector (AK-47 only) */}
        {!isKnife && (
          <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", marginBottom: "8px" }}>
            {(["auto", "semi", "single"] as const).map(mode => {
              const labels = { auto: "AUTO", semi: "SEMI", single: "ÚNICO" };
              const colors = { auto: "#ff4444", semi: "#ffaa00", single: "#44aaff" };
              const isActive = stats.fireMode === mode;
              return (
                <div key={mode} style={{
                  padding: "2px 7px",
                  borderRadius: "3px",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  border: `1px solid ${isActive ? colors[mode] : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? `${colors[mode]}22` : "rgba(0,0,0,0.3)",
                  color: isActive ? colors[mode] : "#444",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? `0 0 6px ${colors[mode]}55` : "none",
                }}>
                  {labels[mode]}
                </div>
              );
            })}
            <div style={{ fontSize: "9px", color: "#333", letterSpacing: "1px", alignSelf: "center", marginLeft: "4px" }}>F</div>
          </div>
        )}

        {isKnife ? (
          <div style={{ fontSize: "13px", color: "#ffcc44", letterSpacing: "2px", textTransform: "uppercase" }}>
            Click to stab
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", justifyContent: "flex-end" }}>
              <span style={{
                fontSize: "36px",
                fontWeight: 800,
                color: stats.ammo <= 5 ? "#ff3344" : "#fff",
                lineHeight: 1,
                transition: "color 0.2s",
                animation: stats.ammo <= 5 && stats.ammo > 0 ? "lowHealthPulse 0.8s ease-in-out infinite" : "none",
              }}>
                {stats.ammo}
              </span>
              <span style={{ fontSize: "16px", color: "#555", marginBottom: "2px" }}>/</span>
              <span style={{ fontSize: "18px", color: "#666" }}>{stats.totalAmmo}</span>
            </div>
            {stats.isReloading && (
              <div style={{ fontSize: "11px", color: "#ffaa00", letterSpacing: "3px", textTransform: "uppercase", animation: "reloadPulse 0.5s ease-in-out infinite" }}>
                Reloading...
              </div>
            )}
            {stats.ammo === 0 && !stats.isReloading && (
              <div style={{ fontSize: "11px", color: "#ff3344", letterSpacing: "2px", textTransform: "uppercase" }}>
                Press R to reload
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes reloadPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes lowHealthPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
