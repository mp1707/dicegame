import React, { useEffect, useRef } from "react";
import {
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
  ColorValue,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Pressable, SurfacePadding } from "../pixel-ui-kit";
import { COLORS } from "../../constants/theme";

interface ButtonProps {
  /**
   * Child components to render inside the button
   */
  children: React.ReactNode;

  /**
   * Called when the button is pressed
   */
  onPress: () => void;

  /**
   * Whether the button is disabled
   * When disabled, renders a flat Surface without elevation
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in selected/highlighted state
   * Uses selectedColor instead of activeColor
   * @default false
   */
  selected?: boolean;

  /**
   * Color when the button is disabled (flat, no elevation)
   * @default COLORS.surface2
   */
  disabledColor?: ColorValue;

  /**
   * Color when the button is active (interactive, with elevation)
   * @default COLORS.cyan
   */
  activeColor?: ColorValue;

  /**
   * Color when the button is selected/highlighted
   * @default COLORS.gold
   */
  selectedColor?: ColorValue;

  /**
   * Shadow color for active/selected states
   * @default calculated darker shade
   */
  shadowColor?: ColorValue;

  /**
   * Padding inside the button
   * @default "md"
   */
  padding?: SurfacePadding;

  /**
   * Depth of the shadow/press effect
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
}

/**
 * Button - A pixel-art style button with state management
 *
 * Supports multiple states:
 * - **Disabled**: Flat Surface with no elevation
 * - **Active**: Pressable with shadow and press-in animation
 * - **Selected**: Same as active but with highlighted color
 *
 * @example
 * ```tsx
 * <Button
 *   onPress={() => console.log('pressed!')}
 *   activeColor={COLORS.cyan}
 * >
 *   <GameText variant="buttonMedium">Würfeln</GameText>
 * </Button>
 *
 * <Button disabled disabledColor={COLORS.surface2}>
 *   <GameText variant="buttonMedium">Disabled</GameText>
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = React.memo(
  ({
    children,
    onPress,
    disabled = false,
    selected = false,
    disabledColor = COLORS.surface2,
    activeColor = COLORS.cyan,
    selectedColor = COLORS.gold,
    shadowColor = COLORS.overlays.blackStrong,
    padding = "md",
    depth = 6,
    style,
    contentStyle,
  }) => {
    // Selection pulse animation
    const scale = useSharedValue(1);
    const prevSelectedRef = useRef(selected);

    useEffect(() => {
      if (selected && !prevSelectedRef.current) {
        // Quick scale pulse on selection
        scale.value = withSequence(
          withTiming(1.08, { duration: 80 }),
          withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
        );
      }
      prevSelectedRef.current = selected;
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    // Determine which color to use based on state
    const currentColor = disabled
      ? disabledColor
      : selected
      ? selectedColor
      : activeColor;

    // Render Pressable for all states to maintain 3D structure
    // Disabled state is handled by Pressable prop

    // Active or Selected state: render Pressable with elevation
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <Pressable
          tintColor={currentColor}
          shadowColor={shadowColor}
          padding={padding}
          depth={depth}
          onPress={onPress}
          disabled={disabled}
          contentStyle={[styles.content, contentStyle]}
          style={styles.pressable}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  container: {
    // Container allows external styling
  },
  surface: {
    flex: 1, // Fill the container for disabled state
  },
  pressable: {
    flex: 1, // Fill the container for active states
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabledContent: {
    opacity: 0.6,
  },
});
