import React from "react";
import { View, StyleSheet, Platform, Image } from "react-native";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { GameText } from "../shared";
import { Surface, InsetSlot } from "../ui-kit";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { useLayout } from "../../utils/LayoutContext";

export const GlassHeader = () => {
  const layout = useLayout();
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const money = useGameStore((s) => s.money);

  const levelNumber = currentLevelIndex + 1;

  // Header gets explicit height from layout, plus safe area padding at top
  const headerStyle = {
    height: layout.headerHeight + layout.insets.top,
    paddingTop: layout.insets.top,
  };

  return (
    <View style={[styles.container, headerStyle]}>
      {/* Left Pod: Level */}
      <Surface variant="panel" padding="none" style={styles.pod}>
        <GameText
          variant="body"
          color={COLORS.textMuted}
          style={styles.podLabel}
        >
          LV
        </GameText>
        <InsetSlot padding="none" style={styles.valueInset}>
          <GameText variant="displaySmall" color={COLORS.cyan}>
            {levelNumber}
          </GameText>
        </InsetSlot>
      </Surface>

      {/* Right Pod: Currency */}
      <Surface variant="panel" padding="none" style={styles.pod}>
        <Image
          source={require("../../assets/icons/coin.png")}
          style={styles.coinIcon}
        />
        <InsetSlot padding="none" style={styles.valueInset}>
          <GameText variant="displaySmall" color={COLORS.gold}>
            {formatNumber(money)}
          </GameText>
        </InsetSlot>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    // Height and paddingTop set via inline style from layout
  },
  pod: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  podLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  valueInset: {
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  coinIcon: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
  },
});
