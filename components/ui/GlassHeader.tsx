import React from "react";
import { View, StyleSheet, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  FONT_FAMILY,
} from "../../constants/theme";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

export const GlassHeader = () => {
  const insets = useSafeAreaInsets();
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const money = useGameStore((s) => s.money);

  const levelNumber = currentLevelIndex + 1;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topRow,
          {
            paddingTop:
              Platform.OS === "ios" ? SPACING.sm : insets.top + SPACING.xs,
            paddingHorizontal: SPACING.containerPaddingHorizontal,
          },
        ]}
      >
        <View style={styles.levelContainer}>
          <GameText variant="bodySmall" style={styles.levelLabel}>
            LEVEL
          </GameText>
          <GameText variant="displaySmall" color={COLORS.cyan}>
            {levelNumber}
          </GameText>
        </View>

        <View style={styles.moneyContainer}>
          <Image
            source={require("../../assets/icons/coin.png")}
            style={styles.coinIcon}
          />
          <GameText variant="displaySmall" style={styles.moneyValue}>
            {formatNumber(money)}
          </GameText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: SPACING.sm,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.iconGapMedium,
  },
  levelLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  moneyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.iconGapMedium,
  },
  coinIcon: {
    width: DIMENSIONS.iconSize.md,
    height: DIMENSIONS.iconSize.md,
  },
  moneyValue: {
    color: COLORS.gold,
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
