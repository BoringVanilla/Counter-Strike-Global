import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, PanResponder } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  weapon: "AK-47" | "Knife";
  isReloading: boolean;
  ammo: number;
  onShootStart: () => void;
  onShootEnd: () => void;
  onKnife: () => void;
  onReload: () => void;
  onSwitch: () => void;
  onJump: () => void;
}

export default function ActionButtons({
  weapon, isReloading, ammo,
  onShootStart, onShootEnd, onKnife, onReload, onSwitch, onJump,
}: Props) {
  const fireResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => onShootStart(),
      onPanResponderRelease: () => onShootEnd(),
      onPanResponderTerminate: () => onShootEnd(),
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.smallBtn} onPress={onJump} activeOpacity={0.6}>
          <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={onReload} activeOpacity={0.6} disabled={isReloading}>
          <MaterialCommunityIcons name="reload" size={20} color={isReloading ? "#888" : "#ffaa00"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={onSwitch} activeOpacity={0.6}>
          <Text style={styles.switchLabel}>{weapon === "AK-47" ? "🔪" : "🔫"}</Text>
        </TouchableOpacity>
        {weapon === "Knife" && (
          <TouchableOpacity style={[styles.smallBtn, styles.knifeBtn]} onPress={onKnife} activeOpacity={0.6}>
            <MaterialCommunityIcons name="knife" size={22} color="#ffcc44" />
          </TouchableOpacity>
        )}
      </View>
      {weapon === "AK-47" ? (
        <View
          style={[styles.fireBtn, ammo === 0 && styles.fireBtnEmpty]}
          {...fireResponder.panHandlers}
        >
          <Ionicons name="flash" size={32} color="#fff" />
          <Text style={styles.fireLabel}>FIRE</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.fireBtn, styles.fireBtnKnife]}
          onPress={onKnife}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="knife" size={32} color="#ffcc44" />
          <Text style={[styles.fireLabel, { color: "#ffcc44" }]}>FACA</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    gap: 10,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  smallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  knifeBtn: {
    backgroundColor: "rgba(255,204,68,0.15)",
    borderColor: "rgba(255,204,68,0.4)",
  },
  switchLabel: {
    fontSize: 18,
  },
  fireBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(220,30,30,0.85)",
    borderWidth: 3,
    borderColor: "rgba(255,80,80,0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  fireBtnEmpty: {
    backgroundColor: "rgba(120,30,30,0.6)",
    borderColor: "rgba(180,80,80,0.4)",
  },
  fireBtnKnife: {
    backgroundColor: "rgba(120,100,0,0.7)",
    borderColor: "rgba(255,204,68,0.5)",
  },
  fireLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 2,
  },
});
