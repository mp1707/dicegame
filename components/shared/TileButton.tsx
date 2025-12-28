import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { GameText } from "./GameText";
import {
  COLORS,
  DIMENSIONS,
  SPACING,
  SLOT_STATES,
  FONT_FAMILY,
} from "../../constants/theme";

export type TileButtonVariant =
  | "default"
  | "active"
  | "filled"
  | "scratch"
  | "selected";

export interface TileButtonProps {
  icon: React.ReactNode;
  label: string;
  level?: number;
  variant?: TileButtonVariant;
  disabled?: boolean;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEPTH = 4;

const getStateStyle = (variant: TileButtonVariant, selected: boolean) => {
  if (selected) return SLOT_STATES.selected;

  switch (variant) {
    case "active":
      return SLOT_STATES.possible;
    case "filled":
      return SLOT_STATES.filled;
    case "scratch":
      return SLOT_STATES.scratch;
    default:
      return SLOT_STATES.empty;
  }
};

export const TileButton = ({
  icon,
  label,
  level = 1,
  variant = "default",
  disabled = false,
  selected = false,
  onPress,
  style,
}: TileButtonProps) => {
  const stateStyle = getStateStyle(variant, selected);

  const faceStyle = [
    styles.face,
    {
      backgroundColor: stateStyle.backgroundColor,
      borderColor: stateStyle.borderColor,
      borderWidth: stateStyle.borderWidth,
    },
    stateStyle.borderTopColor && {
      borderTopWidth: stateStyle.borderTopWidth,
      borderTopColor: stateStyle.borderTopColor,
      borderBottomWidth: stateStyle.borderBottomWidth,
      borderBottomColor: stateStyle.borderBottomColor,
    },
    selected &&
      variant === "scratch" && {
        borderColor: COLORS.coral,
        shadowColor: COLORS.coral,
      },
    variant === "scratch" && !selected && { opacity: 0.9 },
  ];

  const labelColor =
    variant === "filled"
      ? COLORS.gold
      : variant === "scratch"
      ? COLORS.coral
      : selected
      ? COLORS.text
      : variant === "active"
      ? COLORS.text
      : COLORS.textMuted;

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      hapticOnPressIn={selected ? "none" : "selection"}
      showLighting={false}
      style={[styles.wrapper, style]}
      base={<View style={styles.base} />}
      face={<View style={faceStyle} />}
    >
      <View style={styles.content}>
        {/* Icon + Label centered */}
        <View style={styles.centerStack}>
          {icon}
          <GameText
            variant="caption"
            color={labelColor}
            numberOfLines={1}
            style={styles.label}
          >
            {label}
          </GameText>
        </View>

        {/* LV Badge - top right */}
        <View style={styles.badge}>
          <GameText variant="caption" style={styles.badgeText}>
            LV {level}
          </GameText>
        </View>
      </View>
    </Pressable3DBase>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  base: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xs,
  },
  centerStack: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  label: {
    fontSize: 7,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badge: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: SPACING.xs,
    backgroundColor: COLORS.overlays.whiteMedium,
  },
  badgeText: {
    fontSize: 6,
    letterSpacing: 0.3,
  },
});
