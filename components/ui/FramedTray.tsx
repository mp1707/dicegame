import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, DIMENSIONS } from "../../constants/theme";

interface FramedTrayProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * FramedTray - Premium frame wrapper for the 3D dice tray
 * Provides a 3D beveled frame with inset felt effect and vignette overlay
 */
export const FramedTray: React.FC<FramedTrayProps> = ({ children, style }) => {
  return (
    <View style={[styles.frame, style]}>
      <View style={styles.inner}>
        {children}

        {/* Vignette overlay - darkens edges for depth */}
        <View style={styles.vignetteContainer} pointerEvents="none">
          {/* Horizontal vignette (left/right edges) */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.35)",
              "transparent",
              "transparent",
              "rgba(0,0,0,0.35)",
            ]}
            locations={[0, 0.15, 0.85, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Vertical vignette (top/bottom edges) */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.25)",
              "transparent",
              "transparent",
              "rgba(0,0,0,0.25)",
            ]}
            locations={[0, 0.2, 0.8, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadius,
    // Outer bevel (raised edge effect)
    borderWidth: 3,
    borderTopColor: COLORS.overlays.whiteMild,
    borderLeftColor: COLORS.overlays.whiteMild,
    borderRightColor: COLORS.overlays.blackMedium,
    borderBottomColor: COLORS.overlays.blackMedium,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    // Inner recessed border
    borderWidth: 2,
    borderColor: COLORS.overlays.blackMild,
    borderRadius: DIMENSIONS.borderRadius - 3,
    overflow: "hidden",
  },
  vignetteContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DIMENSIONS.borderRadius - 5,
    overflow: "hidden",
  },
});
