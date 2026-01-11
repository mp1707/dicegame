/**
 * AnimatedBackground.tsx
 *
 * Static background using purple gradient for better performance.
 * Replaces the heavy animated version.
 */
import React from "react";
import { StyleSheet, View, Image } from "react-native";
import { COLORS } from "../../constants/theme";

interface StaticBackgroundProps {
  children: React.ReactNode;
}

export const StaticBackground: React.FC<StaticBackgroundProps> = ({
  children,
}) => {
  return (
    <View style={styles.container}>
      {/* Background container */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <Image
          source={require("../../assets/purplegradient.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Vignette effect could be re-added here if needed, but keeping it clean for now as per "static background" request */}
      </View>

      {/* Children (game content) */}
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default StaticBackground;
