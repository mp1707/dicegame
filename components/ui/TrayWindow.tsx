import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/theme";
import { Surface } from "../ui-kit";

interface TrayWindowProps {
  children: React.ReactNode;
  overlay?: React.ReactNode;
  style?: ViewStyle;
}

export const TrayWindow: React.FC<TrayWindowProps> = ({
  children,
  overlay,
  style,
}) => {
  return (
    <Surface variant="panel" padding="none" style={[styles.trayWindow, style]}>
      <View style={styles.trayInset}>
        {/* Always render the dice tray (green felt) */}
        <View style={styles.trayContent}>{children}</View>

        {/* Overlay content on top of dice when present */}
        {overlay && (
          <View style={styles.trayOverlayContainer} pointerEvents="box-none">
            {overlay}
          </View>
        )}

        {/* Depth overlay */}
        <View style={styles.depthOverlay} pointerEvents="none">
          <LinearGradient
            colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.04)", "transparent"]}
            locations={[0, 0.15, 0.4]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topShadow}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.02)", "transparent"]}
            locations={[0, 0.12, 0.3]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.leftShadow}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.02)", "transparent"]}
            locations={[0, 0.12, 0.3]}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={styles.rightShadow}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  trayWindow: {
    flex: 1,
    overflow: "hidden",
  },
  trayInset: {
    flex: 1,
    backgroundColor: COLORS.bg, // Fallback, normally diceTray has bg
    overflow: "hidden",
  },
  trayContent: {
    flex: 1,
    overflow: "hidden",
  },
  trayOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    pointerEvents: "none",
  },
  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  leftShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "15%",
  },
  rightShadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "15%",
  },
});
