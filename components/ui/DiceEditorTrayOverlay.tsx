import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { isFaceEnhanceable } from "../../utils/gameCore";

/**
 * DiceEditorTrayOverlay - Title and subtitle for dice editor phases
 *
 * Displays:
 * - DICE_EDITOR_DIE: "WÜRFEL AUSWÄHLEN" + "Würfel {n}"
 * - DICE_EDITOR_FACE: "SEITE AUSWÄHLEN" + "Vollständig verbessert" (if applicable)
 */
export const DiceEditorTrayOverlay: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);

  // Determine title based on phase
  const title =
    phase === "DICE_EDITOR_DIE" ? "WÜRFEL AUSWÄHLEN" : "SEITE AUSWÄHLEN";

  // Determine subtitle
  let subtitle: string | undefined;

  if (phase === "DICE_EDITOR_DIE" && selectedEditorDie !== null) {
    subtitle = `Würfel ${selectedEditorDie + 1}`;
  } else if (
    phase === "DICE_EDITOR_FACE" &&
    selectedEditorDie !== null &&
    selectedEditorFace !== null &&
    !isFaceEnhanceable(selectedEditorDie, selectedEditorFace, diceEnhancements)
  ) {
    subtitle = "Vollständig verbessert";
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={SlideInLeft.duration(300)}
        exiting={SlideOutRight.duration(300)}
        style={styles.content}
        // Force re-mount on phase change to re-trigger animation if desired,
        // or keep unique key to sync title change with animation.
        // Title text changes, so maybe we want smooth transition?
        // User asked for "slide in... like bottom content". Bottom content slides entire panel.
        key={phase} // This ensures the slide animation triggers when switching between Die and Face selection
      >
        <TrayOverlayTitle title={title} subtitle={subtitle} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start", // align to top
    paddingTop: SPACING.xl, // add top spacing
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    // Add zIndex to ensure it sits above the 3D dice tray which is now in background
    zIndex: 20,
  },
  content: {
    alignItems: "center",
  },
});
