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
            {/* Top Bevel Highlight */}
            <View style={styles.progressBarHighlight} />

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
    width: "100%",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 12,
    marginTop: 4,
    // Dark strip/panel vibe
    backgroundColor: "rgba(0,0,0,0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  bossBar: {
    flexDirection: "row",
    alignItems: "flex-end", // Align baselines
    justifyContent: "space-between",
    gap: 12,
  },
  statBlock: {
    minWidth: 70,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter-Medium",
    textTransform: "uppercase",
    letterSpacing: 1.5, // +15-20 range (~1.5-2px)
    opacity: 0.8,
    marginBottom: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 36, // 36-44pt
    fontFamily: "Bungee-Regular", // Display font
    lineHeight: 36, // Tight line height for Bungee
    // tabular-nums is handled by font variant if supported, or monospace fallback
    fontVariant: ["tabular-nums"],
  },
  progressContainer: {
    flex: 1,
    height: 40, // Container height to align with big numbers
    justifyContent: "center",
    paddingBottom: 4, // Visual alignment correction
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.3)", // Slightly lighter/darker track
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.gold, // Gold fill
  },
  // Fake bevel highlight on top
  progressBarHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tickMk: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2, // Slightly thicker for "lamps" vibe
    backgroundColor: "rgba(0,0,0,0.2)", // Dark ticks on gold looks cool
    zIndex: 2,
  },
});
