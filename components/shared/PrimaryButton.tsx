import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { GameText } from "./GameText";
import {
  COLORS,
  DIMENSIONS,
  SPACING,
  TYPOGRAPHY,
} from "../../constants/theme";

export type PrimaryButtonVariant = "cyan" | "coral" | "mint" | "gold";

export interface PrimaryButtonProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const DEPTH = 6;

const VARIANT_COLORS: Record<PrimaryButtonVariant, readonly [string, string]> =
  {
    cyan: [COLORS.cyan, "#0098B3"],
    coral: [COLORS.coral, "#CC4860"],
    mint: [COLORS.mint, "#4ACC96"],
    gold: [COLORS.gold, COLORS.goldDark],
  };

export const PrimaryButton = ({
  label,
  subLabel,
  icon,
  disabled = false,
  variant = "cyan",
  onPress,
  style,
  compact = false,
}: PrimaryButtonProps) => {
  const colors = VARIANT_COLORS[variant];
  const faceColor = disabled ? COLORS.surface2 : colors[0];
  const sideColor = disabled ? COLORS.surface : colors[1];
  const borderColor = COLORS.overlays.blackMedium;

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
              borderWidth: DIMENSIONS.borderWidth,
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
              borderWidth: DIMENSIONS.borderWidth,
              borderBottomWidth: DIMENSIONS.borderWidth * 2,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.overlays.whiteMild, COLORS.overlays.blackSubtle]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      }
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.textStack}>
          <GameText
            variant={compact ? "buttonMedium" : "buttonLarge"}
            style={[disabled && styles.labelDisabled]}
          >
            {label}
          </GameText>
          {subLabel && (
            <GameText variant="label" style={styles.subLabel}>
              {subLabel}
            </GameText>
          )}
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
    gap: SPACING.md,
  },
  iconWrapper: {},
  textStack: {
    flexDirection: "column",
    alignItems: "center",
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
  subLabel: {
    color: COLORS.textDark,
    opacity: 0.7,
  },
});
