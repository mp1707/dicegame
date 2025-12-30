import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { GameText } from "./GameText";
import { COLORS, DIMENSIONS, SPACING, ANIMATION } from "../../constants/theme";
import { triggerSelectionHaptic } from "../../utils/haptics";

// New 5-state model
export type TileButtonState =
  | "default"
  | "active"
  | "selected"
  | "used"
  | "invalid";

export interface TileButtonProps {
  icon: React.ReactNode;
  label: string;
  level?: number;
  state: TileButtonState;
  onPress: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEPTH = 4;

// Get text/icon color based on state
const getTextColor = (state: TileButtonState): string => {
  switch (state) {
    case "selected":
    case "active":
      return COLORS.text;
    case "used":
      return COLORS.gold; // Gold tint for used tiles
    case "invalid":
    case "default":
    default:
      return COLORS.tileTextMuted;
  }
};

// Get icon opacity based on state
const getContentOpacity = (state: TileButtonState): number => {
  switch (state) {
    case "invalid":
    case "default":
      return 0.5;
    default:
      return 1;
  }
};

// Check if state is pressable
const isPressableState = (state: TileButtonState): boolean => {
  return state === "active" || state === "selected";
};

export const TileButton = ({
  icon,
  label,
  level = 1,
  state,
  onPress,
  onLongPress,
  style,
}: TileButtonProps) => {
  const pressable = isPressableState(state);
  const prevState = useRef(state);

  // Animation values
  const scale = useSharedValue(1);
  const shinePosition = useSharedValue(-1);
  const pressed = useSharedValue(0);

  // Shine sweep animation when becoming selected
  useEffect(() => {
    if (state === "selected" && prevState.current !== "selected") {
      shinePosition.value = -1;
      shinePosition.value = withTiming(1.5, {
        duration: ANIMATION.tile.select.shineDuration,
        easing: Easing.out(Easing.quad),
      });
    }
    prevState.current = state;
  }, [state]);

  // Press handlers
  const handlePressIn = () => {
    if (!pressable) return;
    scale.value = withTiming(ANIMATION.tile.press.scaleDown, {
      duration: 75,
      easing: Easing.out(Easing.quad),
    });
    pressed.value = withTiming(1, { duration: 75 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springs.button);
    pressed.value = withTiming(0, { duration: 120 });
  };

  const handlePress = () => {
    if (!pressable) return;
    triggerSelectionHaptic();
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerSelectionHaptic();
      onLongPress();
    }
  };

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const faceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pressed.value, [0, 1], [0, DEPTH / 2]) },
    ],
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shinePosition.value, [-1, 1.5], [-100, 200]) },
    ],
    opacity: interpolate(
      shinePosition.value,
      [-1, 0, 0.5, 1.5],
      [0, 0.6, 0.4, 0]
    ),
  }));

  // Get styles based on state
  // IMPORTANT: Use consistent borderWidth (2px) across ALL states to prevent layout shift
  const getFaceStyles = () => {
    const base = {
      backgroundColor: COLORS.tile,
      borderColor: COLORS.overlays.whiteMild,
      borderWidth: 2,
      borderTopWidth: 2,
      borderTopColor: COLORS.overlays.whiteMedium,
      borderBottomWidth: 3,
      borderBottomColor: COLORS.overlays.blackMedium,
    };

    switch (state) {
      case "active":
        return {
          ...base,
          // Keep lift effect via thicker bottom shadow
          borderBottomWidth: 4,
          borderBottomColor: COLORS.overlays.blackMedium,
        };

      case "selected":
        return {
          ...base,
          // Only change COLOR, not width (prevents layout shift)
          borderColor: COLORS.cyan,
          borderTopWidth: 2,
          borderTopColor: COLORS.overlays.whiteStrong,
          borderBottomWidth: 4,
          borderBottomColor: COLORS.overlays.blackStrong,
        };

      case "used":
        return {
          backgroundColor: COLORS.tileDisabled,
          borderColor: COLORS.overlays.whiteMild,
          borderWidth: 2,
          borderTopWidth: 2,
          borderTopColor: COLORS.overlays.whiteSubtle,
          borderBottomWidth: 2,
          borderBottomColor: COLORS.overlays.blackSubtle,
        };

      case "invalid":
      case "default":
      default:
        return {
          backgroundColor: COLORS.tileDisabled,
          borderColor: COLORS.overlays.blackMild,
          borderWidth: 2,
          borderTopWidth: 2,
          borderTopColor: COLORS.overlays.blackMedium,
          borderBottomWidth: 2,
          borderBottomColor: COLORS.overlays.whiteSubtle,
        };
    }
  };

  const faceStyles = getFaceStyles();
  const textColor = getTextColor(state);
  const contentOpacity = getContentOpacity(state);
  const showShine = state === "selected";

  // Shadow for selected state
  const shadowStyle =
    state === "selected"
      ? {
          shadowColor: COLORS.cyan,
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        }
      : {};

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
      style={[styles.wrapper, style]}
    >
      <Animated.View
        style={[styles.container, containerAnimatedStyle, shadowStyle]}
      >
        {/* Base layer (shadow/depth) */}
        <View style={styles.base} />

        {/* Face layer */}
        <Animated.View style={[styles.face, faceStyles, faceAnimatedStyle]}>
          {/* Shine sweep overlay */}
          {showShine && (
            <Animated.View style={[styles.shineOverlay, shineAnimatedStyle]} />
          )}

          {/* Content */}
          <View style={[styles.content, { opacity: contentOpacity }]}>
            {/* Top bar: Level badge (left) + State glyph (right) */}
            <View style={styles.topBar}>
              <View style={styles.levelBadge}>
                <GameText variant="caption" style={styles.badgeText}>
                  LV{level}
                </GameText>
              </View>
              {/* Only show checkmark for used state */}
              {state === "used" && (
                <View style={styles.stateGlyph}>
                  <Check size={10} color={COLORS.gold} strokeWidth={3} />
                </View>
              )}
            </View>

            {/* Center: Icon */}
            <View style={styles.iconContainer}>{icon}</View>

            {/* Bottom: Label */}
            <GameText
              variant="caption"
              color={textColor}
              numberOfLines={1}
              style={styles.label}
            >
              {label}
            </GameText>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  container: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlays.blackStrong,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    top: DEPTH,
  },
  face: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
  },
  shineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 60,
    height: "100%",
    backgroundColor: COLORS.overlays.whiteStrong,
    transform: [{ skewX: "-20deg" }],
  },
  content: {
    flex: 1,
    padding: SPACING.xs, // Reduced from SPACING.sm to move badge closer to edge
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 14,
    marginBottom: SPACING.xxs, // Reduced from SPACING.xs
  },
  levelBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: SPACING.xs,
    backgroundColor: COLORS.overlays.whiteMedium,
  },
  badgeText: {
    fontSize: 6,
    letterSpacing: 0.3,
  },
  stateGlyph: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 7,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
