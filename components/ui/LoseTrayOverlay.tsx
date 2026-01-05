import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

/**
 * LoseTrayOverlay - Overlay for the dice tray when game is lost
 *
 * Displays:
 * - "VERLOREN" title in Red
 * - Subtitle with level failure info
 */
export const LoseTrayOverlay: React.FC = () => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const levelNumber = currentLevelIndex + 1;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={styles.content}
      >
        <TrayOverlayTitle
          title="VERLOREN"
          subtitle={`Failed at Level ${levelNumber}`}
          color={COLORS.coral}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    // Add semi-transparent background to improve visibility over 3D scene
    backgroundColor: COLORS.overlays.backdrop,
  },
  content: {
    alignItems: "center",
  },
});
