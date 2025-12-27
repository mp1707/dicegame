import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

export const GlassHeader = () => {
  const insets = useSafeAreaInsets();
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const money = useGameStore((s) => s.money);
  const levelScore = useGameStore((s) => s.levelScore);
  const levelGoal = useGameStore((s) => s.levelGoal);
  const handsRemaining = useGameStore((s) => s.handsRemaining);

  const levelNumber = currentLevelIndex + 1;

  return (
    <View style={styles.container}>
      {/* Row 1: Level + Money (overlays notch area) */}
      <View
        style={[
          styles.topRow,
          {
            paddingTop: Platform.OS === "ios" ? 8 : insets.top + 4,
            // Leave space in center for notch/Dynamic Island
            paddingHorizontal: SPACING.containerPaddingHorizontal,
          },
        ]}
      >
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <Text style={styles.levelValue}>{levelNumber}</Text>
        </View>

        <View style={styles.handsContainer}>
          <Text style={styles.handsLabel}>HANDS</Text>
          <Text style={styles.handsValue}>{handsRemaining}</Text>
        </View>

        <View style={styles.moneyContainer}>
          <Text style={styles.moneyValue}>${formatNumber(money)}</Text>
        </View>
      </View>

      {/* Row 2: Score + Goal (in safe area) */}
      <View style={styles.scoreRow}>
        {/* Left: STAND (current score) */}
        <View style={styles.statBlock}>
          <Text style={styles.label}>STAND</Text>
          <Text style={styles.value}>{levelScore}</Text>
        </View>

        {/* Right: ZIEL (goal) */}
        <View style={[styles.statBlock, { alignItems: "flex-end" }]}>
          <Text style={styles.label}>ZIEL</Text>
          <Text style={styles.value}>{levelGoal}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  // Row 1: Level + Money
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  levelValue: {
    color: COLORS.cyan,
    fontSize: 20,
    fontFamily: "Bungee-Regular",
  },
  handsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  handsLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "Inter-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  handsValue: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Bungee-Regular",
  },
  moneyContainer: {
    alignItems: "flex-end",
  },
  moneyValue: {
    color: COLORS.gold,
    fontSize: 20,
    fontFamily: "Bungee-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  // Row 2: Score display
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
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
    letterSpacing: 1.5,
    opacity: 0.8,
    marginBottom: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 36,
    fontFamily: "Bungee-Regular",
    lineHeight: 36,
    fontVariant: ["tabular-nums"],
  },
});
