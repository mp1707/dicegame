import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { COLORS, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";

export type PrimaryButtonVariant = "cyan" | "coral" | "mint" | "gold";

export interface PrimaryButtonProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEPTH = 6;
const BORDER_WIDTH = 2;

const VARIANT_COLORS: Record<PrimaryButtonVariant, readonly [string, string]> =
  {
    cyan: [COLORS.cyan, "#0098B3"],
    coral: [COLORS.coral, "#CC4860"],
    mint: [COLORS.mint, "#4ACC96"],
    gold: [COLORS.gold, "#D9A830"],
  };

export const PrimaryButton = ({
  label,
  subLabel,
  icon,
  disabled = false,
  variant = "cyan",
  onPress,
  style,
}: PrimaryButtonProps) => {
  const colors = VARIANT_COLORS[variant];
  const faceColor = disabled ? COLORS.surface2 : colors[0];
  const sideColor = disabled ? COLORS.surface : colors[1];
  const borderColor = "rgba(0,0,0,0.15)";

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadius}
      showLighting={false}
      style={[styles.wrapper, style, disabled && styles.disabled]}
      base={
        <View
          style={[
            styles.base,
            {
              backgroundColor: sideColor,
              borderColor: sideColor,
              borderWidth: BORDER_WIDTH,
            },
          ]}
        />
      }
      face={
        <View
          style={[
            styles.face,
            {
              backgroundColor: faceColor,
              borderColor: borderColor,
              borderWidth: BORDER_WIDTH,
              borderBottomWidth: BORDER_WIDTH * 2,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.1)", "rgba(0,0,0,0.05)"]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      }
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.textStack}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
          {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
        </View>
      </View>
    </Pressable3DBase>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: DIMENSIONS.rollButtonHeight,
    width: "100%",
    borderRadius: DIMENSIONS.borderRadius,
  },
  disabled: {
    opacity: 0.8,
  },
  base: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
  },
  face: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconWrapper: {},
  textStack: {
    flexDirection: "column",
    alignItems: "center",
  },
  label: {
    ...TYPOGRAPHY.displayMedium,
    fontSize: 28,
    color: COLORS.textDark,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
  subLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textDark,
    opacity: 0.7,
  },
});
