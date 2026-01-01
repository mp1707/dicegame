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
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const handsRemaining = useGameStore((s) => s.handsRemaining);

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
      {/* === HUDHeader Section === */}
      <View style={styles.hudHeader}>
        {/* 3-column layout */}
        <View style={styles.headerRow}>
          {/* Left Column: Level and Money */}
          <View style={styles.leftColumn}>
            {/* Level - Standard Inset Style */}
            <InsetSlot style={styles.statSlot}>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                LEVEL {levelNumber}
              </GameText>
            </InsetSlot>

            {/* Money */}
            <InsetSlot style={styles.statSlot}>
              <Image
                source={require("../../assets/icons/coin.png")}
                style={styles.iconSm}
              />
              <GameText variant="scoreboardSmall" color={COLORS.gold}>
                {formatNumber(money)}
              </GameText>
            </InsetSlot>
          </View>

          {/* Center Column: Goal */}
          <View style={styles.centerColumn}>
            <InsetSlot style={styles.goalSlot}>
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                ERREICHE
              </GameText>
              <GameText variant="scoreboardLarge" color={COLORS.gold}>
                {formatCompactNumber(levelGoal)}
              </GameText>
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                PUNKTE
              </GameText>
            </InsetSlot>
          </View>

          {/* Right Column: Hands and Rolls */}
          <View style={styles.rightColumn}>
            {/* Hands */}
            <InsetSlot style={styles.statSlot}>
              <Image
                source={require("../../assets/icons/Glove.png")}
                style={styles.iconSm}
              />
              <GameText variant="label" color={COLORS.textMuted}>
                HÄNDE
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.cyan}>
                {handsRemaining}
              </GameText>
            </InsetSlot>

            {/* Rolls */}
            <InsetSlot style={styles.statSlot}>
              <Image
                source={require("../../assets/icons/die.png")}
                style={styles.iconSm}
              />
              <GameText variant="label" color={COLORS.textMuted}>
                WÜRFE
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.gold}>
                {rollsRemaining}
              </GameText>
            </InsetSlot>
          </View>
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

  // 3-column header layout
  headerRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center", // Ensure all columns are vertically centered relative to each other if heights differ
  },

  // Left Column: Level + Money
  leftColumn: {
    flex: 1,
    gap: SPACING.xs,
    alignItems: "stretch", // Stretch children to fill width
  },

  // Center Column: Goal
  centerColumn: {
    flex: 1, // Equal width
    alignItems: "center",
    justifyContent: "center",
  },
  goalSlot: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: 0, // Tight stacking
    width: "100%", // Explicitly width 100% to match others if needed, but center column content is centered
  },

  // Right Column: Hands + Rolls
  rightColumn: {
    flex: 1,
    gap: SPACING.xs,
    alignItems: "stretch", // Stretch children to fill width
  },

  // Generic slot styling for stats
  statSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    justifyContent: "center",
  },

  iconSm: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
    resizeMode: "contain",
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
