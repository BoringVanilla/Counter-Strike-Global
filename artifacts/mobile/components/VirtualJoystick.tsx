import React, { useRef } from "react";
import { PanResponder, View, StyleSheet } from "react-native";

interface Props {
  onMove: (dx: number, dy: number) => void;
  size?: number;
}

const JOYSTICK_RADIUS = 55;
const KNOB_RADIUS = 22;

export default function VirtualJoystick({ onMove, size = JOYSTICK_RADIUS }: Props) {
  const knobPos = useRef({ x: 0, y: 0 });
  const knobRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        knobPos.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_, gs) => {
        const dist = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        const maxDist = size - KNOB_RADIUS;
        const clamped = Math.min(dist, maxDist);
        const angle = Math.atan2(gs.dy, gs.dx);
        const kx = Math.cos(angle) * clamped;
        const ky = Math.sin(angle) * clamped;
        knobPos.current = { x: kx, y: ky };
        if (knobRef.current) {
          knobRef.current.setNativeProps({
            style: {
              transform: [{ translateX: kx }, { translateY: ky }],
            },
          });
        }
        const nx = dist < 2 ? 0 : (kx / maxDist);
        const ny = dist < 2 ? 0 : (ky / maxDist);
        onMove(nx, ny);
      },
      onPanResponderRelease: () => {
        knobPos.current = { x: 0, y: 0 };
        if (knobRef.current) {
          knobRef.current.setNativeProps({
            style: { transform: [{ translateX: 0 }, { translateY: 0 }] },
          });
        }
        onMove(0, 0);
      },
      onPanResponderTerminate: () => {
        onMove(0, 0);
      },
    })
  ).current;

  return (
    <View style={[styles.outer, { width: size * 2, height: size * 2, borderRadius: size }]} {...panResponder.panHandlers}>
      <View ref={knobRef} style={[styles.knob, { width: KNOB_RADIUS * 2, height: KNOB_RADIUS * 2, borderRadius: KNOB_RADIUS }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    backgroundColor: "rgba(255,106,0,0.7)",
    borderWidth: 2,
    borderColor: "rgba(255,150,50,0.9)",
  },
});
