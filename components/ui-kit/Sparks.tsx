import React, { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

interface SparkProps {
  delay: number;
  duration: number;
  angle: number; // in radians
  distance: number;
  startX: number;
  startY: number;
}

const Spark = ({
  delay,
  duration,
  angle,
  distance,
  startX,
  startY,
}: SparkProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const d = distance * progress.value;
    const x = startX + Math.cos(angle) * d;
    const y = startY - Math.sin(angle) * d; // Upward is negative Y
    const opacity = 1 - Math.pow(progress.value, 3); // Fade out towards end

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1 - progress.value * 0.5 },
      ],
      opacity,
    };
  });

  return <Animated.View style={[styles.spark, style]} />;
};

interface SparksProps {
  count?: number;
  style?: ViewStyle;
  onComplete?: () => void;
}

export const Sparks: React.FC<SparksProps> = ({
  count = 10,
  style,
  onComplete,
}) => {
  const sparks = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      delay: Math.random() * 100, // Small variance start
      duration: 450 + Math.random() * 150, // 450-600ms
      angle: Math.PI / 4 + Math.random() * (Math.PI / 2), // 45-135 degrees (upward cone)
      distance: 30 + Math.random() * 40,
      startX: (Math.random() - 0.5) * 100, // Spread horizontally
      startY: 0,
    }));
  }, [count]);

  // Cleanup callback
  useEffect(() => {
    const maxDuration = Math.max(...sparks.map((s) => s.delay + s.duration));
    const timer = setTimeout(() => {
      onComplete?.();
    }, maxDuration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, style]} pointerEvents="none">
      {sparks.map(({ key, ...s }) => (
        <Spark key={key} {...s} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    width: 0,
    height: 0,
  },
  spark: {
    position: "absolute",
    width: 3,
    height: 3,
    backgroundColor: COLORS.gold, // or goldHighlight
    borderRadius: 1,
  },
});
