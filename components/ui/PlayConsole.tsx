import React from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { GameText } from "../shared";
import { Surface, InsetSlot, ProgressBar } from "../ui-kit";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { formatCompactNumber } from "../../utils/formatting";
import { triggerNotificationSuccess } from "../../utils/haptics";

interface PlayConsoleProps {
  /** The DiceTray component (3D scene) */
  diceTray: React.ReactNode;
  /** ScoreLip content (score display) */
  scoreLip: React.ReactNode;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * PlayConsole - Unified play area container
 *
 * Combines Header + DiceTray + ScoreRow into one cohesive "physical object":
 * - HUDHeader: 3-row stack (Status, Objective, Progress)
 * - TrayWindow: Dice felt area as inset cutout
 * - ScoreLip: Integrated score readout strip
 *
 * Uses Surface variant="panel" as outer shell with internal insets/seams.
 */
export const PlayConsole: React.FC<PlayConsoleProps> = ({
  diceTray,
  scoreLip,
  style,
}) => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const money = useGameStore((s) => s.money);
  const levelGoal = useGameStore((s) => s.levelGoal);
  const levelScore = useGameStore((s) => s.levelScore);
  const revealState = useGameStore((s) => s.revealState);

  const levelNumber = currentLevelIndex + 1;

  // Calculate effective score (handles reveal "total" phase)
  const effectiveScore =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal || levelScore
      : levelScore;

  // Goal reached haptic
  const handleGoalReached = () => {
    triggerNotificationSuccess();
  };

  return (
    <Surface variant="panel" padding="none" style={[styles.container, style]}>
      {/* === HUDHeader Section === */}
      <View style={styles.hudHeader}>
        {/* 2-column layout: Left (LV + Money stacked) | Right (Goal spanning) */}
        <View style={styles.headerRow}>
          {/* Left Column: LV and Money stacked */}
          <View style={styles.leftColumn}>
            {/* LV Row */}
            <InsetSlot style={styles.headerSlot}>
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                LV
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.cyan}>
                {levelNumber}
              </GameText>
            </InsetSlot>

            {/* Money Row */}
            <InsetSlot style={styles.headerSlot}>
              <Image
                source={require("../../assets/icons/coin.png")}
                style={styles.coinIcon}
              />
              <GameText variant="scoreboardSmall" color={COLORS.gold}>
                {formatNumber(money)}
              </GameText>
            </InsetSlot>
          </View>

          {/* Right Column: Goal spanning both rows */}
          <InsetSlot style={styles.goalSlot}>
            <GameText variant="labelSmall" color={COLORS.textMuted}>
              ZIEL
            </GameText>
            <GameText variant="scoreboardMedium" color={COLORS.gold}>
              {formatCompactNumber(levelGoal)}
            </GameText>
          </InsetSlot>
        </View>
      </View>

      {/* === Seam Divider (Header to Tray) === */}
      <View style={styles.seamDivider}>
        <View style={styles.seamHighlight} />
        <View style={styles.seamShadow} />
      </View>

      {/* === TrayWindow Section (Dice Felt Inset) === */}
      <View style={styles.trayWindow}>
        <View style={styles.trayInset}>
          {/* Inner shadow overlays for depth */}
          <View style={styles.trayContent}>{diceTray}</View>

          {/* Depth overlay */}
          <View style={styles.depthOverlay} pointerEvents="none">
            <LinearGradient
              colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.04)", "transparent"]}
              locations={[0, 0.15, 0.4]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topShadow}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.02)", "transparent"]}
              locations={[0, 0.12, 0.3]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.leftShadow}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.02)", "transparent"]}
              locations={[0, 0.12, 0.3]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
              style={styles.rightShadow}
            />
          </View>
        </View>
      </View>

      {/* === Progress Bar Seam (Tray to ScoreLip) === */}
      <View style={styles.progressSeam}>
        <ProgressBar
          value={effectiveScore}
          max={levelGoal}
          size="sm"
          onGoalReached={handleGoalReached}
        />
      </View>

      {/* === ScoreLip Section (Score Readout) === */}
      <View style={styles.scoreLip}>{scoreLip}</View>
    </Surface>
  );
};

const INNER_RADIUS = DIMENSIONS.borderRadius - 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  // === HUDHeader ===
  hudHeader: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },

  // 2-column header layout
  headerRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  leftColumn: {
    flex: 1,
    gap: SPACING.xs,
  },
  headerSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  coinIcon: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
  },
  goalSlot: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  // === Seam Dividers ===
  seamDivider: {
    height: 3,
    flexDirection: "row",
  },
  seamHighlight: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.overlays.whiteSubtle,
  },
  seamShadow: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.overlays.blackMild,
  },

  // === Progress Bar Seam ===
  progressSeam: {
    paddingHorizontal: 0,
  },

  // === TrayWindow ===
  trayWindow: {
    flex: 1,
  },
  trayInset: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: "hidden",
    // Inset appearance (top edge shadow only, no side borders)
    borderTopWidth: 2,
    borderTopColor: COLORS.overlays.blackMedium,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.overlays.whiteSubtle,
  },
  trayContent: {
    flex: 1,
    overflow: "hidden",
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    pointerEvents: "none",
  },
  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  leftShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "15%",
  },
  rightShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "15%",
  },

  // === ScoreLip ===
  scoreLip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
