interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseMenu({ onResume, onRestart, onExit }: PauseMenuProps) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 100,
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* CS2-style panel */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        background: "rgba(10, 14, 20, 0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
        overflow: "hidden",
        width: "320px",
        boxShadow: "0 0 40px rgba(0,0,0,0.8)",
      }}>
        {/* Header */}
        <div style={{
          width: "100%",
          padding: "20px 0",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#ff6a00", textTransform: "uppercase", fontWeight: 600 }}>
            PAUSADO
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#fff", marginTop: "6px", letterSpacing: "2px" }}>
            CS2
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "12px 24px 20px" }}>
          <PauseButton onClick={onResume} primary label="Continuar Jogando" icon="▶" />
          <PauseButton onClick={onRestart} label="Reiniciar o Jogo" icon="↺" />
          <PauseButton onClick={onExit} label="Sair" icon="✕" danger />
        </div>
      </div>

      <div style={{ marginTop: "16px", fontSize: "11px", color: "#444", letterSpacing: "1px" }}>
        Pressione ESC ou clique em Continuar para retomar
      </div>
    </div>
  );
}

interface BtnProps {
  onClick: () => void;
  label: string;
  icon: string;
  primary?: boolean;
  danger?: boolean;
}

function PauseButton({ onClick, label, icon, primary, danger }: BtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "14px 16px",
        marginTop: "8px",
        background: primary
          ? "linear-gradient(135deg, #ff6a00, #ee0979)"
          : danger
            ? "rgba(200, 30, 30, 0.15)"
            : "rgba(255,255,255,0.04)",
        border: primary
          ? "1px solid rgba(255, 106, 0, 0.5)"
          : danger
            ? "1px solid rgba(200, 30, 30, 0.3)"
            : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "3px",
        color: primary ? "#fff" : danger ? "#ff4444" : "#ccc",
        fontSize: "13px",
        fontWeight: primary ? 700 : 500,
        letterSpacing: "1px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        textTransform: "uppercase",
        fontFamily: "'Segoe UI', sans-serif",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        if (primary) {
          el.style.filter = "brightness(1.15)";
        } else if (danger) {
          el.style.background = "rgba(200, 30, 30, 0.28)";
          el.style.color = "#ff6666";
        } else {
          el.style.background = "rgba(255,255,255,0.09)";
          el.style.color = "#fff";
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        if (primary) {
          el.style.filter = "";
        } else if (danger) {
          el.style.background = "rgba(200, 30, 30, 0.15)";
          el.style.color = "#ff4444";
        } else {
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.color = "#ccc";
        }
      }}
    >
      <span style={{ fontSize: "16px", opacity: 0.7, width: "20px", textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}
