import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING } from "../constants/theme";
import { Surface } from "./pixel-ui-kit/Surface";
import { GameText } from "./shared";

interface FloatingScoreProps {
  /** Points value to display */
  pointsValue: number | null;
  /** Mult value to display */
  multValue: number | null;
  /** Whether this score is currently active */
  isActive: boolean;
}

/**
 * FloatingScoreOverlay - Simple fixed-position score display
 *
 * Displays at top center of dice tray during counting animation.
 * Shows "X Punkte" (white) and "X Mult" (red) with Surface background.
 */
export const FloatingScoreOverlay = ({
  pointsValue,
  multValue,
  isActive,
}: FloatingScoreProps) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0, { duration: 150 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const hasPoints = pointsValue !== null && pointsValue > 0;
  const hasMult = multValue !== null && multValue > 0;

  if (!hasPoints && !hasMult) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      {hasPoints && (
        <Surface tintColor="#000000" opacity={0.7} padding="sm">
          <GameText variant="scoreboardMedium" color="#FFFFFF">
            {pointsValue} Punkte
          </GameText>
        </Surface>
      )}
      {hasMult && (
        <Surface
          tintColor="#000000"
          opacity={0.7}
          padding="sm"
          style={styles.multRow}
        >
          <GameText variant="scoreboardMedium" color={COLORS.upgradeMult}>
            {multValue} Mult
          </GameText>
        </Surface>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  multRow: {
    marginTop: SPACING.sm,
  },
});
