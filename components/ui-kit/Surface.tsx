import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";

export type SurfaceVariant = "panel" | "inset" | "chip" | "overlay";

export type PaddingPreset = "none" | "sm" | "md" | "lg";

interface SurfaceProps {
  variant?: SurfaceVariant;
  padding?: PaddingPreset;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const PADDING_VALUES: Record<PaddingPreset, number> = {
  none: 0,
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

/**
 * Surface - Base container component with material layer variants
 *
 * Variants:
 * - panel: Main container surface (flat, matte, subtle border)
 * - inset: Recessed sub-surface for data displays (darker, inner shadow feel)
 * - chip: Minimal flat badge (no bevel, very subtle)
 * - overlay: Semi-transparent for modal backgrounds
 *
 * IMPORTANT: Surface is NON-INTERACTIVE (View only).
 * For tappable elements, use PrimaryButton or TileButton instead.
 */
// P3.4: Memoize to prevent unnecessary re-renders from parent updates
export const Surface: React.FC<SurfaceProps> = React.memo(({
  variant = "panel",
  padding = "md",
  style,
  children,
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const paddingValue = PADDING_VALUES[padding];

  return (
    <View style={[variantStyle, { padding: paddingValue }, style]}>
      {children}
    </View>
  );
});

const VARIANT_STYLES = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteMild,
    // Subtle top highlight only - NOT a button bevel
    borderTopWidth: DIMENSIONS.borderWidthThin,
    borderTopColor: COLORS.overlays.whiteMedium,
    // No thick bottom border (that would look like a button)
    borderBottomWidth: DIMENSIONS.borderWidthThin,
    borderBottomColor: COLORS.overlays.blackSubtle,
  },
  inset: {
    backgroundColor: COLORS.bg,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    // Top dark border creates recessed/inset appearance
    borderTopWidth: 2,
    borderTopColor: COLORS.overlays.blackMedium,
    // Subtle bottom highlight (inverse of panel)
    borderBottomWidth: DIMENSIONS.borderWidthThin,
    borderBottomColor: COLORS.overlays.whiteSubtle,
    borderLeftWidth: DIMENSIONS.borderWidthThin,
    borderLeftColor: COLORS.overlays.blackSubtle,
    borderRightWidth: DIMENSIONS.borderWidthThin,
    borderRightColor: COLORS.overlays.blackSubtle,
  },
  chip: {
    backgroundColor: COLORS.overlays.blackMild,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteSubtle,
    // Completely flat - no bevel whatsoever
  },
  overlay: {
    backgroundColor: "rgba(53, 43, 88, 0.95)", // COLORS.surface with 95% opacity
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteMild,
  },
});
