import React from "react";
import { View, StyleSheet } from "react-native";
import { Trophy, Skull } from "lucide-react-native";
import { GameText } from "../shared";
import { HUDCard } from "../ui-kit";
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
        <View
          style={[
            styles.iconContainer,
            isWin ? styles.iconContainerWin : styles.iconContainerLose,
          ]}
        >
          {isWin ? (
            <Trophy size={DIMENSIONS.iconSize.xl} color={COLORS.gold} />
          ) : (
            <Skull size={DIMENSIONS.iconSize.xl} color={COLORS.coral} />
          )}
        </View>

        <GameText
          variant="displayLarge"
          style={[styles.title, isWin ? styles.titleWin : styles.titleLose]}
        >
          {isWin ? "GEWONNEN!" : "VERLOREN"}
        </GameText>

        <GameText variant="bodyMedium" color={COLORS.textMuted}>
          {isWin ? "All 8 levels completed!" : `Failed at Level ${levelNumber}`}
        </GameText>
      </View>

      {/* Stats card */}
      <HUDCard style={styles.statsCard}>
        <View style={styles.statRow}>
          <GameText variant="bodyMedium" color={COLORS.textMuted}>
            Final Money
          </GameText>
          <GameText variant="scoreboardSmall" color={COLORS.gold}>
            ${formatNumber(money)}
          </GameText>
        </View>

        <View style={styles.statRow}>
          <GameText variant="bodyMedium" color={COLORS.textMuted}>
            Levels Completed
          </GameText>
          <GameText variant="scoreboardSmall">
            {isWin ? 8 : currentLevelIndex} / 8
          </GameText>
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
  iconContainerLose: {
    backgroundColor: COLORS.overlays.coralSubtle,
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.coral,
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
  titleLose: {
    color: COLORS.coral,
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
  },
});
