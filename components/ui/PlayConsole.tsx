import React from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { GameText } from "../shared";
import { Surface, InsetSlot, ProgressBar, NumericCapsule } from "../ui-kit";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { formatCompactNumber } from "../../utils/formatting";
import { useLayout } from "../../utils/LayoutContext";
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
  const layout = useLayout();
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
        {/* Row 1: Status Row (LV left, $ right) */}
        <View style={styles.statusRow}>
          {/* LV Chip */}
          <View style={styles.statusChip}>
            <GameText variant="labelSmall" color={COLORS.textMuted}>
              LV
            </GameText>
            <NumericCapsule
              value={levelNumber}
              digits={2}
              size="sm"
              color={COLORS.cyan}
            />
          </View>

          {/* Empty center space */}
          <View style={styles.statusSpacer} />

          {/* Coin Chip */}
          <View style={styles.statusChip}>
            <Image
              source={require("../../assets/icons/coin.png")}
              style={styles.coinIcon}
            />
            <NumericCapsule
              value={formatNumber(money)}
              digits={4}
              size="sm"
              color={COLORS.gold}
            />
          </View>
        </View>

        {/* Row 2: Objective Row (ZIEL + goal value) */}
        <View style={styles.objectiveRow}>
          <GameText variant="labelSmall" color={COLORS.textMuted}>
            ZIEL
          </GameText>
          <NumericCapsule
            value={formatCompactNumber(levelGoal)}
            digits={3}
            size="md"
            color={COLORS.gold}
            style={styles.goalCapsule}
          />
        </View>

        {/* Row 3: Progress Row (full-width bar, no numbers) */}
        <View style={styles.progressRow}>
          <ProgressBar
            value={effectiveScore}
            max={levelGoal}
            size="sm"
            onGoalReached={handleGoalReached}
          />
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

      {/* === Seam Divider (Tray to ScoreLip) === */}
      <View style={styles.seamDivider}>
        <View style={styles.seamHighlight} />
        <View style={styles.seamShadow} />
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },

  // Row 1: Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  statusSpacer: {
    flex: 1,
  },
  coinIcon: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
  },

  // Row 2: Objective
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  goalCapsule: {
    // Extra emphasis on goal
  },

  // Row 3: Progress
  progressRow: {
    paddingTop: SPACING.xxs,
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

  // === TrayWindow ===
  trayWindow: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  trayInset: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: INNER_RADIUS,
    overflow: "hidden",
    // Inset appearance
    borderWidth: 2,
    borderTopColor: COLORS.overlays.blackMedium,
    borderLeftColor: COLORS.overlays.blackMild,
    borderRightColor: COLORS.overlays.whiteSubtle,
    borderBottomColor: COLORS.overlays.whiteSubtle,
  },
  trayContent: {
    flex: 1,
    borderRadius: INNER_RADIUS - 2,
    overflow: "hidden",
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: INNER_RADIUS - 2,
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
