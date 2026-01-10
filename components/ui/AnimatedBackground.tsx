/**
 * AnimatedBackground.tsx
 *
 * Balatro-style animated ambient background with:
 * - Ultra-slow parallax layers
 * - Radial vignette overlay
 * - Seamless looping
 *
 * Performance: All animations run on UI thread via react-native-reanimated
 */
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/theme";

// Animation configuration
const CONFIG = {
  // Main layer animation (primary parallax)
  main: {
    // Independent durations for X/Y to create organic, non-repeating paths
    durationX: 23000,
    durationY: 19000,
    translateY: 80, // Reduced from 350 - extremely subtle drift
    translateX: 60, // Reduced from 150
  },
  // Secondary layer (slower, for depth)
  secondary: {
    speedRatio: 1.6,
    opacity: 0.5,
  },
  // Breathing animation (slow scale pulse)
  breathing: {
    duration: 15000,
    minScale: 1.8,
    maxScale: 2.1,
  },
};

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Shared values for main layer
  const mainTranslateY = useSharedValue(0);
  const mainTranslateX = useSharedValue(0);

  // Shared values for secondary layer (slower)
  const secondaryTranslateY = useSharedValue(0);
  const secondaryTranslateX = useSharedValue(0);

  // Shared value for breathing scale
  const breatheScale = useSharedValue(CONFIG.breathing.minScale);

  // Start animations on mount
  React.useEffect(() => {
    const { durationX, durationY, translateY, translateX } = CONFIG.main;

    // Breathing (Scale) Animation
    breatheScale.value = withRepeat(
      withTiming(CONFIG.breathing.maxScale, {
        duration: CONFIG.breathing.duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Main layer: vertical drift
    mainTranslateY.value = withRepeat(
      withTiming(translateY, {
        duration: durationY,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Main layer: horizontal drift
    mainTranslateX.value = -translateX;
    mainTranslateX.value = withRepeat(
      withTiming(translateX, {
        duration: durationX,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Secondary layer (slower)
    const secDurX = durationX * CONFIG.secondary.speedRatio;
    const secDurY = durationY * CONFIG.secondary.speedRatio;

    secondaryTranslateY.value = withRepeat(
      withTiming(-translateY * 0.7, {
        duration: secDurY,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    secondaryTranslateX.value = withRepeat(
      withTiming(translateX * 0.5, {
        duration: secDurX,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  // Animated styles for main layer
  const mainLayerStyle = useAnimatedStyle(() => ({
    width: screenWidth * breatheScale.value,
    height: screenHeight * breatheScale.value,
    transform: [
      { translateX: mainTranslateX.value },
      { translateY: mainTranslateY.value },
    ],
    // Center the scaling
    left: -(screenWidth * breatheScale.value - screenWidth) / 2,
    top: -(screenHeight * breatheScale.value - screenHeight) / 2,
  }));

  // Animated styles for secondary layer
  const secondaryLayerStyle = useAnimatedStyle(() => ({
    width: screenWidth * breatheScale.value,
    height: screenHeight * breatheScale.value,
    transform: [
      { translateX: secondaryTranslateX.value },
      { translateY: secondaryTranslateY.value },
    ],
    left: -(screenWidth * breatheScale.value - screenWidth) / 2,
    top: -(screenHeight * breatheScale.value - screenHeight) / 2,
  }));

  return (
    <View style={styles.container}>
      {/* Background layers container - rendered FIRST */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Main parallax layer */}
        <Animated.Image
          source={require("../../assets/purplegradient.png")}
          style={[styles.absoluteImage, mainLayerStyle]}
          resizeMode="cover"
        />

        {/* Secondary parallax layer (slower, lower opacity) */}
        <Animated.Image
          source={require("../../assets/purplegradient.png")}
          style={[
            styles.absoluteImage,
            secondaryLayerStyle,
            { opacity: CONFIG.secondary.opacity },
          ]}
          resizeMode="cover"
        />

        {/* Vignette overlay - Deep Purple (Theme Background Dark) */}
        {/* Using rgba(26, 21, 40, alpha) instead of black to avoid blue tint */}
        <View style={styles.vignetteContainer}>
          {/* Top edge - Subtle gradient down (35% height) */}
          <LinearGradient
            colors={[
              "rgba(26, 21, 40, 0.5)",
              "rgba(26, 21, 40, 0.2)",
              "transparent",
            ]}
            style={styles.vignetteTop}
          />

          {/* Bottom edge - Subtle gradient up (35% height) */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(26, 21, 40, 0.2)",
              "rgba(26, 21, 40, 0.6)",
            ]}
            style={styles.vignetteBottom}
          />

          {/* Left edge - Subtle gradient right (20% width) */}
          <LinearGradient
            colors={[
              "rgba(26, 21, 40, 0.5)",
              "rgba(26, 21, 40, 0.15)",
              "transparent",
            ]}
            style={styles.vignetteLeft}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />

          {/* Right edge - Subtle gradient left (20% width) */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(26, 21, 40, 0.15)",
              "rgba(26, 21, 40, 0.5)",
            ]}
            style={styles.vignetteRight}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </View>
      </View>

      {/* Children (game content) - rendered on TOP with absolute fill */}
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
  absoluteImage: {
    position: "absolute",
    // Width/Height/Top/Left handled by animated styles
  },
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  vignetteContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%", // Increased from 25% for smoother fade
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
  },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "20%",
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "20%",
  },
});

export default AnimatedBackground;
