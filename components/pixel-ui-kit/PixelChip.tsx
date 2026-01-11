import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { Surface } from "./Surface";
import { GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";

export type PixelChipColor = "cyan" | "gold" | "mint" | "coral" | "muted";

interface PixelChipProps {
  /** Text to display in the chip */
  label: string;
  /** Color variant */
  color?: PixelChipColor;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

const CHIP_COLORS: Record<
  PixelChipColor,
  { surface: string; text: string; border: string }
> = {
  cyan: {
    surface: COLORS.overlays.cyanSubtle,
    text: COLORS.cyan,
    border: COLORS.cyan,
  },
  gold: {
    surface: COLORS.overlays.goldSubtle,
    text: COLORS.gold,
    border: COLORS.gold,
  },
  mint: {
    surface: "rgba(108, 255, 184, 0.15)",
    text: COLORS.mint,
    border: COLORS.mint,
  },
  coral: {
    surface: COLORS.overlays.coralSubtle,
    text: COLORS.coral,
    border: COLORS.coral,
  },
  muted: {
    surface: COLORS.overlays.blackMild,
    text: COLORS.textMuted,
    border: COLORS.overlays.whiteMild,
  },
};

/**
 * PixelChip - Non-interactive status badge with pixel-art styling
 *
 * Uses the pixel Surface component for consistent 9-slice appearance.
 *
 * Use for:
 * - Status labels ("NEW", "UPGRADE", "COMING SOON")
 * - Level badges ("LV.3")
 * - Tier indicators ("TIER 2")
 *
 * IMPORTANT: Chips are NOT tappable. They are purely informational.
 */
export const PixelChip: React.FC<PixelChipProps> = React.memo(
  ({ label, color = "muted", size = "sm", style }) => {
    const colors = CHIP_COLORS[color];
    const padding = size === "sm" ? "xxs" : "xs";

    return (
      <View style={[styles.container, style]}>
        <Surface
          tintColor={colors.surface}
          padding={padding}
          style={styles.surface}
          contentStyle={styles.content}
        >
          <GameText
            variant={size === "sm" ? "labelSmall" : "label"}
            color={colors.text}
            style={styles.text}
          >
            {label}
          </GameText>
        </Surface>
      </View>
    );
  }
);

PixelChip.displayName = "PixelChip";

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  surface: {
    // Surface handles the pixel-art border appearance
  },
  content: {
    paddingHorizontal: SPACING.xs,
  },
  text: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
