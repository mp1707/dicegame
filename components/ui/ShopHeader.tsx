import React from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { GameText } from "../shared";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

const coinIcon = require("../../assets/icons/coin.png");

/**
 * ShopHeader - Header for shop panel with title and currency display
 *
 * Layout:
 * - Left: Title "ANGEBOTE" + Subline "4 zufällige Upgrades"
 * - Right: Currency capsule (coin icon + money amount)
 */
export const ShopHeader: React.FC = () => {
  const money = useGameStore((s) => s.money);

  return (
    <Animated.View
      entering={FadeIn.delay(ANIMATION.shop.headerDelay).duration(200)}
      style={styles.container}
    >
      {/* Left: Title + Subline */}
      <View style={styles.titleSection}>
        <GameText variant="displaySmall" color={COLORS.text}>
          ANGEBOTE
        </GameText>
        <GameText
          variant="bodySmall"
          color={COLORS.textMuted}
          style={styles.subline}
        >
          4 zufällige Upgrades
        </GameText>
      </View>

      {/* Right: Currency capsule */}
      <View style={styles.currencyCapsule}>
        <Image source={coinIcon} style={styles.coinIcon} resizeMode="contain" />
        <GameText variant="scoreboardSmall" color={COLORS.gold}>
          {money}
        </GameText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flexDirection: "column",
    gap: SPACING.xxs,
  },
  subline: {
    opacity: 0.8,
  },
  currencyCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    backgroundColor: COLORS.overlays.blackSubtle,
  },
  coinIcon: {
    width: 18,
    height: 18,
  },
});
