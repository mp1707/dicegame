import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable3DBase } from "./Pressable3DBase";
import { COLORS, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";

// --- CTA 3D Button (Big, Chunky, High Depth) ---

interface CTA3DButtonProps {
  onPress: () => void;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  colors?: readonly [string, string]; // Main gradient
  style?: StyleProp<ViewStyle>;
}

export const CTA3DButton = ({
  onPress,
  label,
  subLabel,
  icon,
  disabled = false,
  colors = [COLORS.cyan, "#0098B3"], // Default Cyan
  style,
}: CTA3DButtonProps) => {
  const DEPTH = 6;
  const BORDER_WIDTH = 2; // Reduced border width for cleaner look

  // Colors
  // We use colors[0] for the FACE
  // We use colors[1] (or dark variant) for the BASE (Side/Shadow)
  const faceColor = disabled ? COLORS.surface2 : colors[0];
  const sideColor = disabled ? COLORS.surface : colors[1];
  const borderColor = "rgba(0,0,0,0.15)"; // Soft border for definition

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadius}
      showLighting={false} // We handle our own styling
      style={[styles.ctaWrapper, style, disabled && styles.ctaDisabled]}
      // BASE: The "Side" and "Bottom". It sits behind.
      // We give it the dark color.
      base={
        <View
          style={[
            styles.baseLayer,
            {
              backgroundColor: sideColor,
              // Add a border to the base to match the face if needed, or keep it solid
              borderColor: sideColor,
              borderWidth: BORDER_WIDTH,
            },
          ]}
        />
      }
      // FACE: The Top Surface.
      // We give it the margin bottom so it sits "up" initially?
      // No, Pressable3DBase handles projection.
      // We just need the Face to look like a "card".
      // We add a border to the face to match the "Shop" aesthetic.
      face={
        <View
          style={[
            styles.ctaFace,
            {
              backgroundColor: faceColor,
              borderColor: borderColor,
              borderWidth: BORDER_WIDTH,
              borderBottomWidth: BORDER_WIDTH * 2, // Thicker bottom border for "lip"
            },
          ]}
        >
          {/* Subtle gradient overlay if desired, or just solid */}
          <LinearGradient
            colors={["rgba(255,255,255,0.1)", "rgba(0,0,0,0.05)"]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      }
    >
      {/* Content */}
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.textStack}>
          <Text
            style={[styles.ctaLabel, disabled && { color: COLORS.textMuted }]}
          >
            {label}
          </Text>
          {subLabel && <Text style={styles.ctaSubLabel}>{subLabel}</Text>}
        </View>
      </View>
    </Pressable3DBase>
  );
};

// --- Tile 3D Button (Categories, Smaller Depth) ---

interface Tile3DButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "scratch";
}

export const Tile3DButton = ({
  onPress,
  children,
  selected,
  disabled,
  style,
  variant = "default",
}: Tile3DButtonProps) => {
  const DEPTH = 4;

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      hapticOnPressIn={selected ? "none" : "selection"}
      style={[styles.tileWrapper, style]}
      base={<View style={[styles.baseLayer, styles.tileBase]} />}
      face={<View style={styles.tileFaceBackground} />}
    >
      {children}
    </Pressable3DBase>
  );
};

const styles = StyleSheet.create({
  // CTA Styles
  ctaWrapper: {
    height: DIMENSIONS.rollButtonHeight,
    width: "100%",
    borderRadius: DIMENSIONS.borderRadius,
  },
  ctaDisabled: {
    opacity: 0.8,
  },
  baseLayer: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
    // Background color set inline
  },
  ctaFace: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
    // Colors set inline
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconWrapper: {
    //
  },
  textStack: {
    flexDirection: "column",
    alignItems: "center", // Centered for CTA
  },
  ctaLabel: {
    ...TYPOGRAPHY.displayMedium, // "WURF" font
    fontSize: 28,
    color: COLORS.textDark,
  },
  ctaSubLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textDark,
    opacity: 0.7,
  },

  // Tile Styles
  tileWrapper: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  tileBase: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  tileFaceBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent", // Let children dictate
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
});
