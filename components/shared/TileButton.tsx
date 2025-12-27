import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import {
  COLORS,
  DIMENSIONS,
  SLOT_STATES,
  TYPOGRAPHY,
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
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {/* LV Badge - top right */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LV {level}</Text>
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
    padding: 4,
  },
  centerStack: {
    alignItems: "center",
    gap: 4,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 7,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  badgeText: {
    fontFamily: "Inter-Bold",
    fontSize: 6,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
});
