import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Image,
  ImageSourcePropType,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { GameText } from "./GameText";
import { COLORS, DIMENSIONS, SPACING, ANIMATION } from "../../constants/theme";

// 5-state model
export type TileButtonState =
  | "default"
  | "active"
  | "selected"
  | "used"
  | "invalid";

export interface TileButtonProps {
  icon?: React.ReactNode;
  iconSource?: ImageSourcePropType;
  labelLine1: string;
  labelLine2?: string;
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
      return COLORS.goldDark;
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
  iconSource,
  labelLine1,
  labelLine2,
  level = 1,
  state,
  onPress,
  onLongPress,
  style,
}: TileButtonProps) => {
  const pressable = isPressableState(state);
  const prevState = useRef(state);

  // Shine sweep animation value
  const shinePosition = useSharedValue(-1);

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

  // Get face styles based on state
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
          borderBottomWidth: 4,
          borderBottomColor: COLORS.overlays.blackMedium,
        };

      case "selected":
        return {
          ...base,
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

  // Shadow/glow for selected state
  const glowStyle =
    state === "selected"
      ? {
          shadowColor: COLORS.cyan,
          shadowOpacity: 0.6,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }
      : {};

  const renderIcon = () => {
    if (state === "used") {
      return <Check size={18} color={COLORS.goldDark} strokeWidth={2.5} />;
    }

    if (iconSource) {
      return (
        <Image
          source={iconSource}
          style={{
            width: 28,
            height: 28,
            opacity: state === "selected" ? 1 : 0.8,
          }}
          resizeMode="contain"
        />
      );
    }

    return icon;
  };

  return (
    <View style={[styles.wrapper, glowStyle, style]}>
      <Pressable3DBase
        onPress={onPress}
        disabled={!pressable}
        depth={DEPTH}
        borderRadius={DIMENSIONS.borderRadiusSmall}
        hapticOnPressIn={state === "selected" ? "none" : "selection"}
        hapticOnPress="none"
        showLighting={false}
        style={styles.pressable}
        base={<View style={styles.base} />}
        face={
          <View style={[styles.face, faceStyles]}>
            {/* Shine sweep overlay for selected state */}
            {showShine && (
              <Animated.View
                style={[styles.shineOverlay, shineAnimatedStyle]}
              />
            )}
          </View>
        }
      >
        <View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Level badge - top right corner */}
          <View style={styles.levelBadge}>
            <GameText variant="caption" style={styles.badgeText}>
              LV{level}
            </GameText>
          </View>

          {/* Center: Icon (or checkmark if used) */}
          <View style={styles.iconContainer}>{renderIcon()}</View>

          {/* Bottom: Label (explicit two-line support) */}
          <View style={styles.labelContainer}>
            <GameText variant="body" color={textColor} style={styles.labelText}>
              {labelLine1}
            </GameText>
            {labelLine2 !== undefined && (
              <GameText
                variant="body"
                color={textColor}
                style={styles.labelText}
              >
                {labelLine2}
              </GameText>
            )}
          </View>
        </View>
      </Pressable3DBase>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
  },
  pressable: {
    width: "100%",
    height: "100%",
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  base: {
    flex: 1,
    backgroundColor: COLORS.overlays.blackStrong,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
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
    padding: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadge: {
    position: "absolute",
    top: 5,
    right: -4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: SPACING.xs,
    backgroundColor: COLORS.overlays.whiteMedium,
  },
  badgeText: {
    fontSize: 6,
    letterSpacing: 0.3,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xxs,
  },
  labelContainer: {
    alignItems: "center",
  },
  labelText: {
    textAlign: "center",
    lineHeight: 12,
  },
});
