import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
  interpolateColor,
} from "react-native-reanimated";
import {
  triggerImpactMedium,
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";

interface Pressable3DBaseProps {
  onPress?: () => void;
  onPressIn?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;

  // 3D Specifics
  depth?: number; // How deep it goes (default 4)
  borderRadius?: number; // Border radius for the face and base layers

  // Slots for the 3 visual layers
  // 1. The "Face" (moving part) - usually a gradient or solid color view
  face?: React.ReactNode;
  // 2. The "Base" (stationary background) - usually darker color
  base?: React.ReactNode;

  // Customization
  hapticOnPressIn?: "light" | "selection" | "none";
  hapticOnPress?: "medium" | "success" | "warning" | "none";

  // Logic
  selected?: boolean; // If selected, we might want different behavior or just pass it through
}

export const Pressable3DBase = ({
  onPress,
  onPressIn,
  disabled = false,
  style,
  children,
  depth = 4,
  borderRadius = 8,
  face,
  base,
  hapticOnPressIn = "light",
  hapticOnPress = "medium",
}: Pressable3DBaseProps) => {
  // Shared value p: 0 (up/unpressed) -> 1 (down/pressed)
  const p = useSharedValue(0);

  const handlePressIn = () => {
    if (disabled) return;
    if (onPressIn) onPressIn();

    // Animate to pressed state (p -> 1)
    // Snappy: 60-90ms ease-out
    p.value = withTiming(1, {
      duration: 75,
      easing: Easing.out(Easing.quad),
    });

    // Haptics
    if (hapticOnPressIn === "light") triggerLightImpact();
    else if (hapticOnPressIn === "selection") triggerSelectionHaptic();
  };

  const handlePressOut = () => {
    // Animate back to unpressed (p -> 0)
    // Release: 90-140ms ease-out
    p.value = withTiming(0, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePress = () => {
    if (disabled) return;
    if (onPress) onPress();

    // Haptics on commit
    if (hapticOnPress === "medium") triggerImpactMedium();
  };

  // --- Animated Styles ---

  // Face Geometry: Translates down by `depth` pixels
  const faceAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      p.value,
      [0, 1],
      [0, depth],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  // Lighting Overlays

  // 1. Top Highlight (Convex gloss)
  // Fades out when pressed (pressed = flat/concave)
  const highlightStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      p.value,
      [0, 1],
      [1, 0.2], // Starts strong, fades to faint
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  // 2. Inner Shadow (Concave indent)
  // Fades in when pressed
  const innerShadowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(p.value, [0, 1], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    // ...
    const translateY = interpolate(p.value, [0, 1], [0, 1], Extrapolate.CLAMP);
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[style, styles.outerContainer, { borderRadius }]}>
      {/* BASE LAYER (Static background / Well) - fills entire container */}
      <View style={[styles.baseContainer, { borderRadius }]}>{base}</View>

      {/* FACE LAYER (Moves) */}
      <Animated.View
        style={[styles.faceContainer, { borderRadius }, faceAnimatedStyle]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled}
          style={[styles.pressableInner, { borderRadius }]}
        >
          {face}

          {/* LIGHTING OVERLAYS (Inside Face) */}

          {/* Top Highlight (Gloss) */}
          <Animated.View
            style={[styles.lightingOverlay, styles.highlight, highlightStyle]}
          />

          {/* Inner Shadow (Inset) */}
          <Animated.View
            style={[
              styles.lightingOverlay,
              styles.innerShadow,
              innerShadowStyle,
            ]}
          />

          {/* CONTENT */}
          <Animated.View
            style={[styles.contentContainer, contentAnimatedStyle]}
          >
            {children}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    // Container defines the total size and is the relative parent for absolute children
    position: "relative",
    overflow: "hidden", // Clip content at rounded corners
  },
  baseContainer: {
    // Base fills the entire container; the face covers it until pressed
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  faceContainer: {
    // Face fills the entire container and moves down when pressed
    flex: 1,
    overflow: "hidden", // Ensure lighting stays inside face shape
    borderRadius: 0, // Should be overridden by user style or specific component
  },
  pressableInner: {
    // Make the pressable fill the face container
    flex: 1,
    width: "100%",
  },
  lightingOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  highlight: {
    // Glossy top gradient
    backgroundColor: "rgba(255,255,255,0.15)", // Increased visibility slightly
  },
  innerShadow: {
    // Dark overlay for "pressed" look
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
