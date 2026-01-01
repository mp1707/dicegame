import React, { useEffect } from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  TYPOGRAPHY,
  ANIMATION,
} from "../../constants/theme";
import { GameText } from "../shared";
import { Surface, InsetSlot } from "../ui-kit";
import { Sparks } from "../ui-kit/Sparks";
import { useGameStore } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { formatCompactNumber } from "../../utils/formatting";
import { triggerNotificationSuccess } from "../../utils/haptics";

// Animated components - Use Animated.View/Text directly from reanimated

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
 * - HUDHeader: 3-row stack (Status, Objective)
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

  const levelWon = useGameStore((s) => s.levelWon);
  const winShownYet = useGameStore((s) => s.winShownYet);
  const isWinAnimating = useGameStore((s) => s.isWinAnimating);
  const setIsWinAnimating = useGameStore((s) => s.setIsWinAnimating);

  const levelNumber = currentLevelIndex + 1;
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const handsRemaining = useGameStore((s) => s.handsRemaining);

  // Animation values
  const progress = useSharedValue(0);
  const goalScale = useSharedValue(1);
  const goalColorAnim = useSharedValue(0); // 0 = gold, 1 = mint
  const barHeightPulse = useSharedValue(0); // 0 = normal, 1 = +1px
  const shineProgress = useSharedValue(-1); // -1 = off, 0-1 = sweep

  // Track previous score to detect fills
  const prevScore = React.useRef(levelScore);

  useEffect(() => {
    const targetProgress = Math.min(Math.max(levelScore / levelGoal, 0), 1);

    // Normal fill animation
    progress.value = withTiming(targetProgress, {
      duration: isWinAnimating ? 220 : 500, // Faster on win
      easing: Easing.out(Easing.cubic),
    });

    // Detect score increase for pulse
    if (levelScore > prevScore.current) {
      // Pulse height: Up 70ms, Down 120ms
      barHeightPulse.value = withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(0, { duration: 120 })
      );
    }
    prevScore.current = levelScore;
  }, [levelScore, levelGoal]);

  // Win Moment Triggers
  useEffect(() => {
    if (levelWon && isWinAnimating) {
      // Trigger Haptics
      runOnJS(triggerNotificationSuccess)();

      // 1. Goal Number Color & Pop
      goalColorAnim.value = withTiming(1, {
        duration: ANIMATION.duration.winGoalColor,
        easing: Easing.out(Easing.cubic),
      });

      goalScale.value = withSequence(
        withTiming(1.08, { duration: ANIMATION.duration.winGoalPopUp }),
        withTiming(1, { duration: ANIMATION.duration.winGoalPopSettle })
      );

      // 2. Progress Bar Shine (starts after ~120ms)
      shineProgress.value = withDelay(
        120,
        withTiming(1, { duration: 260, easing: Easing.linear }, (finished) => {
          if (finished) {
            runOnJS(setIsWinAnimating)(false); // End interaction lock after shine (plus buffer)
          }
        })
      );
    } else if (!levelWon) {
      // Reset specific values when level resets
      goalColorAnim.value = withTiming(0, { duration: 0 });
      goalScale.value = withTiming(1, { duration: 0 });
    }
  }, [levelWon, isWinAnimating]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barTrackStyle = useAnimatedStyle(() => ({
    height: 2 + barHeightPulse.value, // 2px -> 3px
    marginTop: -barHeightPulse.value, // Grow upward to keep baseline? Or simply grow.
    // Spec: "Corner radius should adjust". At 2-3px height, radius is tiny.
  }));

  const goalNumberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goalScale.value }],
    color: interpolateColor(
      goalColorAnim.value,
      [0, 1],
      [COLORS.gold, COLORS.mint]
    ),
  }));

  const shineStyle = useAnimatedStyle(() => ({
    left: `${shineProgress.value * 150 - 50}%`, // Sweep from -50% to 100%
    opacity: shineProgress.value < 0 ? 0 : 0.8,
  }));

  return (
    <Surface variant="panel" padding="none" style={[styles.container, style]}>
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
            <InsetSlot padding="none" style={styles.goalSlot}>
              <View style={styles.goalTextContainer}>
                {levelWon ? (
                  // Win State Layout
                  <View style={styles.winTextWrapper}>
                    <GameText
                      variant="label"
                      color={COLORS.mint}
                      style={styles.winLabel}
                    >
                      ZIEL ERREICHT!
                    </GameText>
                    <Animated.Text
                      style={[
                        TYPOGRAPHY.displayMedium,
                        { fontFamily: "M6x11-Regular" },
                        goalNumberStyle,
                      ]}
                    >
                      {formatCompactNumber(levelGoal)}
                    </Animated.Text>
                    {/* Placeholder for spacing stability */}
                    <View style={{ height: 10 }} />
                  </View>
                ) : (
                  // Normal State Layout
                  <>
                    <GameText variant="labelSmall" color={COLORS.textMuted}>
                      ERREICHE
                    </GameText>
                    <Animated.Text
                      style={[
                        TYPOGRAPHY.scoreboardLarge,
                        { fontFamily: "M6x11-Regular" },
                        goalNumberStyle,
                      ]}
                    >
                      {formatCompactNumber(levelGoal)}
                    </Animated.Text>
                    <GameText variant="labelSmall" color={COLORS.textMuted}>
                      PUNKTE
                    </GameText>
                  </>
                )}
              </View>

              <Animated.View style={[styles.progressBarTrack, barTrackStyle]}>
                <Animated.View style={[styles.progressBarFill, progressStyle]}>
                  {/* Shine Effect */}
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      { width: "40%" },
                      shineStyle,
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "transparent",
                        COLORS.overlays.whiteStrong,
                        "transparent",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            </InsetSlot>
            {isWinAnimating && (
              <Sparks
                count={12}
                style={{
                  position: "absolute",
                  bottom: -10,
                  alignSelf: "center",
                  zIndex: 10,
                }}
              />
            )}
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

      {/* === Win Banner (Toast) === */}
      {/* === Win Overlay (in Tray) === */}
      {isWinAnimating && (
        <View style={styles.winOverlay} pointerEvents="none">
          <Animated.Text
            entering={require("react-native-reanimated").FadeIn.duration(300)}
            exiting={require("react-native-reanimated").FadeOut.duration(400)}
            style={styles.bigWinText}
          >
            Geschafft!
          </Animated.Text>
        </View>
      )}

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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },

  // 3-column header layout
  headerRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "stretch", // Ensure all columns stretch to match height
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
    // paddingHorizontal: SPACING.md, <- REMOVED (handled by internal containers)
    // paddingVertical: SPACING.xs,   <- REMOVED
    alignItems: "stretch", // Stretch to allow full width bars
    justifyContent: "space-between", // Distribute text and bar
    gap: 0,
    width: "100%",
    flex: 1,
    overflow: "hidden",
  },
  goalTextContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs, // Top padding only
    flex: 1, // Take available space above bar
    alignItems: "center",
    justifyContent: "center",
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

  // === TrayWindow ===
  trayWindow: {
    flex: 1,
  },
  trayInset: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: "hidden",
    // Inset appearance (top edge shadow only, no side borders)
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

  // === Progress Bar ===
  progressBarTrack: {
    width: "100%",
    height: 2,
    backgroundColor: COLORS.overlays.blackMild,
    // marginTop: SPACING.xs, <- REMOVE margin to sit flush bottom if desired, or keep small spacing from text
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.gold,
    overflow: "hidden", // Clip shine
  },

  // === Win Banner ===
  winOverlay: {
    position: "absolute",
    top: 100, // Starts at felt top
    left: 0,
    right: 0,
    // Remove bottom to let it sit at top
    justifyContent: "flex-start",
    paddingTop: 60, // Push down slightly into top 3rd
    alignItems: "center",
    zIndex: 200,
  },
  bigWinText: {
    fontFamily: "M6x11-Regular",
    fontSize: 64, // Larger for impact
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    transform: [{ rotate: "-6deg" }, { translateX: -10 }], // Off-center feel
  },
  winTextWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  winLabel: {
    marginBottom: -2,
  },
});
