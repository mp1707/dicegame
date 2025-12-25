import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

export const GlassHeader = () => {
  const round = useGameStore((s) => s.round);
  const currentScore = useGameStore((s) => s.currentScore);
  const targetScore = useGameStore((s) => s.targetScore);
  const money = useGameStore((s) => s.money);

  const progressPercent = Math.min((currentScore / targetScore) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Top Row: Round and Money */}
      <View style={styles.topRow}>
        <Text style={styles.roundText}>Runde {round}/13</Text>
        <Text style={styles.moneyText}>${formatNumber(money)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />

        {/* Score Labels */}
        <View style={styles.progressLabels}>
          <View style={styles.labelLeft}>
            <Text style={styles.labelMicro}>STAND</Text>
            <Text style={styles.scoreValue}>{formatNumber(currentScore)}</Text>
          </View>
          <View style={styles.labelRight}>
            <Text style={styles.labelMicro}>ZIEL</Text>
            <Text style={styles.targetValue}>{formatNumber(targetScore)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkBg,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: SPACING.containerPaddingVertical,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roundText: {
    color: COLORS.textLight,
    ...TYPOGRAPHY.metaInfo,
  },
  moneyText: {
    color: COLORS.gold,
    ...TYPOGRAPHY.metaInfo,
    fontWeight: "700",
  },
  progressContainer: {
    height: DIMENSIONS.progressBarHeight,
    backgroundColor: "#1A1A1F",
    borderRadius: 4,
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
    color: COLORS.textMuted,
    ...TYPOGRAPHY.microLabels,
  },
  scoreValue: {
    color: COLORS.textBlack,
    ...TYPOGRAPHY.smallScore,
  },
  targetValue: {
    color: COLORS.textLight,
    ...TYPOGRAPHY.smallScore,
  },
});
