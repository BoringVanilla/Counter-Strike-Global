interface GameOverProps {
  won: boolean;
  score: number;
  kills: number;
  onRestart: () => void;
}

export default function GameOver({ won, score, kills, onRestart }: GameOverProps) {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: won
        ? "linear-gradient(135deg, #0a1a0a 0%, #0d2a1a 50%, #0a1a0a 100%)"
        : "linear-gradient(135deg, #1a0a0a 0%, #2a0d0d 50%, #1a0a0a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "6px",
          color: won ? "#00ff88" : "#ff3344",
          marginBottom: "12px",
          textTransform: "uppercase",
        }}>
          {won ? "Victory" : "Defeat"}
        </div>
        <h1 style={{
          fontSize: "64px",
          fontWeight: 900,
          letterSpacing: "2px",
          color: won ? "#00ff88" : "#ff3344",
          margin: "0 0 48px 0",
          textTransform: "uppercase",
          textShadow: won ? "0 0 40px rgba(0,255,136,0.4)" : "0 0 40px rgba(255,51,68,0.4)",
        }}>
          {won ? "MATCH WON" : "MATCH LOST"}
        </h1>

        <div style={{
          display: "flex",
          gap: "32px",
          marginBottom: "48px",
          justifyContent: "center",
        }}>
          {[
            { label: "Score", value: score.toLocaleString() },
            { label: "Kills", value: kills },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "20px 40px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#fff" }}>{value}</div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          style={{
            background: won ? "linear-gradient(135deg, #00ff88, #00cc66)" : "linear-gradient(135deg, #ff3344, #cc0022)",
            border: "none",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            padding: "16px 48px",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: won ? "0 4px 24px rgba(0,255,136,0.3)" : "0 4px 24px rgba(255,51,68,0.3)",
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
