import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

export const ScoreGoalDisplay = () => {
  const levelScore = useGameStore((s) => s.levelScore);
  const levelGoal = useGameStore((s) => s.levelGoal);

  return (
    <View style={styles.container}>
      {/* Left: ZIEL (goal) */}
      <View style={styles.leftSection}>
        <Text style={styles.text}>ZIEL - {levelGoal}</Text>
      </View>

      {/* Right: STAND (current score) */}
      <View style={styles.rightSection}>
        <Text style={styles.text}>STAND - {levelScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    minHeight: 48,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 70,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 70,
    justifyContent: "flex-end",
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Bungee-Regular",
    letterSpacing: 0.5,
  },
});
