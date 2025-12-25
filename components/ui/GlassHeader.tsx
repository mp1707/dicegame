import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

export const GlassHeader = () => {
  const round = useGameStore((s) => s.round);
  const money = useGameStore((s) => s.money);

  return (
    <View style={styles.container}>
      {/* Top Row: Round and Money */}
      <View style={styles.topRow}>
        <Text style={styles.roundText}>Runde {round}/13</Text>
        <Text style={styles.moneyText}>${formatNumber(money)}</Text>
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
});
