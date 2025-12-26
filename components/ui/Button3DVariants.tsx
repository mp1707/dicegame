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

  // Base Color: Darker version of the main color or a generic dark well
  const baseColor = "#1A1528"; // rough darken of cyan, or we can use surface2

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadius}
      style={[styles.ctaWrapper, style, disabled && styles.ctaDisabled]}
      // BASE: The dark "well" showing the depth
      base={
        <View
          style={[
            styles.baseLayer,
            { backgroundColor: disabled ? COLORS.surface2 : baseColor },
          ]}
        />
      }
      // FACE: The gradient button surface
      face={
        <LinearGradient
          colors={
            disabled ? [COLORS.surface2, COLORS.surface2] : (colors as any)
          }
          style={styles.faceGradient}
        >
          {/* Top Edge Highlight / Lip - "Give the face a tiny bottom edge" ... or top? 
              Request said: "Give the face a tiny bottom edge (1–2px darker band)" to sell thickness
          */}
          <View style={styles.faceBottomEdge} />
        </LinearGradient>
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

  // Visual states based on selection/variant
  // We want to preserve the existing look but add depth
  // The existing look uses borders.
  // Ideally, the "Face" carries the border.
  // The "Base" is just the shadow color.

  return (
    <Pressable3DBase
      onPress={onPress}
      disabled={disabled}
      depth={DEPTH}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      hapticOnPressIn={selected ? "none" : "selection"}
      style={[styles.tileWrapper, style]}
      base={<View style={[styles.baseLayer, styles.tileBase]} />}
      face={
        // The face is transparent here because the children (ScoreSlot) usually have their own background/border.
        // WAIT. The requested architecture says "Face + Base + Lighting".
        // If we wrap existing children (which have borders/fills), and we move them, that's the Face.
        // But we need the "Base" to be visible *behind* them when they move.
        // And we need the Lighting overlay *on top*.

        // So for Tile3DButton, we act as a container.
        // The "Face" prop in Pressable3DBase expects a node.
        // But here we might want to just render the children AS the face content?
        // Let's pass null to face prop and let children be the content inside the face container.
        // But Pressable3DBase puts children IN the content container.
        // Face prop is for the BACKGROUND of the face.

        // If the children are fully styled (like ScoreRow), they might cover everything.
        // However, ScoreRow usually has `flex: 1` or specific dimensions.
        // To make this work reusable, maybe we assume the Tile3DButton *IS* the visual container?
        // In the current codebase, `TileButton` wraps `children`.
        // Let's pass a View as the face background.
        <View style={styles.tileFaceBackground} />
      }
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
    // We need overflow visible to not clip the base if it sticks out?
    // Actually, Base is same size, we just reveal it by moving face.
  },
  ctaDisabled: {
    opacity: 0.8,
  },
  baseLayer: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: COLORS.shadow, // Default deep shadow color
  },
  faceGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DIMENSIONS.borderRadius,
    // borderBottomWidth: 4, // Remove old fake border
  },
  faceBottomEdge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
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
    // Tiles often define their own height in the parent grid
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  tileBase: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Darker well for tiles
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  tileFaceBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent", // Let children dictate
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
});
