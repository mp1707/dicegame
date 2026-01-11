import React from "react";
import {
  ImageBackground,
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
  ColorValue,
} from "react-native";
import { SPACING } from "../../constants/theme";

// Import the grayscale pixel surface asset
const pixelSurface = require("../../assets/ui/pixelSurface.png");

/**
 * Padding presets for Surface
 */
export type SurfacePadding = "none" | "xs" | "sm" | "md" | "lg" | number;

interface SurfaceProps {
  /**
   * Tint color to apply to the pixel surface
   * Accepts any valid React Native color value
   * @default "#8B5CF6" (purple)
   */
  tintColor?: ColorValue;

  /**
   * Padding inside the surface
   * Can be a preset string or a custom number value
   * @default "md"
   */
  padding?: SurfacePadding;

  /**
   * Opacity of the pixel surface background image
   * @default 1
   */
  opacity?: number;

  /**
   * Custom style to apply to the container
   * Supports standard View styles for dimensions, flex, margins, etc.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Style to apply to the inner content wrapper
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Child components to render inside the surface
   */
  children?: React.ReactNode;
}

/**
 * Padding preset values mapped to actual pixel values
 */
const PADDING_VALUES: Record<Exclude<SurfacePadding, number>, number> = {
  none: 0,
  xs: SPACING.xs,
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

/**
 * 9-slice cap insets for the pixel surface images
 * These values define the non-stretchable corners of the image
 * Adjust these based on the actual corner size of your assets
 */
const CAP_INSETS = {
  top: 12,
  right: 12,
  bottom: 12,
  left: 12,
};

/**
 * Surface - A reusable 9-sliced pixel art container component
 *
 * Uses 9-slicing to create a scalable container that maintains
 * crisp pixel art corners while stretching the center to fit content.
 *
 * Features:
 * - Dynamic tinting via tintColor prop
 * - Flexible padding options (presets or custom values)
 * - Accepts standard View styles for dimensions, flex, margins, etc.
 * - Automatically scales with content like a normal View
 *
 * @example
 * ```tsx
 * <Surface tintColor="#8B5CF6" padding="md">
 *   <Text>Content inside pixel surface</Text>
 * </Surface>
 *
 * <Surface tintColor="#000000" padding={16} style={{ width: 200, height: 100 }}>
 *   <Text>Fixed size surface</Text>
 * </Surface>
 * ```
 */
export const Surface: React.FC<SurfaceProps> = React.memo(
  ({
    tintColor = "#8B5CF6",
    padding = "md",
    opacity = 1,
    style,
    contentStyle,
    children,
  }) => {
    // Calculate padding value (handle both presets and custom numbers)
    const paddingValue =
      typeof padding === "number" ? padding : PADDING_VALUES[padding];

    return (
      <View style={[styles.container, style]}>
        <ImageBackground
          source={pixelSurface}
          style={StyleSheet.absoluteFill}
          imageStyle={[styles.image, { opacity, tintColor }]}
          resizeMode="stretch"
          capInsets={CAP_INSETS}
        />
        <View style={[styles.content, { padding: paddingValue }, contentStyle]}>
          {children}
        </View>
      </View>
    );
  }
);

Surface.displayName = "Surface";

const styles = StyleSheet.create({
  container: {
    // Container handles all layout (flex, width, etc.)
    overflow: "hidden",
  },
  image: {
    // Ensure the 9-sliced image fills the container
    resizeMode: "stretch",
  },
  content: {
    // No flex: 1 - sizes based on children like a normal View
  },
});
