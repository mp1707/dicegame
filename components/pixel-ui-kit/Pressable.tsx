import React from "react";
import {
  Pressable as RNPressable,
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
  ColorValue,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  withTiming,
} from "react-native-reanimated";
import { Surface, SurfacePadding } from "./Surface";
import { COLORS, ANIMATION } from "../../constants/theme";
import { triggerLightImpact, triggerImpactMedium } from "../../utils/haptics";

interface PressableProps {
  /**
   * Tint color to apply to the pixel surface
   * @default "#8B5CF6"
   */
  tintColor?: ColorValue;

  /**
   * Color for the shadow layer (slightly darker than tintColor typically)
   * @default calculated from tintColor or defaults to darker shade
   */
  shadowColor?: ColorValue;

  /**
   * Padding inside the surface
   * @default "md"
   */
  padding?: SurfacePadding;

  /**
   * Opacity of the pixel surface background image
   * @default 1
   */
  opacity?: number;

  /**
   * Depth of the shadow (how far the button "presses in")
   * @default 6
   */
  depth?: number;

  /**
   * Custom style to apply to the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Style to apply to the inner content wrapper
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Called when the button is pressed
   */
  onPress?: () => void;

  /**
   * Called when the press starts
   */
  onPressIn?: () => void;

  /**
   * Called when the press ends
   */
  onPressOut?: () => void;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Child components to render inside the pressable
   */
  children?: React.ReactNode;
}

/**
 * Pressable - An animated pixel-art button component
 *
 * Extends Surface with interactive press behavior including:
 * - Shadow layer that creates depth illusion
 * - Animated press-in effect using reanimated springs
 * - Haptic feedback on press
 *
 * @example
 * ```tsx
 * <Pressable
 *   tintColor="#4DEEEA"
 *   onPress={() => console.log('pressed!')}
 *   padding="lg"
 * >
 *   <Text>Press Me</Text>
 * </Pressable>
 * ```
 */
export const Pressable: React.FC<PressableProps> = React.memo(
  ({
    tintColor = "#8B5CF6",
    shadowColor = COLORS.overlays.blackStrong,
    padding = "md",
    opacity = 1,
    depth = 6,
    style,
    contentStyle,
    onPress,
    onPressIn,
    onPressOut,
    disabled = false,
    children,
  }) => {
    // Shared value for press animation: 0 = up, 1 = pressed
    const pressProgress = useSharedValue(0);

    const handlePressIn = () => {
      if (disabled) return;

      // Animate to pressed state
      pressProgress.value = withTiming(1, {
        duration: 50,
      });

      triggerLightImpact();
      onPressIn?.();
    };

    const handlePressOut = () => {
      // Animate back to unpressed with overdamped spring (no bounce)
      pressProgress.value = withTiming(0, {
        duration: 50,
      });

      onPressOut?.();
    };

    const handlePress = () => {
      if (disabled) return;
      triggerImpactMedium();
      onPress?.();
    };

    // Animated style for the top surface layer
    const animatedSurfaceStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        pressProgress.value,
        [0, 1],
        [0, depth],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }],
      };
    });

    return (
      <View style={[styles.container, { paddingBottom: depth }, style]}>
        {/* Shadow/Base layer - positioned at bottom, behind main surface */}
        <View style={[styles.shadowLayer, { top: depth }]}>
          <Surface
            tintColor={shadowColor}
            padding={padding}
            opacity={0.9}
            style={styles.shadowSurface}
          >
            {/* Invisible content to match main surface size */}
            <View style={styles.shadowContent}>{children}</View>
          </Surface>
        </View>

        {/* Main surface layer - animates on press */}
        <Animated.View style={[styles.surfaceLayer, animatedSurfaceStyle]}>
          <RNPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
            style={styles.pressable}
          >
            <Surface
              tintColor={tintColor}
              padding={padding}
              opacity={opacity}
              contentStyle={[styles.surfaceContent, contentStyle]}
              style={styles.mainSurface}
            >
              {children}
            </Surface>
          </RNPressable>
        </Animated.View>
      </View>
    );
  }
);

Pressable.displayName = "Pressable";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    // paddingBottom is set dynamically to reserve space for shadow
  },
  shadowLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0, // Stretch to fill height
    // top is set dynamically based on depth
  },
  shadowSurface: {
    flex: 1, // Fill the shadow layer
  },
  shadowContent: {
    opacity: 0, // Hide shadow content, just need the shape for sizing
    flex: 1,
  },
  surfaceLayer: {
    // Sits on top, animates down on press
    flex: 1,
    zIndex: 1,
  },
  pressable: {
    flex: 1, // Fills the surface layer
  },
  mainSurface: {
    flex: 1, // Main visible surface fills pressable
  },
  surfaceContent: {
    flex: 1, // Content area fills the surface
  },
});
