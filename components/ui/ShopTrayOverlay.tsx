import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { GameText } from "../shared";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";

/**
 * ShopTrayOverlay - Title and subtitle for the dice tray area during SHOP_MAIN phase
 *
 * Displays:
 * - "SHOP" title (centered, no icon)
 * - "Wähle ein Upgrade" subtitle
 */
export const ShopTrayOverlay: React.FC = () => {
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
          color={COLORS.text}
          style={styles.title}
        >
          SHOP
        </GameText>
        <GameText
          variant="bodySmall"
          color={COLORS.textMuted}
          style={styles.subtitle}
        >
          Wähle ein Upgrade
        </GameText>
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
});
