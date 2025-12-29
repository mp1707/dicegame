import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";

// Layout constants
const RAIL_WIDTH = 56; // Per spec: 52-64px range, 56px primary target
const DIVIDER_WIDTH = 3; // 1px highlight + 2px shadow

interface TrayModuleProps {
  /** The EdgeThermometer content (rail inset) */
  railContent: React.ReactNode;
  /** The DiceTray/Canvas content (felt inset) */
  feltContent: React.ReactNode;
  /** Total height of the module */
  height: number;
  /** Additional style for outer container */
  style?: ViewStyle;
}

/**
 * TrayModule - Unified container for the dice tray + goal thermometer
 *
 * Creates a single "tabletop module" with:
 * - One outer frame with bevel (panel surface)
 * - Two inset compartments: Rail (left) + Felt (right)
 * - Divider seam between compartments
 * - Shared visual language throughout
 */
export const TrayModule: React.FC<TrayModuleProps> = ({
  railContent,
  feltContent,
  height,
  style,
}) => {
  return (
    <View style={[styles.outerFrame, { height }, style]}>
      {/* Inner container with both compartments */}
      <View style={styles.innerContainer}>
        {/* Rail Inset (left column) */}
        <View style={[styles.railInset, { width: RAIL_WIDTH }]}>
          {railContent}
        </View>

        {/* Divider Seam */}
        <View style={styles.dividerSeam}>
          <View style={styles.dividerHighlight} />
          <View style={styles.dividerShadow} />
        </View>

        {/* Felt Inset (right column - flexible) */}
        <View style={styles.feltInset}>
          {/* Canvas container with rounded clipping */}
          <View style={styles.canvasClip}>{feltContent}</View>

          {/* Subtle depth overlay - inner shadow effect (reduced ~50% per spec §4) */}
          <View style={styles.depthOverlay} pointerEvents="none">
            {/* Edge shadows (top/left/right/bottom) - softer for felt-like feel */}
            <LinearGradient
              colors={["rgba(0,0,0,0.09)", "rgba(0,0,0,0.03)", "transparent"]}
              locations={[0, 0.15, 0.4]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topShadow}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.02)", "transparent"]}
              locations={[0, 0.15, 0.35]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.bottomShadow}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.02)", "transparent"]}
              locations={[0, 0.12, 0.3]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.leftShadow}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.02)", "transparent"]}
              locations={[0, 0.12, 0.3]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
              style={styles.rightShadow}
            />
          </View>

          {/* Gentle center lift (very subtle per spec §4.2) */}
          <View style={styles.centerLiftContainer} pointerEvents="none">
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.015)", "transparent"]}
              locations={[0.2, 0.5, 0.8]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const OUTER_RADIUS = DIMENSIONS.borderRadiusLarge;
const INNER_RADIUS = OUTER_RADIUS - 3;

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: OUTER_RADIUS,
    // Outer bevel - raised frame effect (per spec §3.1)
    borderWidth: 3,
    borderTopColor: COLORS.overlays.whiteMild, // Top highlight (thin)
    borderLeftColor: COLORS.overlays.whiteMild,
    borderRightColor: COLORS.overlays.blackMedium, // Bottom/right shadow (thicker)
    borderBottomColor: COLORS.overlays.blackMedium,
    // Frame surface color
    backgroundColor: COLORS.surface,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    // Inner lip shadow - only on top/left/bottom, not right (felt fills to edge)
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 0,
    borderTopColor: COLORS.overlays.blackMild,
    borderLeftColor: COLORS.overlays.blackMild,
    borderBottomColor: COLORS.overlays.whiteSubtle,
    borderTopLeftRadius: INNER_RADIUS,
    borderBottomLeftRadius: INNER_RADIUS,
    borderTopRightRadius: INNER_RADIUS,
    borderBottomRightRadius: INNER_RADIUS,
    overflow: "hidden",
  },
  railInset: {
    backgroundColor: COLORS.bg,
  },
  dividerSeam: {
    width: DIVIDER_WIDTH,
    flexDirection: "row",
  },
  dividerHighlight: {
    width: 1,
    backgroundColor: COLORS.overlays.whiteSubtle,
  },
  dividerShadow: {
    width: 2,
    backgroundColor: COLORS.overlays.blackMild,
  },
  feltInset: {
    flex: 1,
    position: "relative",
    // Rounded on right side to match outerFrame
    borderTopRightRadius: OUTER_RADIUS - 3,
    borderBottomRightRadius: OUTER_RADIUS - 3,
    overflow: "hidden",
  },
  canvasClip: {
    flex: 1,
    borderTopRightRadius: OUTER_RADIUS - 3,
    borderBottomRightRadius: OUTER_RADIUS - 3,
    overflow: "hidden",
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Match feltInset rounding
    borderTopRightRadius: OUTER_RADIUS - 3,
    borderBottomRightRadius: OUTER_RADIUS - 3,
    overflow: "hidden",
  },
  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
  },
  bottomShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  leftShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "20%",
  },
  rightShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "20%",
  },
  centerLiftContainer: {
    ...StyleSheet.absoluteFillObject,
    // Match feltInset rounding
    borderTopRightRadius: OUTER_RADIUS - 3,
    borderBottomRightRadius: OUTER_RADIUS - 3,
    overflow: "hidden",
  },
});
