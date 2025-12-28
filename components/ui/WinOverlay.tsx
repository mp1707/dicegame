import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { COLORS, FONT_FAMILY, ANIMATION, TYPOGRAPHY } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

export const WinOverlay = () => {
  const phase = useGameStore((s) => s.phase);
  const isVisible = phase === "CASHOUT_CHOICE";

  const opacity = useSharedValue(0);
  const textPulse = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in the overlay
      opacity.value = withTiming(1, {
        duration: ANIMATION.winOverlay.fadeIn,
        easing: Easing.out(Easing.ease),
      });

      // Pulse the text opacity between 0.7 and 1.0
      textPulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: ANIMATION.winOverlay.pulseUp,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: ANIMATION.winOverlay.pulseDown,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite repeat
        false
      );
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: ANIMATION.winOverlay.fadeOut });
      textPulse.value = 0;
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isVisible ? "auto" : "none",
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(textPulse.value, [0, 1], [0.6, 1]),
    transform: [
      {
        scale: interpolate(textPulse.value, [0, 1], [
          ANIMATION.winOverlay.pulseScaleMin,
          ANIMATION.winOverlay.pulseScaleMax,
        ]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.Text style={[styles.winText, textStyle]}>YOU WON!</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlays.backdropStrong,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  winText: {
    ...TYPOGRAPHY.displayHuge,
    fontSize: 48,
    textAlign: "center",
    textShadowColor: COLORS.shadows.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
});
