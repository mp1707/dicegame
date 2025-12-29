import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolateColor,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Surface, InsetSlot } from "../ui-kit";
import { GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { formatCompactNumber } from "../../utils/formatting";
import { triggerNotificationSuccess } from "../../utils/haptics";

interface EdgeThermometerProps {
  height: number;
}

const THERMOMETER_WIDTH = 64;
const TRACK_WIDTH = 36;
const BADGE_HEIGHT = 52;

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

      // Drain down animation
      fillProgress.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      fillColorProgress.value = 0;
      glowOpacity.value = 0;
      return;
    }

    // Normal progress animation
    fillProgress.value = withTiming(targetProgress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, currentLevelIndex]);

  // Near-goal glow effect
  useEffect(() => {
    if (isNearGoal) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else if (isGoalMet) {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(1, { duration: 200 });
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isNearGoal, isGoalMet]);

  // Goal reached celebration
  useEffect(() => {
    if (isGoalMet && !wasGoalMet.current) {
      wasGoalMet.current = true;

      // Bounce animation
      celebrationScale.value = withSequence(
        withTiming(1.15, {
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
    height: `${fillProgress.value * 100}%`,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderColor: interpolateColor(
      fillColorProgress.value,
      [0, 1],
      [isGoalMet ? COLORS.gold : COLORS.cyan, COLORS.mint]
    ),
  }));

  // Calculate track height
  const trackHeight = height - BADGE_HEIGHT - SPACING.md * 2;

  // Determine fill colors based on state
  const fillColors: [string, string] = isGoalMet
    ? [COLORS.gold, COLORS.gold + "CC"]
    : [COLORS.cyan, COLORS.cyan + "CC"];

  return (
    <View style={[styles.container, { height }]}>
      {/* Goal Badge */}
      <Animated.View style={badgeStyle}>
        <Surface variant="chip" padding="sm" style={styles.goalBadge}>
          <GameText variant="labelSmall" color={COLORS.textMuted}>
            GOAL
          </GameText>
          <GameText variant="scoreboardSmall" color={COLORS.gold}>
            {formatCompactNumber(levelGoal)}
          </GameText>
        </Surface>
      </Animated.View>

      {/* Vertical Progress Track */}
      <View style={styles.trackContainer}>
        <InsetSlot padding="none" style={[styles.track, { height: trackHeight }]}>
          {/* Threshold tick at 100% */}
          <View style={styles.thresholdTick} />

          {/* Glow border when near/at goal */}
          <Animated.View style={[styles.glowBorder, glowStyle]} />

          {/* Fill */}
          <Animated.View style={[styles.fill, fillStyle]}>
            <LinearGradient
              colors={fillColors}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </InsetSlot>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: THERMOMETER_WIDTH,
    alignItems: "center",
    paddingTop: SPACING.sm,
  },
  goalBadge: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 56,
  },
  trackContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  track: {
    width: TRACK_WIDTH,
    overflow: "hidden",
    position: "relative",
  },
  thresholdTick: {
    position: "absolute",
    top: 0,
    left: -4,
    right: -4,
    height: 2,
    backgroundColor: COLORS.gold,
    zIndex: 2,
    borderRadius: 1,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    borderRadius: DIMENSIONS.borderRadiusSmall - 2,
    zIndex: 1,
  },
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: DIMENSIONS.borderRadiusSmall - 4,
    overflow: "hidden",
    minHeight: 4, // Always show a tiny nub
  },
});
