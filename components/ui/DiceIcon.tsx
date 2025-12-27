import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

// Pip positions for each face value (relative, scaled by die size)
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.5],
    [0.75, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
};

const DIE_SIZE = 28;
const PIP_SIZE = 5;

// 2D Dice Icon Component
export interface DiceIconProps {
  value: number;
  isHighlighted: boolean;
  isContributing: boolean;
  animatedScale: SharedValue<number>;
}

export const DiceIcon = ({
  value,
  isHighlighted,
  isContributing,
  animatedScale,
}: DiceIconProps) => {
  const pips = PIP_LAYOUTS[value] || [];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isHighlighted ? animatedScale.value : 1 }],
  }));

  const backgroundColor = isHighlighted
    ? COLORS.gold
    : isContributing
    ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.25)";

  const pipColor = isHighlighted ? COLORS.textDark : "#1a1a1a";

  return (
    <Animated.View
      style={[
        styles.diceIcon,
        { backgroundColor },
        !isContributing && styles.diceIconDimmed,
        animatedStyle,
      ]}
    >
      {pips.map(([x, y], i) => (
        <View
          key={i}
          style={[
            styles.pip,
            {
              left: x * DIE_SIZE - PIP_SIZE / 2,
              top: y * DIE_SIZE - PIP_SIZE / 2,
              backgroundColor: pipColor,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  diceIcon: {
    width: DIE_SIZE,
    height: DIE_SIZE,
    borderRadius: 4,
    position: "relative",
  },
  diceIconDimmed: {
    opacity: 0.3,
  },
  pip: {
    position: "absolute",
    width: PIP_SIZE,
    height: PIP_SIZE,
    borderRadius: PIP_SIZE / 2,
  },
});
