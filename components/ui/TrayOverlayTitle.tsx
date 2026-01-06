import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";
import { GameText } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";

interface TrayOverlayTitleProps {
  title: string;
  subtitle?: React.ReactNode;
  color?: string;
}

/**
 * TrayOverlayTitle - Consistent title component for tray overlays
 *
 * Visuals:
 * - Title: Big, white (or colored), drop shadow
 * - Subtitle: Smaller, white, drop shadow (optional)
 * - Animation: Fade in + move up (not sideways slide)
 */
export const TrayOverlayTitle: React.FC<TrayOverlayTitleProps> = ({
  title,
  subtitle,
  color = COLORS.text,
}) => {
  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <GameText variant="displayLarge" color={color} style={styles.title}>
        {title}
      </GameText>
      {typeof subtitle === "string" ? (
        <GameText
          variant="bodyMedium"
          color={COLORS.text}
          style={styles.subtitle}
        >
          {subtitle}
        </GameText>
      ) : subtitle ? (
        <View style={styles.subtitleContainer}>{subtitle}</View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    textAlign: "center",
    textShadowColor: COLORS.shadows.black,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: "center",
    marginTop: SPACING.xs,
    opacity: 0.9,
    textShadowColor: COLORS.shadows.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitleContainer: {
    marginTop: SPACING.xs,
    alignItems: "center",
  },
});
