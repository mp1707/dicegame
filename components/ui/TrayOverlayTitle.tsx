import React from "react";
import { View, StyleSheet } from "react-native";
import { GameText } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";

interface TrayOverlayTitleProps {
  title: string;
  subtitle?: React.ReactNode;
}

/**
 * TrayOverlayTitle - Consistent title component for tray overlays
 *
 * Visuals:
 * - Title: Big, white, drop shadow
 * - Subtitle: Smaller, white, drop shadow (optional)
 */
export const TrayOverlayTitle: React.FC<TrayOverlayTitleProps> = ({
  title,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <GameText variant="displayLarge" color={COLORS.text} style={styles.title}>
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
      ) : (
        <View style={styles.subtitleContainer}>{subtitle}</View>
      )}
    </View>
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
