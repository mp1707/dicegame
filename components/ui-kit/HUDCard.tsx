import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { Surface, PaddingPreset } from "./Surface";
import { GameText } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";

interface HUDCardProps {
  /** Optional header title displayed at the top */
  header?: string;
  /** Header color (defaults to muted text) */
  headerColor?: string;
  /** Padding preset for the content area */
  padding?: PaddingPreset;
  /** Additional style for the card container */
  style?: StyleProp<ViewStyle>;
  /** Content to render inside the card */
  children?: React.ReactNode;
}

/**
 * HUDCard - Panel wrapper for HUD/info displays
 *
 * Use for non-interactive information panels like:
 * - Score displays
 * - Reward breakdowns
 * - Info sections
 *
 * NOT for buttons or tappable elements.
 */
export const HUDCard: React.FC<HUDCardProps> = ({
  header,
  headerColor = COLORS.textMuted,
  padding = "lg",
  style,
  children,
}) => {
  return (
    <Surface variant="panel" padding={padding} style={style}>
      {header && (
        <View style={styles.headerContainer}>
          <GameText variant="label" color={headerColor}>
            {header}
          </GameText>
        </View>
      )}
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: SPACING.md,
  },
});
