import React, { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

interface RollCounterProps {
  remaining: number; // 0-3
  maxRolls?: number;
}

const Lamp = ({ active, index }: { active: boolean; index: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (active) {
      // Pop in
      scale.value = withSequence(
        withTiming(0.9, { duration: 0 }),
        withDelay(
          index * 50,
          withSpring(1, { damping: 24, stiffness: 160 })
        )
      );
      opacity.value = withTiming(1, { duration: 300 });
      colorProgress.value = withTiming(1, { duration: 300 });
    } else {
      // Pop out / dim
      scale.value = withSpring(0.95, { damping: 26, stiffness: 180 });
      opacity.value = withTiming(0.3, { duration: 300 });
      colorProgress.value = withTiming(0, { duration: 300 });
    }
  }, [active, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: active ? COLORS.cyan : COLORS.surface2, // Simple interpolation substitute
      borderWidth: 1,
      borderColor: active ? COLORS.cyan : "rgba(255,255,255,0.1)",
      // Glow effect for active lamps
      shadowColor: active ? COLORS.cyan : "transparent",
      shadowOpacity: active ? 0.6 : 0,
      shadowRadius: active ? 8 : 0,
    };
  });

  return <Animated.View style={[styles.lamp, animatedStyle]} />;
};

export const RollCounter = ({ remaining, maxRolls = 3 }: RollCounterProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        {Array.from({ length: maxRolls }).map((_, i) => (
          <Lamp key={i} index={i} active={i < remaining} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lamp: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
