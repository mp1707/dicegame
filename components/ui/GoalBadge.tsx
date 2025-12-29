import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { Surface } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { formatCompactNumber } from "../../utils/formatting";

/**
 * GoalBadge - Displays the level goal at the top of the dice tray
 * Positioned absolutely in the center-top of the 3D dice area
 */
export const GoalBadge = () => {
  const levelGoal = useGameStore((s) => s.levelGoal);

  return (
    <View style={styles.container}>
      <Surface variant="chip" padding="none" style={styles.badge}>
        <GameText variant="labelSmall" color={COLORS.text}>
          Goal:
        </GameText>
        <GameText variant="scoreboardSmall" color={COLORS.gold}>
          {formatCompactNumber(levelGoal)}
        </GameText>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: SPACING.sm,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
});
