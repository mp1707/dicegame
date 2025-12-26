import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BasePressableAnimated } from "./BasePressableAnimated";
import { COLORS, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";

interface PrimaryCTAButtonProps {
  onPress: () => void;
  label: string;
  subLabel?: string; // e.g. "ROLLING..."
  icon?: React.ReactNode;
  disabled?: boolean;
  colors?: readonly [string, string]; // Gradient colors
  style?: ViewStyle;
  children?: React.ReactNode; // Function as child or custom content
}

export const PrimaryCTAButton = ({
  onPress,
  label,
  subLabel,
  icon,
  disabled = false,
  colors = [COLORS.cyan, "#0098B3"],
  style,
  children,
}: PrimaryCTAButtonProps) => {
  return (
    <BasePressableAnimated
      onPress={onPress}
      disabled={disabled}
      hapticOnPress={disabled ? "none" : "medium"}
      style={[styles.primaryWrapper, style || {}]}
    >
      <LinearGradient
        colors={disabled ? [COLORS.surface2, COLORS.surface2] : colors}
        style={[styles.primaryGradient, disabled && styles.disabled]}
      >
        <View style={styles.overlayHighlight} />
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          {children || (
            <View style={styles.textStack}>
              <Text
                style={[
                  styles.primaryLabel,
                  disabled && { color: COLORS.textMuted },
                ]}
              >
                {label}
              </Text>
              {subLabel && (
                <Text style={styles.primarySubLabel}>{subLabel}</Text>
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </BasePressableAnimated>
  );
};

export const TileButton = ({
  onPress,
  selected,
  disabled,
  children,
  style,
}: {
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}) => {
  return (
    <BasePressableAnimated
      onPress={onPress}
      disabled={disabled}
      scaleActive={0.92}
      hapticOnPressIn={selected ? "none" : "selection"} // Don't haptic if already selected? Or maybe always. User said "PressIn = light/selection".
      hapticOnPress="medium"
      style={style}
    >
      {/* Visual content handled by parent currently, this just wraps behavior */}
      {children}
    </BasePressableAnimated>
  );
};

export const IconButton = ({
  onPress,
  icon,
  style,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
}) => {
  return (
    <BasePressableAnimated
      onPress={onPress}
      scaleActive={0.9}
      style={[styles.iconButton, style || {}]}
    >
      {icon}
    </BasePressableAnimated>
  );
};

const styles = StyleSheet.create({
  primaryWrapper: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 1, // Sharp shadow
    elevation: 8,
  },
  primaryGradient: {
    height: DIMENSIONS.rollButtonHeight,
    borderRadius: DIMENSIONS.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  disabled: {
    borderBottomWidth: 0,
    elevation: 0,
  },
  overlayHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrapper: {
    //
  },
  textStack: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  primaryLabel: {
    color: COLORS.textDark,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
    lineHeight: 26,
    letterSpacing: 2,
  },
  primarySubLabel: {
    //
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
  },
});
