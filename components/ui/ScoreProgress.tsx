import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

export const ScoreProgress = () => {
  const currentScore = useGameStore((s) => s.currentScore);
  const targetScore = useGameStore((s) => s.targetScore);

  const progressPercent =
    targetScore > 0 ? Math.min((currentScore / targetScore) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />

        <View style={styles.progressLabels}>
          <View style={styles.labelLeft}>
            <Text style={styles.labelMicro}>STAND</Text>
            <Text style={styles.scoreValue}>{formatNumber(currentScore)}</Text>
          </View>
          <View style={styles.labelRight}>
            <Text style={styles.labelMicro}>ZIEL</Text>
            <Text style={styles.scoreValue}>{formatNumber(targetScore)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sectionGap,
    paddingBottom: SPACING.sectionGap,
  },
  progressContainer: {
    height: DIMENSIONS.rollButtonHeight - 8,
    backgroundColor: COLORS.slotBg,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.gold,
  },
  progressLabels: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  labelRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  labelMicro: {
    ...TYPOGRAPHY.label,
  },
  scoreValue: {
    ...TYPOGRAPHY.scoreValue,
  },
});
