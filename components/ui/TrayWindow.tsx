import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

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
    <View style={[styles.trayWindow, style]}>
      {/* Dice tray content - fully transparent */}
      <View style={styles.trayContent}>{children}</View>

      {/* Overlay content on top of dice when present */}
      {overlay && (
        <View style={styles.trayOverlayContainer} pointerEvents="box-none">
          {overlay}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  trayWindow: {
    flex: 1,
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
});
