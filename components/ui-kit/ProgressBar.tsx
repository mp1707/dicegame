import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
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
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";

export type ProgressBarSize = "sm" | "md";

interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Maximum value (goal) */
  max: number;
  /** Size variant */
  size?: ProgressBarSize;
  /** Show leading edge shine effect */
  showShine?: boolean;
  /** Additional style for container */
  style?: StyleProp<ViewStyle>;
  /** Callback when goal is reached for first time */
  onGoalReached?: () => void;
}

const SIZE_CONFIG: Record<
  ProgressBarSize,
  { height: number; borderRadius: number }
> = {
  sm: { height: 8, borderRadius: 4 },
  md: { height: 14, borderRadius: 6 },
};

/**
 * ProgressBar - Reusable horizontal progress bar with satisfying animation
 *
 * Features:
 * - InsetSlot-style track (recessed appearance)
 * - Smooth fill animation with timing easing
 * - Gradient fill with leading edge shine
 * - Color transition: cyan → gold at 100%
 * - Subtle settle/bounce at end of fill movement
 * - Glow effect when near/at goal
 *
 * Uses same visual language as the theme's UI kit.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  size = "md",
  showShine = true,
  style,
  onGoalReached,
}) => {
  const { height, borderRadius } = SIZE_CONFIG[size];

  // Track if goal was previously reached (for one-shot callback)
  const wasGoalMet = useRef(false);
  const prevMax = useRef(max);

  // Calculate progress (clamped 0-1)
  const targetProgress = max > 0 ? Math.min(value / max, 1) : 0;
  const isNearGoal = targetProgress >= 0.8 && targetProgress < 1;
  const isGoalMet = value >= max && max > 0;

  // Animation values
  const fillProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const fillColorProgress = useSharedValue(0);

  // Reset when max changes (new level)
  useEffect(() => {
    if (max !== prevMax.current) {
      prevMax.current = max;
      wasGoalMet.current = false;

      // Drain animation
      fillProgress.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
      fillColorProgress.value = 0;
      glowOpacity.value = 0;
      return;
    }

    // Normal progress animation with subtle overshoot and settle
    fillProgress.value = withSequence(
      withTiming(Math.min(targetProgress * 1.02, 1), {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetProgress, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [targetProgress, max]);

  // Near-goal glow effect
  useEffect(() => {
    if (isNearGoal) {
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

  // Goal reached effect
  useEffect(() => {
    if (isGoalMet && !wasGoalMet.current) {
      wasGoalMet.current = true;
      fillColorProgress.value = withTiming(1, { duration: 150 });
      onGoalReached?.();
    }
  }, [isGoalMet, onGoalReached]);

  // Animated styles
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(fillProgress.value * 100, 2)}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderColor: interpolateColor(
      fillColorProgress.value,
      [0, 1],
      [COLORS.cyan, COLORS.gold]
    ),
  }));

  // Determine fill colors based on state
  const fillColors: [string, string] = isGoalMet
    ? [COLORS.gold, COLORS.gold + "CC"]
    : [COLORS.cyan, COLORS.cyan + "CC"];

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Track (recessed inset appearance) */}
      <View style={[styles.track, { borderRadius }]}>
        {/* Glow border when near/at goal */}
        <Animated.View
          style={[
            styles.glowBorder,
            { borderRadius: borderRadius - 1 },
            glowStyle,
          ]}
        />

        {/* Fill wrapper */}
        <View style={[styles.fillWrapper, { borderRadius: borderRadius - 2 }]}>
          {/* Animated fill */}
          <Animated.View
            style={[styles.fill, { borderRadius: borderRadius - 2 }, fillStyle]}
          >
            <LinearGradient
              colors={fillColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Leading edge shine */}
            {showShine && (
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(255,255,255,0.25)",
                  "rgba(255,255,255,0.15)",
                ]}
                locations={[0, 0.8, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.leadingShine}
              />
            )}

            {/* Top highlight */}
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topHighlight}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  track: {
    flex: 1,
    backgroundColor: COLORS.overlays.blackMedium,
    overflow: "hidden",
    position: "relative",
    // Inset appearance (recessed)
    borderWidth: 1,
    borderTopColor: COLORS.overlays.blackStrong,
    borderLeftColor: COLORS.overlays.blackMild,
    borderRightColor: COLORS.overlays.whiteSubtle,
    borderBottomColor: COLORS.overlays.whiteSubtle,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    zIndex: 1,
  },
  fillWrapper: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    right: 2,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  leadingShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 12,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
});
