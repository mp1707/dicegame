import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  triggerImpactMedium,
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";

interface BasePressableAnimatedProps {
  onPress?: () => void;
  onPressIn?: () => void; // Optional override
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleActive?: number;
  translateYActive?: number;
  hapticOnPressIn?: "light" | "selection" | "none";
  hapticOnPress?: "medium" | "success" | "warning" | "none";
}

export const BasePressableAnimated = ({
  onPress,
  onPressIn,
  disabled = false,
  style,
  children,
  scaleActive = 0.96,
  translateYActive = 2,
  hapticOnPressIn = "light",
  hapticOnPress = "medium",
}: BasePressableAnimatedProps) => {
  const isPressed = useSharedValue(false);

  const handlePressIn = () => {
    if (disabled) return;
    isPressed.value = true;
    if (onPressIn) onPressIn();

    // Haptics
    if (hapticOnPressIn === "light") triggerLightImpact();
    else if (hapticOnPressIn === "selection") triggerSelectionHaptic();
  };

  const handlePressOut = () => {
    isPressed.value = false;
  };

  const handlePress = () => {
    if (disabled) return;
    if (onPress) onPress();

    // Haptics
    if (hapticOnPress === "medium") triggerImpactMedium();
    // TODO: support success/warning if we import those helpers
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isPressed.value ? scaleActive : 1, {
            damping: 20,
            stiffness: 400,
          }),
        },
        {
          translateY: withSpring(isPressed.value ? translateYActive : 0, {
            damping: 20,
            stiffness: 400,
          }),
        },
      ],
      opacity: disabled ? 0.6 : 1,
    };
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={{ width: "100%" }} // Ensure full width for composed buttons
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};
