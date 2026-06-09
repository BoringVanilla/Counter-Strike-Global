import React from "react";
import { StyleSheet, View } from "react-native";
import Game from "@/components/Game";

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <Game />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0c10",
  },
});
