import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { COLORS, SPACING } from "../../constants/theme";

interface PixelDividerProps {
  /** Vertical margin preset */
  spacing?: "sm" | "md" | "lg";
  /** Divider color */
  color?: string;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

const SPACING_VALUES = {
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

/**
 * PixelDivider - Visual separator line
 *
 * Use between sections or groups within panels.
 * Styled to match the pixel-art aesthetic.
 */
export const PixelDivider: React.FC<PixelDividerProps> = ({
  spacing = "md",
  color = COLORS.overlays.whiteMild,
  style,
}) => {
  const marginValue = SPACING_VALUES[spacing];

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          marginVertical: marginValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 2, // Slightly thicker for pixel-art look
    width: "100%",
  },
});
