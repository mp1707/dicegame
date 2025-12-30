import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatCompactNumber } from "../../utils/formatting";
import { triggerNotificationSuccess } from "../../utils/haptics";

interface EdgeThermometerProps {
  /** Height is now controlled by parent TrayModule */
  height?: number;
}
const MIN_FILL_HEIGHT = 6; // Minimum visible nub (per spec §5.5: 6-10px)

export const EdgeThermometer: React.FC<EdgeThermometerProps> = ({ height }) => {
  // Store subscriptions
  const levelGoal = useGameStore((s) => s.levelGoal);
  const levelScore = useGameStore((s) => s.levelScore);
  const revealState = useGameStore((s) => s.revealState);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);

  // Track previous level for drain animation
  const prevLevelIndex = useRef(currentLevelIndex);
  const wasGoalMet = useRef(false);

  // Calculate effective score (handles reveal "total" phase)
  const effectiveScore =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal || levelScore
      : levelScore;

  const targetProgress =
    levelGoal > 0 ? Math.min(effectiveScore / levelGoal, 1) : 0;
  const isNearGoal = targetProgress >= 0.8 && targetProgress < 1;
  const isGoalMet = effectiveScore >= levelGoal && levelGoal > 0;

  // Animation values
  const fillProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const celebrationScale = useSharedValue(1);
  const fillColorProgress = useSharedValue(0);

  // Fill animation - synced with score changes
  useEffect(() => {
    // Check if level changed (drain animation)
    if (currentLevelIndex !== prevLevelIndex.current) {
      prevLevelIndex.current = currentLevelIndex;
      wasGoalMet.current = false;

      // Drain down with smooth easing
      fillProgress.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
      fillColorProgress.value = 0;
      glowOpacity.value = 0;
      return;
    }

    // Normal progress animation with easing
    fillProgress.value = withTiming(targetProgress, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [targetProgress, currentLevelIndex]);

  // Near-goal glow effect - single pulse at >=80% (per spec §6.2)
  useEffect(() => {
    if (isNearGoal) {
      // Single soft pulse at 80%, not looping
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0.3, { duration: 200 })
      );
    } else if (isGoalMet) {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(1, { duration: 200 });
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isNearGoal, isGoalMet]);

  // Goal reached celebration (one-shot, no looping - feedback #8)
  useEffect(() => {
    if (isGoalMet && !wasGoalMet.current) {
      wasGoalMet.current = true;

      // Single bounce animation
      celebrationScale.value = withSequence(
        withTiming(1.1, {
          duration: 150,
          easing: Easing.out(Easing.back(1.5)),
        }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
      );

      // Flash mint color
      fillColorProgress.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 300 })
      );

      triggerNotificationSuccess();
    }
  }, [isGoalMet]);

  // Animated styles
  const fillStyle = useAnimatedStyle(() => ({
    height: `${Math.max(fillProgress.value * 100, 2)}%`, // Minimum 2% for visibility
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderColor: interpolateColor(
      fillColorProgress.value,
      [0, 1],
      [COLORS.cyan, COLORS.gold] // Cyan default, gold on success
    ),
  }));

  // No fixed height calculation - track uses flex to fill available space

  // Determine fill colors based on state (cyan default, gold at 100%+)
  const fillColors: [string, string] = isGoalMet
    ? [COLORS.gold, COLORS.gold + "CC"] // Success: gold
    : [COLORS.cyan, COLORS.cyan + "CC"]; // Default: cyan

  return (
    <View style={styles.container}>
      {/* Goal Header Block (per spec §5.1, §5.2 - merged cohesive unit, no bullseye) */}
      <View style={styles.goalHeader}>
        <GameText variant="labelSmall" color={COLORS.textMuted}>
          ZIEL
        </GameText>
        <GameText
          variant="displaySmall"
          color={COLORS.gold}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCompactNumber(levelGoal)}
        </GameText>
      </View>

      {/* Vertical Progress Track */}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          {/* Glow border when near/at goal */}
          <Animated.View style={[styles.glowBorder, glowStyle]} />

          {/* Fill wrapper - defines the padded area for the fill */}
          <View style={styles.fillWrapper}>
            {/* Fill bar */}
            <Animated.View style={[styles.fill, fillStyle]}>
              <LinearGradient
                colors={fillColors}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Subtle shine on fill only */}
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.15)",
                  "rgba(255,255,255,0.05)",
                  "transparent",
                ]}
                locations={[0, 0.3, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.fillShine}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.sm,
    gap: SPACING.sm,
    // No background - inherits from TrayModule rail inset
  },
  goalHeader: {
    // Merged cohesive header block (per spec §5.2)
    width: "100%",
    alignItems: "center",
    gap: SPACING.xxs,
    // InsetSlot-style background for visual definition
    backgroundColor: COLORS.overlays.blackMedium,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    // Recess cues
    borderWidth: 1,
    borderTopColor: COLORS.overlays.blackStrong,
    borderLeftColor: COLORS.overlays.blackMild,
    borderRightColor: COLORS.overlays.whiteSubtle,
    borderBottomColor: COLORS.overlays.whiteSubtle,
  },
  trackContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  track: {
    flex: 1, // Fill all available vertical space
    width: "100%",
    overflow: "hidden",
    position: "relative",
    borderRadius: DIMENSIONS.borderRadiusSmall,
    // Visible track border (per spec §5.3)
    backgroundColor: COLORS.overlays.blackMedium,
    borderWidth: 2,
    borderTopColor: COLORS.overlays.blackStrong,
    borderLeftColor: COLORS.overlays.blackMild,
    borderRightColor: COLORS.overlays.whiteSubtle,
    borderBottomColor: COLORS.overlays.whiteSubtle,
  },
  fillWrapper: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    overflow: "hidden",
    borderRadius: DIMENSIONS.borderRadiusSmall - 6,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: COLORS.cyan, // Cyan default (animated to gold on success)
    borderRadius: DIMENSIONS.borderRadiusSmall - 2,
    zIndex: 1,
  },
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Height is controlled by animated style (percentage of fillWrapper)
    borderRadius: DIMENSIONS.borderRadiusSmall - 6,
    overflow: "hidden",
  },
  fillShine: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "40%",
  },
});
