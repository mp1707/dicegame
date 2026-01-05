import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { GameText } from "../shared";

interface TrayOverlayProps {
  /** Main title text (centered) */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Title color (defaults to gold) */
  titleColor?: string;
  /** Optional custom content rendered below title/subtitle */
  children?: React.ReactNode;
}

/**
 * TrayOverlay - Centered overlay for the dice tray area
 *
 * Used during after-win phases (cashout, shop) to display
 * phase-specific titles and content in the tray space.
 *
 * Features:
 * - Fade-in with subtle drop animation on mount
 * - Centered layout
 * - Consistent styling across phases
 */
export const TrayOverlay: React.FC<TrayOverlayProps> = ({
  title,
  subtitle,
  titleColor = COLORS.gold,
  children,
}) => {
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animStyle]}>
        <GameText
          variant="displaySmall"
          color={titleColor}
          style={styles.title}
        >
          {title}
        </GameText>

        {subtitle && (
          <GameText
            variant="bodySmall"
            color={COLORS.textMuted}
            style={styles.subtitle}
          >
            {subtitle}
          </GameText>
        )}

        {children && <View style={styles.childrenContainer}>{children}</View>}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  content: {
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  childrenContainer: {
    marginTop: SPACING.md,
    width: "100%",
    alignItems: "center",
  },
});
