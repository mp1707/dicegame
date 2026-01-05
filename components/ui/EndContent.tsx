import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trophy } from "lucide-react-native";
import { GameText } from "../shared";
import { HUDCard, InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

/**
 * EndContent - Compact end screen for bottom panel slot
 *
 * Displays win/lose state with final stats.
 * CTA button handled by FooterControls.
 */
export const EndContent: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const money = useGameStore((s) => s.money);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);

  const isWin = phase === "WIN_SCREEN";
  const levelNumber = currentLevelIndex + 1;

  return (
    <View style={styles.container}>
      {/* Hero section */}
      <View style={styles.hero}>
        {isWin && (
          <View style={[styles.iconContainer, styles.iconContainerWin]}>
            <Trophy size={DIMENSIONS.iconSize.xl} color={COLORS.gold} />
          </View>
        )}

        {isWin && (
          <GameText
            variant="displayLarge"
            style={[styles.title, styles.titleWin]}
          >
            GEWONNEN!
          </GameText>
        )}

        <GameText variant="bodyMedium" color={COLORS.textMuted}>
          {isWin && "All 8 levels completed!"}
        </GameText>
      </View>

      {/* Stats section - New Layout with Insets */}
      <HUDCard style={styles.statsCard}>
        <View style={styles.statRow}>
          <GameText variant="bodyMedium" color={COLORS.textMuted}>
            Final Money
          </GameText>
          <InsetSlot style={styles.valueInset}>
            <Image
              source={require("../../assets/icons/coin.png")}
              style={styles.iconSm}
            />
            <GameText variant="scoreboardSmall" color={COLORS.gold}>
              {formatNumber(money)}
            </GameText>
          </InsetSlot>
        </View>

        <View style={styles.statRow}>
          <GameText variant="bodyMedium" color={COLORS.textMuted}>
            Levels Completed
          </GameText>
          <InsetSlot style={styles.valueInset}>
            <GameText variant="scoreboardSmall" color={COLORS.text}>
              {isWin ? 8 : currentLevelIndex} / 8
            </GameText>
          </InsetSlot>
        </View>
      </HUDCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "center",
    gap: SPACING.lg,
  },
  hero: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: DIMENSIONS.borderRadiusRound,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  iconContainerWin: {
    backgroundColor: COLORS.overlays.goldSubtle,
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.gold,
  },
  title: {
    textAlign: "center",
    letterSpacing: 2,
  },
  titleWin: {
    color: COLORS.gold,
    textShadowColor: COLORS.shadows.goldStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  statsCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 260,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
    height: 36, // Fixed height for alignment
  },
  valueInset: {
    width: "33%", // Take a third of the row
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  iconSm: {
    width: DIMENSIONS.iconSize.xs, // Slightly smaller than header
    height: DIMENSIONS.iconSize.xs,
    resizeMode: "contain",
  },
});
