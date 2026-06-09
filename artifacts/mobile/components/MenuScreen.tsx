import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  onStart: () => void;
}

const CONTROLS = [
  ["Joystick Esq.", "Mover"],
  ["Arraste Dir.", "Girar câmera"],
  ["FIRE", "Atirar"],
  ["🔪 / 🔫", "Trocar arma"],
  ["↺", "Recarregar"],
  ["↑", "Pular"],
];

export default function MenuScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const sidePad = Platform.OS === "web" ? 20 : Math.max(insets.left, insets.right, 16);

  return (
    <LinearGradient colors={["#0a0c10", "#0f1520", "#0a0c10"]} style={[styles.container, { paddingTop: topPad, paddingLeft: sidePad, paddingRight: sidePad }]}>
      <View style={styles.glow} />

      <View style={styles.leftPanel}>
        <Text style={styles.subtitle}>COUNTER-STRIKE 2</Text>
        <Text style={styles.title}>CS2</Text>
        <Text style={styles.titleSub}>MOBILE</Text>
        <Text style={styles.desc}>Ondas infinitas de inimigos.{"\n"}5 novos a cada 25 segundos.</Text>

        <TouchableOpacity onPress={onStart} style={styles.playBtn} activeOpacity={0.8}>
          <LinearGradient colors={["#ff6a00", "#ee0979"]} style={styles.playBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.playText}>JOGAR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.controlsTitle}>CONTROLES</Text>
        {CONTROLS.map(([key, action]) => (
          <View key={key} style={styles.controlRow}>
            <Text style={styles.controlKey}>{key}</Text>
            <Text style={styles.controlAction}>{action}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 20,
    gap: 40,
  },
  glow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,100,0,0.04)",
    transform: [{ translateX: -150 }, { translateY: -150 }],
  },
  leftPanel: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#ff6a00",
    letterSpacing: 6,
    textTransform: "uppercase",
    fontWeight: "600" as const,
  },
  title: {
    fontSize: 56,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: 4,
    lineHeight: 58,
    textTransform: "uppercase",
  },
  titleSub: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#555",
    letterSpacing: 8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  desc: {
    fontSize: 12,
    color: "#555",
    letterSpacing: 1,
    lineHeight: 18,
    marginBottom: 16,
  },
  playBtn: {
    borderRadius: 4,
    overflow: "hidden",
    elevation: 8,
  },
  playBtnGrad: {
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  playText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 5,
  },
  rightPanel: {
    width: 220,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: 16,
    gap: 2,
  },
  controlsTitle: {
    fontSize: 10,
    color: "#ff6a00",
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  controlKey: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: "600" as const,
  },
  controlAction: {
    fontSize: 12,
    color: "#666",
  },
});
