import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trophy } from "lucide-react-native";
import { GameText } from "../shared";
import { Surface } from "../pixel-ui-kit";
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
      <Surface
        tintColor={COLORS.surface2}
        padding="md"
        style={styles.statsCard}
      >
        <View style={styles.cardContent}>
          {/* Top aligned stats */}
          <View style={styles.topStats}>
            <View style={styles.statRow}>
              <GameText variant="bodyMedium" color={COLORS.textMuted}>
                Levels Completed
              </GameText>
              <Surface
                tintColor={COLORS.overlays.blackMild}
                padding="sm"
                style={styles.valueInset}
                contentStyle={styles.valueInsetContent}
              >
                <GameText variant="scoreboardSmall" color={COLORS.text}>
                  {isWin ? 8 : currentLevelIndex} / 8
                </GameText>
              </Surface>
            </View>
          </View>

          {/* Bottom aligned cashout */}
          <View style={styles.bottomStats}>
            <View style={styles.separator} />
            <View style={styles.statRow}>
              <GameText variant="bodyMedium" color={COLORS.textMuted}>
                Final Money
              </GameText>
              <Surface
                tintColor={COLORS.overlays.blackMild}
                padding="sm"
                style={styles.valueInset}
                contentStyle={styles.valueInsetContent}
              >
                <Image
                  source={require("../../assets/icons/coin.png")}
                  style={styles.iconSm}
                />
                <GameText variant="scoreboardSmall" color={COLORS.gold}>
                  {formatNumber(money)}
                </GameText>
              </Surface>
            </View>
          </View>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.md, // Add bottom padding for better spacing
    gap: SPACING.lg,
  },
  hero: {
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm, // Add some top margin
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
    flex: 1, // Fill available space
    alignSelf: "center",
    width: "100%",
    maxWidth: 320, // Slightly wider
  },
  // Inset styling inside HUDCard
  cardContent: {
    flex: 1,
    justifyContent: "space-between", // Push content apart
  },
  topStats: {
    gap: SPACING.sm,
  },
  bottomStats: {
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44, // Taller rows
  },
  separator: {
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    opacity: 0.3,
  },
  valueInset: {
    minWidth: 100,
  },
  valueInsetContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  iconSm: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
    resizeMode: "contain",
  },
});
