interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, rgba(255,100,0,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{
          fontSize: "14px",
          letterSpacing: "8px",
          color: "#ff6a00",
          marginBottom: "8px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
          Counter-Strike 2
        </div>
        <h1 style={{
          fontSize: "72px",
          fontWeight: 900,
          letterSpacing: "4px",
          background: "linear-gradient(180deg, #ffffff 0%, #aaaaaa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 8px 0",
          textTransform: "uppercase",
        }}>
          CS2
        </h1>
        <div style={{
          fontSize: "14px",
          color: "#666",
          letterSpacing: "3px",
          marginBottom: "48px",
          textTransform: "uppercase",
        }}>
          Web Replica
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "24px 32px",
          marginBottom: "32px",
          maxWidth: "320px",
          textAlign: "left",
        }}>
          <div style={{ fontSize: "11px", color: "#ff6a00", letterSpacing: "2px", marginBottom: "12px", textTransform: "uppercase" }}>Controls</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <tbody>
              {[
                ["WASD", "Move"],
                ["Mouse", "Look around"],
                ["Left Click", "Shoot"],
                ["R", "Reload"],
                ["Space", "Jump"],
                ["Shift", "Sprint"],
              ].map(([key, action]) => (
                <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "6px 0", color: "#ccc", fontWeight: 600, paddingRight: "24px" }}>{key}</td>
                  <td style={{ padding: "6px 0", color: "#777" }}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "16px 24px",
          marginBottom: "40px",
          maxWidth: "320px",
          textAlign: "left",
          fontSize: "12px",
          color: "#555",
        }}>
          <div style={{ color: "#ff6a00", marginBottom: "6px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px" }}>Objective</div>
          Eliminate 5 rounds of enemies. Each round spawns more bots. 
          Survive all 5 rounds to win. You get 100hp + 100 armor per round.
        </div>

        <button
          onClick={onStart}
          style={{
            background: "linear-gradient(135deg, #ff6a00, #ee0979)",
            border: "none",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            padding: "16px 48px",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 24px rgba(255,106,0,0.3)",
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.transform = "scale(1.04)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(255,106,0,0.5)";
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.transform = "scale(1)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(255,106,0,0.3)";
          }}
        >
          Play
        </button>
      </div>
    </div>
  );
}
