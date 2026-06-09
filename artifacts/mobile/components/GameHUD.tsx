import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  health: number;
  armor: number;
  ammo: number;
  totalAmmo: number;
  kills: number;
  score: number;
  wave: number;
  weapon: "AK-47" | "Knife";
  isReloading: boolean;
  fireMode: "auto" | "semi" | "single";
}

export default function GameHUD({ health, armor, ammo, totalAmmo, kills, score, wave, weapon, isReloading, fireMode }: Props) {
  const insets = useSafeAreaInsets();
  const healthColor = health > 50 ? "#00ff88" : health > 25 ? "#ffaa00" : "#ff3344";
  const isKnife = weapon === "Knife";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad + 4, pointerEvents: "none" }]}>
      <View style={styles.row}>
        {/* Left: Health & Armor */}
        <View style={styles.statsBlock}>
          <View style={styles.statRow}>
            <Text style={[styles.icon, { color: healthColor }]}>♥</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${health}%` as any, backgroundColor: healthColor }]} />
            </View>
            <Text style={[styles.statValue, { color: healthColor }]}>{health}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.icon, { color: "#4488ff" }]}>⬡</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${armor}%` as any, backgroundColor: "#4488ff" }]} />
            </View>
            <Text style={[styles.statValue, { color: "#4488ff" }]}>{armor}</Text>
          </View>
        </View>

        {/* Center: Wave + Score */}
        <View style={styles.centerBlock}>
          <View style={styles.waveRow}>
            <Text style={styles.label}>WAVE</Text>
            <Text style={styles.waveNum}>{wave}</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>SCORE</Text>
            <Text style={styles.scoreNum}>{score.toLocaleString()}</Text>
          </View>
        </View>

        {/* Right: Ammo + Weapon */}
        <View style={styles.ammoBlock}>
          <Text style={styles.weaponName}>{weapon}</Text>
          {!isKnife && (
            <View style={styles.fireModeRow}>
              {(["auto", "semi", "single"] as const).map(m => {
                const modeColors = { auto: "#ff4444", semi: "#ffaa00", single: "#44aaff" };
                const modeLabels = { auto: "A", semi: "S", single: "M" };
                return (
                  <View key={m} style={[styles.modeTag, fireMode === m && { backgroundColor: `${modeColors[m]}33`, borderColor: modeColors[m] }]}>
                    <Text style={[styles.modeText, fireMode === m && { color: modeColors[m] }]}>{modeLabels[m]}</Text>
                  </View>
                );
              })}
            </View>
          )}
          {isKnife ? (
            <Text style={styles.knifeHint}>FACA</Text>
          ) : (
            <Text style={[styles.ammoMain, ammo <= 5 && { color: "#ff3344" }]}>{ammo}<Text style={styles.ammoSub}>/{totalAmmo}</Text></Text>
          )}
          {isReloading && <Text style={styles.reloadText}>RECARREGANDO...</Text>}
          {kills > 0 && (
            <View style={styles.killsBadge}>
              <Text style={styles.killsLabel}>ABATES</Text>
              <Text style={styles.killsValue}>{kills}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  statsBlock: {
    gap: 4,
    minWidth: 130,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  icon: {
    fontSize: 11,
    width: 12,
  },
  barTrack: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    minWidth: 28,
  },
  centerBlock: {
    alignItems: "center",
    flex: 1,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  label: {
    fontSize: 9,
    color: "#666",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  waveNum: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: "#ff6a00",
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 2,
  },
  scoreNum: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  ammoBlock: {
    alignItems: "flex-end",
    minWidth: 110,
  },
  weaponName: {
    fontSize: 9,
    color: "#666",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fireModeRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 3,
  },
  modeTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modeText: {
    fontSize: 8,
    fontWeight: "700" as const,
    color: "#444",
    letterSpacing: 0.5,
  },
  ammoMain: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
    lineHeight: 32,
  },
  ammoSub: {
    fontSize: 14,
    color: "#555",
    fontWeight: "400" as const,
  },
  knifeHint: {
    fontSize: 13,
    color: "#ffcc44",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  reloadText: {
    fontSize: 9,
    color: "#ffaa00",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  killsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  killsLabel: {
    fontSize: 8,
    color: "#666",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  killsValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#ff6a00",
  },
});
