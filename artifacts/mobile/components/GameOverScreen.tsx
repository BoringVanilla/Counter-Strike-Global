import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  score: number;
  kills: number;
  wave: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, kills, wave, onRestart }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <LinearGradient colors={["#1a0808", "#2a0d0d", "#1a0808"]} style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.content}>
        <Text style={styles.defeatLabel}>DERROTA</Text>
        <Text style={styles.title}>ABATIDO</Text>

        <View style={styles.statsRow}>
          {[
            { label: "Pontos", value: score.toLocaleString() },
            { label: "Abates", value: kills },
            { label: "Ondas", value: wave },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={onRestart} style={styles.btn} activeOpacity={0.8}>
          <LinearGradient colors={["#ff3344", "#cc0022"]} style={styles.btnGrad}>
            <Text style={styles.btnText}>JOGAR NOVAMENTE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 0,
  },
  defeatLabel: {
    fontSize: 11,
    color: "#ff3344",
    letterSpacing: 6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 52,
    fontWeight: "900" as const,
    color: "#ff3344",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 36,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  btn: {
    borderRadius: 4,
    overflow: "hidden",
    elevation: 8,
  },
  btnGrad: {
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  btnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 4,
  },
});
