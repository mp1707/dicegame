import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

/**
 * DiceEditorTrayOverlay - Title and subtitle for dice editor phases
 *
 * Displays:
 * - Title: "Würfel wählen" or "Seite wählen"
 * - Subtitle: "Schritt 1/2" or "Schritt 2/2"
 */
export const DiceEditorTrayOverlay: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  // Determine title based on phase
  const title = phase === "DICE_EDITOR_DIE" ? "Würfel wählen" : "Seite wählen";

  // Determine subtitle - step indicator
  const subtitle = phase === "DICE_EDITOR_DIE" ? "Schritt 1/2" : "Schritt 2/2";

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={FadeInUp.duration(250)}
        exiting={FadeOutDown.duration(200)}
        style={styles.content}
        key={phase}
      >
        <TrayOverlayTitle title={title} subtitle={subtitle} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: SPACING.xl,
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
  },
  content: {
    alignItems: "center",
  },
});
