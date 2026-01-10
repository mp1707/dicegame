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
    cycleDuration: 150000, // 150 seconds full cycle
    translateY: 120, // pixels of vertical drift
    translateX: 20, // pixels of horizontal drift
  },
  // Secondary layer (slower, for depth)
  secondary: {
    speedRatio: 0.35, // 35% of main layer speed
    opacity: 0.2, // Low opacity for subtle depth
  },
  // Image scaling (larger than screen to allow movement)
  scale: 1.3, // 130% of screen size
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

  // Start animations on mount
  React.useEffect(() => {
    const { cycleDuration, translateY, translateX } = CONFIG.main;
    const halfCycle = cycleDuration / 2;

    // Main layer: vertical drift (0 → -translateY → 0)
    mainTranslateY.value = withRepeat(
      withSequence(
        withTiming(-translateY, {
          duration: halfCycle,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: halfCycle,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1, // Infinite repeat
      false
    );

    // Main layer: horizontal drift (0 → translateX → -translateX → 0)
    mainTranslateX.value = withRepeat(
      withSequence(
        withTiming(translateX, {
          duration: cycleDuration / 4,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-translateX, {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: cycleDuration / 4,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    // Secondary layer (slower) - offset timing for parallax effect
    const secondaryCycle = cycleDuration / CONFIG.secondary.speedRatio;
    const secondaryHalf = secondaryCycle / 2;

    secondaryTranslateY.value = withRepeat(
      withSequence(
        withTiming(-translateY * 0.7, {
          duration: secondaryHalf,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: secondaryHalf,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    secondaryTranslateX.value = withRepeat(
      withSequence(
        withTiming(-translateX * 0.5, {
          duration: secondaryCycle / 4,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(translateX * 0.5, {
          duration: secondaryCycle / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: secondaryCycle / 4,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, []);

  // Animated styles for main layer
  const mainLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: mainTranslateX.value },
      { translateY: mainTranslateY.value },
    ],
  }));

  // Animated styles for secondary layer
  const secondaryLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: secondaryTranslateX.value },
      { translateY: secondaryTranslateY.value },
    ],
  }));

  // Calculate scaled image dimensions
  const scaledWidth = screenWidth * CONFIG.scale;
  const scaledHeight = screenHeight * CONFIG.scale;

  // Center offset (to keep image centered despite scaling)
  const offsetX = (scaledWidth - screenWidth) / 2;
  const offsetY = (scaledHeight - screenHeight) / 2;

  const imageStyle = {
    width: scaledWidth,
    height: scaledHeight,
    position: "absolute" as const,
    left: -offsetX,
    top: -offsetY,
  };

  return (
    <View style={styles.container}>
      {/* Background layers container - rendered FIRST */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Main parallax layer */}
        <Animated.Image
          source={require("../../assets/purplegradient.png")}
          style={[imageStyle, mainLayerStyle]}
          resizeMode="cover"
        />

        {/* Secondary parallax layer (slower, lower opacity) */}
        <Animated.Image
          source={require("../../assets/purplegradient.png")}
          style={[
            imageStyle,
            secondaryLayerStyle,
            { opacity: CONFIG.secondary.opacity },
          ]}
          resizeMode="cover"
        />

        {/* Radial vignette overlay */}
        <View style={styles.vignetteContainer}>
          {/* Top edge darkening */}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            style={styles.vignetteTop}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Bottom edge darkening */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            style={styles.vignetteBottom}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Left edge darkening */}
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent"]}
            style={styles.vignetteLeft}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />

          {/* Right edge darkening */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            style={styles.vignetteRight}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />

          {/* Corner darkening overlays */}
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.cornerTopLeft}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.cornerTopRight}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.cornerBottomLeft}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.cornerBottomRight}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
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
    backgroundColor: COLORS.bg, // Fallback color
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
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
    height: "25%",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "15%",
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "15%",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "55%",
    height: "20%",
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "55%",
    height: "20%",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "30%",
    height: "20%",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "30%",
    height: "20%",
  },
});

export default AnimatedBackground;
