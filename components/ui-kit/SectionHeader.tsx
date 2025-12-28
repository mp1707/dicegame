import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";

interface SectionHeaderProps {
  /** Section title text */
  title: string;
  /** Title color (defaults to text white) */
  color?: string;
  /** Icon to display before title */
  icon?: React.ReactNode;
  /** Right-side accessory (badge, count, etc.) */
  accessory?: React.ReactNode;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

/**
 * SectionHeader - Section title with optional icon and accessory
 *
 * Use for:
 * - Section labels in panels
 * - Category headers in lists
 * - Group dividers
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  color = COLORS.text,
  icon,
  accessory,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <GameText variant="label" color={color} style={styles.title}>
          {title}
        </GameText>
      </View>
      {accessory && <View style={styles.accessory}>{accessory}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconContainer: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    letterSpacing: 1,
  },
  accessory: {
    marginLeft: SPACING.sm,
  },
});
