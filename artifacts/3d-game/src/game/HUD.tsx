import { GameStats } from "./Game";

interface HUDProps {
  stats: GameStats;
}

export default function HUD({ stats }: HUDProps) {
  const healthColor = stats.health > 50 ? "#00ff88" : stats.health > 25 ? "#ffaa00" : "#ff3344";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
    }}>
      {/* Crosshair */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "20px",
        height: "20px",
      }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: "2px", height: "10px", background: "#00ff88", transform: "translate(-50%, -50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: "10px", height: "2px", background: "#00ff88", transform: "translate(-50%, -50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: "4px", height: "4px", borderRadius: "50%", border: "1.5px solid #00ff88", transform: "translate(-50%, -50%)", background: "transparent" }} />
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

      {/* Bottom left - Health & Armor */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}>
        {/* Health */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", letterSpacing: "1px", width: "12px" }}>♥</div>
          <div style={{
            width: "120px",
            height: "4px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${stats.health}%`,
              height: "100%",
              background: healthColor,
              transition: "width 0.15s ease",
              borderRadius: "2px",
            }} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: healthColor, minWidth: "36px" }}>{stats.health}</span>
        </div>

        {/* Armor */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", letterSpacing: "1px", width: "12px" }}>⬡</div>
          <div style={{
            width: "120px",
            height: "4px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${stats.armor}%`,
              height: "100%",
              background: "#4488ff",
              transition: "width 0.15s ease",
              borderRadius: "2px",
            }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#4488ff", minWidth: "36px" }}>{stats.armor}</span>
        </div>
      </div>

      {/* Bottom right - Weapon & Ammo */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        right: "24px",
        textAlign: "right",
      }}>
        <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          {stats.weapon}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", justifyContent: "flex-end" }}>
          <span style={{
            fontSize: "36px",
            fontWeight: 800,
            color: stats.ammo <= 5 ? "#ff3344" : "#fff",
            lineHeight: 1,
            transition: "color 0.2s",
          }}>
            {stats.ammo}
          </span>
          <span style={{ fontSize: "16px", color: "#555", marginBottom: "2px" }}>/</span>
          <span style={{ fontSize: "18px", color: "#666" }}>{stats.totalAmmo}</span>
        </div>
        {stats.isReloading && (
          <div style={{
            fontSize: "11px",
            color: "#ffaa00",
            letterSpacing: "3px",
            textTransform: "uppercase",
            animation: "pulse 0.6s ease-in-out infinite",
          }}>
            Reloading...
          </div>
        )}
        {stats.ammo === 0 && !stats.isReloading && (
          <div style={{
            fontSize: "11px",
            color: "#ff3344",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Press R to reload
          </div>
        )}
      </div>

      {/* Hit indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
