import React from "react";
import {
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
  ColorValue,
} from "react-native";
import { Surface, Pressable, SurfacePadding } from "../pixel-ui-kit";
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
    // Determine which color to use based on state
    const currentColor = disabled
      ? disabledColor
      : selected
      ? selectedColor
      : activeColor;

    // Disabled state: render flat Surface without elevation
    if (disabled) {
      return (
        <View style={[styles.container, style]}>
          <Surface
            tintColor={currentColor}
            padding={padding}
            contentStyle={[styles.content, contentStyle]}
            style={styles.surface}
          >
            <View style={styles.disabledContent}>{children}</View>
          </Surface>
        </View>
      );
    }

    // Active or Selected state: render Pressable with elevation
    return (
      <View style={[styles.container, style]}>
        <Pressable
          tintColor={currentColor}
          shadowColor={shadowColor}
          padding={padding}
          depth={depth}
          onPress={onPress}
          contentStyle={[styles.content, contentStyle]}
          style={styles.pressable}
        >
          {children}
        </Pressable>
      </View>
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
