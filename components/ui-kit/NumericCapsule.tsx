import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import {
  COLORS,
  DIMENSIONS,
  SPACING,
  FONT_FAMILY,
} from "../../constants/theme";
import { GameText } from "../shared";

type CapsuleSize = "sm" | "md" | "lg";
type CapsuleVariant = "chip" | "inset";

interface NumericCapsuleProps {
  /** The numeric value to display */
  value: number | string;
  /** Expected number of digits (determines fixed width) */
  digits?: number;
  /** Size variant */
  size?: CapsuleSize;
  /** Visual variant */
  variant?: CapsuleVariant;
  /** Text color */
  color?: string;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

// Width per digit based on font metrics (M6x11 is fixed-width)
const DIGIT_WIDTH = {
  sm: 8,
  md: 11,
  lg: 14,
};

// Font sizes matching GameText variants
const FONT_SIZES = {
  sm: 14,
  md: 18,
  lg: 22,
};

// Padding for capsule
const PADDING = {
  sm: { v: SPACING.xxs, h: SPACING.xs },
  md: { v: SPACING.xs, h: SPACING.sm },
  lg: { v: SPACING.xs, h: SPACING.md },
};

/**
 * NumericCapsule - Fixed-width wrapper for stable numeric display
 *
 * Features:
 * - Fixed width based on expected digit count (prevents layout shift)
 * - Right-aligned text inside (digits grow inward)
 * - Tabular numerals for consistent character widths
 * - Chip or inset visual variants
 *
 * Use for: LV value, coin count, goal value, score values
 */
export const NumericCapsule: React.FC<NumericCapsuleProps> = ({
  value,
  digits = 3,
  size = "md",
  variant = "inset",
  color = COLORS.text,
  style,
}) => {
  const digitWidth = DIGIT_WIDTH[size];
  const fontSize = FONT_SIZES[size];
  const padding = PADDING[size];

  // Calculate fixed width: digits * width + horizontal padding
  const fixedWidth = digits * digitWidth + padding.h * 2 + 4; // +4 for border

  const containerStyle = variant === "chip" ? styles.chip : styles.inset;

  return (
    <View
      style={[
        containerStyle,
        {
          minWidth: fixedWidth,
          paddingVertical: padding.v,
          paddingHorizontal: padding.h,
        },
        style,
      ]}
    >
      <GameText
        style={[
          styles.number,
          {
            fontSize,
            color,
          },
        ]}
      >
        {value}
      </GameText>
    </View>
  );
};

const styles = StyleSheet.create({
  inset: {
    backgroundColor: COLORS.bg,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    // Inset appearance (recessed)
    borderTopWidth: 2,
    borderTopColor: COLORS.overlays.blackMedium,
    borderBottomWidth: DIMENSIONS.borderWidthThin,
    borderBottomColor: COLORS.overlays.whiteSubtle,
    borderLeftWidth: DIMENSIONS.borderWidthThin,
    borderLeftColor: COLORS.overlays.blackSubtle,
    borderRightWidth: DIMENSIONS.borderWidthThin,
    borderRightColor: COLORS.overlays.blackSubtle,
    alignItems: "flex-end", // Right-align numbers
    justifyContent: "center",
  },
  chip: {
    backgroundColor: COLORS.overlays.blackMild,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteSubtle,
    alignItems: "flex-end", // Right-align numbers
    justifyContent: "center",
  },
  number: {
    fontFamily: FONT_FAMILY,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
});
