import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image } from "react-native";
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
  /** Height is now controlled by parent TrayModule */
  height?: number;
}
const MIN_FILL_HEIGHT = 4; // Always show a tiny nub

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

  // Fill animation - synced with score changes (faster: 150ms)
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

    // Normal progress animation (faster: 150ms per feedback #8)
    fillProgress.value = withTiming(targetProgress, {
      duration: 150,
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
      [isGoalMet ? COLORS.gold : COLORS.cyan, COLORS.mint]
    ),
  }));

  // No fixed height calculation - track uses flex to fill available space

  // Determine fill colors based on state
  const fillColors: [string, string] = isGoalMet
    ? [COLORS.gold, COLORS.gold + "CC"]
    : [COLORS.cyan, COLORS.cyan + "CC"];

  return (
    <View style={styles.container}>
      {/* Goal Label + Value */}
      <View style={styles.goalLabelRow}>
        <Image
          source={require("../../assets/icons/bullseye.png")}
          style={styles.goalIcon}
        />
        <GameText variant="bodyMedium" color={COLORS.text}>
          ZIEL
        </GameText>
      </View>
      <View style={styles.goalValueSlot}>
        <GameText variant="scoreboardSmall" color={COLORS.gold}>
          {formatCompactNumber(levelGoal)}
        </GameText>
      </View>

      {/* Vertical Progress Track */}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          {/* Track inset background - darker for visibility at 0% */}
          <View style={styles.trackInset}>
            {/* Top recess border for inset look */}
            <View style={styles.trackRecess} />

            {/* Subtle inner highlight for separation */}
            <View style={styles.trackHighlight} />
          </View>

          {/* Threshold tick at 100% - neutral, subtle (replaces gold strip) */}
          <View style={styles.thresholdTick} />

          {/* Glow border when near/at goal */}
          <Animated.View style={[styles.glowBorder, glowStyle]} />

          {/* Fill with minimum nub for visibility */}
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

          {/* Minimum visible nub at bottom */}
          <View style={styles.minNub} />
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
  goalLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  goalIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  goalValueSlot: {
    width: "100%",
    alignItems: "center",
    backgroundColor: COLORS.overlays.blackMedium,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.overlays.blackMild,
    borderTopColor: COLORS.overlays.blackStrong,
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
  },
  trackInset: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlays.blackMedium, // Darker than rail for contrast
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
  },
  trackRecess: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.overlays.blackStrong,
  },
  trackHighlight: {
    position: "absolute",
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    backgroundColor: COLORS.overlays.whiteSubtle,
    opacity: 0.5,
  },
  thresholdTick: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: COLORS.overlays.whiteSubtle, // Neutral, not gold
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
    left: 2,
    right: 2,
    borderRadius: DIMENSIONS.borderRadiusSmall - 4,
    overflow: "hidden",
    minHeight: MIN_FILL_HEIGHT, // Always show a tiny nub
    zIndex: 3,
  },
  fillShine: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "40%",
  },
  minNub: {
    position: "absolute",
    bottom: 2,
    left: 2,
    right: 2,
    height: MIN_FILL_HEIGHT,
    backgroundColor: COLORS.overlays.whiteSubtle,
    borderRadius: 2,
    opacity: 0.3,
    zIndex: 0,
  },
});
