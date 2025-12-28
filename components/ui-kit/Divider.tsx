import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { COLORS, SPACING } from "../../constants/theme";

interface DividerProps {
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
 * Divider - Visual separator line
 *
 * Use between sections or groups within panels.
 */
export const Divider: React.FC<DividerProps> = ({
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
    height: 1,
    width: "100%",
  },
});
