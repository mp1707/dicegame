import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";

export type ChipColor = "cyan" | "gold" | "mint" | "coral" | "muted";

interface ChipProps {
  /** Text to display in the chip */
  label: string;
  /** Color variant */
  color?: ChipColor;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

const CHIP_COLORS: Record<ChipColor, { bg: string; text: string; border: string }> = {
  cyan: {
    bg: COLORS.overlays.cyanSubtle,
    text: COLORS.cyan,
    border: COLORS.cyan,
  },
  gold: {
    bg: COLORS.overlays.goldSubtle,
    text: COLORS.gold,
    border: COLORS.gold,
  },
  mint: {
    bg: "rgba(108, 255, 184, 0.15)",
    text: COLORS.mint,
    border: COLORS.mint,
  },
  coral: {
    bg: COLORS.overlays.coralSubtle,
    text: COLORS.coral,
    border: COLORS.coral,
  },
  muted: {
    bg: COLORS.overlays.blackMild,
    text: COLORS.textMuted,
    border: COLORS.overlays.whiteMild,
  },
};

/**
 * Chip - Non-interactive status badge
 *
 * Use for:
 * - Status labels ("NEW", "UPGRADE", "COMING SOON")
 * - Level badges ("LV.3")
 * - Tier indicators ("TIER 2")
 *
 * IMPORTANT: Chips are NOT tappable. They are purely informational.
 * If you need a tappable badge, use a button component instead.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  color = "muted",
  size = "sm",
  style,
}) => {
  const colors = CHIP_COLORS[color];
  const sizeStyle = size === "sm" ? styles.sizeSm : styles.sizeMd;

  return (
    <View
      style={[
        styles.chip,
        sizeStyle,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <GameText
        variant={size === "sm" ? "labelSmall" : "label"}
        color={colors.text}
        style={styles.text}
      >
        {label}
      </GameText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    alignSelf: "flex-start",
    // Flat appearance - no bevel
  },
  sizeSm: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: SPACING.xxs,
  },
  sizeMd: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  text: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
