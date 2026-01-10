import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { DIMENSIONS, COLORS } from "../../constants/theme";

interface GlassPanelProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * GlassPanel - A semi-transparent panel without 3D seams.
 * Used for item slots and score grid items in the new UI style.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({ style, children }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Semi-transparent dark background
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
  },
});
