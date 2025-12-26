import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

// Mock progress for now or calculate from store if available.
// Assuming "Ziel" is a target score for the level/round.
// Since it's a "Boss Bar", it usually implies Health vs Boss, but here it's likely Score vs Target.

export const GlassHeader = () => {
  const currentScore = useGameStore((s) => s.currentScore);
  const targetScore = useGameStore((s) => s.targetScore);
  const progress = Math.min(Math.max(currentScore / targetScore, 0), 1);

  return (
    <View style={styles.container}>
      <View style={styles.bossBar}>
        {/* Left: STAND */}
        <View style={styles.statBlock}>
          <Text style={styles.label}>STAND</Text>
          <Text style={styles.value}>{currentScore}</Text>
        </View>

        {/* Middle: Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
            {/* Ticks/Grid lines on progress bar */}
            {Array.from({ length: 9 }).map((_, i) => (
              <View
                key={i}
                style={[styles.tickMk, { left: `${(i + 1) * 10}%` }]}
              />
            ))}
          </View>
        </View>

        {/* Right: ZIEL */}
        <View style={[styles.statBlock, { alignItems: "flex-end" }]}>
          <Text style={styles.label}>ZIEL</Text>
          <Text style={styles.value}>{targetScore}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 12,
    marginTop: 4,
  },
  bossBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statBlock: {
    minWidth: 60,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "PressStart2P-Regular", // Use retro font for labels if available, or fallback
    marginBottom: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "RobotoMono-Regular",
    fontWeight: "700",
  },
  progressContainer: {
    flex: 1,
    height: 14,
    justifyContent: "center",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.amber,
  },
  tickMk: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.bg,
    opacity: 0.5,
  },
});
