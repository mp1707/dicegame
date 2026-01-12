import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants/theme";
import { GameText } from "./shared";

// Animation timing (in ms)
const POP_DURATION = 150;
const HOLD_DURATION = 600;
const FADE_DURATION = 250;

interface FloatingScoreOverlayProps {
  /** Points value to display (null = hidden) */
  pointsValue: number | null;
  /** Mult value to display (null = hidden) */
  multValue: number | null;
  /** Screen position (x, y) for the score display */
  position: { x: number; y: number } | null;
  /** Whether this score is currently active */
  isActive: boolean;
}

/**
 * FloatingScoreOverlay - React Native overlay for displaying floating scores
 *
 * Positioned above the 3D canvas based on dice positions.
 * Shows points (white, above) and mult (red, below) with pop animation.
 */
export const FloatingScoreOverlay = ({
  pointsValue,
  multValue,
  position,
  isActive,
}: FloatingScoreOverlayProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Track position changes to trigger animation for each new die
  const positionKey = position ? `${position.x.toFixed(0)}-${position.y.toFixed(0)}` : null;
  const prevPositionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Trigger animation when position changes (new die highlighted)
    if (isActive && positionKey && positionKey !== prevPositionKeyRef.current) {
      // Reset to start fresh
      scale.value = 0;
      opacity.value = 0;

      // Pop in animation
      scale.value = withSequence(
        // Pop in with overshoot
        withTiming(1.2, {
          duration: POP_DURATION,
          easing: Easing.out(Easing.back(2)),
        }),
        // Settle to 1.0
        withTiming(1.0, {
          duration: 80,
          easing: Easing.out(Easing.quad),
        }),
        // Hold then fade
        withDelay(
          HOLD_DURATION,
          withTiming(0.8, {
            duration: FADE_DURATION,
            easing: Easing.in(Easing.quad),
          })
        )
      );

      opacity.value = withSequence(
        // Fade in fast
        withTiming(1, {
          duration: POP_DURATION * 0.5,
          easing: Easing.out(Easing.quad),
        }),
        // Hold then fade
        withDelay(
          HOLD_DURATION + POP_DURATION * 0.5 + 80,
          withTiming(0, {
            duration: FADE_DURATION,
            easing: Easing.in(Easing.quad),
          })
        )
      );

      prevPositionKeyRef.current = positionKey;
    } else if (!isActive) {
      // Quick fade out if deactivated
      scale.value = withTiming(0.8, { duration: 100 });
      opacity.value = withTiming(0, { duration: 100 });
      prevPositionKeyRef.current = null;
    }
  }, [isActive, positionKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Don't render if no position or no values
  if (!position || (!pointsValue && !multValue)) {
    return null;
  }

  const hasPoints = pointsValue !== null && pointsValue > 0;
  const hasMult = multValue !== null && multValue > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {/* Points number - above die */}
      {hasPoints && (
        <View style={styles.pointsContainer}>
          <GameText
            variant="scoreboardMedium"
            color="#FFFFFF"
            style={styles.scoreText}
          >
            +{pointsValue}
          </GameText>
        </View>
      )}

      {/* Mult number - below die */}
      {hasMult && (
        <View style={styles.multContainer}>
          <GameText
            variant="scoreboardSmall"
            color={COLORS.upgradeMult}
            style={styles.scoreText}
          >
            +{multValue} Mult
          </GameText>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    // Center the container on the position
    transform: [{ translateX: -50 }, { translateY: -30 }],
  },
  pointsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 50, // Space for die
  },
  multContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 50, // Space for die
  },
  scoreText: {
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
