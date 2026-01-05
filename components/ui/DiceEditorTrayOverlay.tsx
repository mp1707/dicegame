import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { SlideInLeft, SlideOutRight } from "react-native-reanimated";
import { TrayOverlayTitle } from "./TrayOverlayTitle";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  hasDieAnyEnhanceableFace,
  isFaceEnhanceable,
} from "../../utils/gameCore";
import { GameText } from "../shared";
import { Surface } from "../ui-kit";

/**
 * DiceEditorTrayOverlay - Title and subtitle for dice editor phases
 *
 * Displays:
 * - Title: "WÜRFEL AUSWÄHLEN" or "SEITE AUSWÄHLEN"
 * - Subtitle: "Würfel {n}" [- "vollständig verbessert"]
 * - Enhancement Pill: Top right indicator of upgrade type
 */
export const DiceEditorTrayOverlay: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);

  // Determine title based on phase
  const title =
    phase === "DICE_EDITOR_DIE" ? "WÜRFEL AUSWÄHLEN" : "SEITE AUSWÄHLEN";

  // Determine subtitle
  let subtitle: React.ReactNode | undefined;

  if (selectedEditorDie !== null) {
    const dieNum = selectedEditorDie + 1;

    // Check if fully upgraded (Die or specific Face)
    let isEnhanceable = true;

    if (phase === "DICE_EDITOR_FACE" && selectedEditorFace !== null) {
      isEnhanceable = isFaceEnhanceable(
        selectedEditorDie,
        selectedEditorFace,
        diceEnhancements
      );
    } else {
      isEnhanceable = hasDieAnyEnhanceableFace(
        selectedEditorDie,
        diceEnhancements
      );
    }

    if (!isEnhanceable) {
      if (phase === "DICE_EDITOR_DIE") {
        subtitle = `Würfel ${dieNum} - vollständig verbessert`;
      } else {
        subtitle = "Vollständig verbessert";
      }
    } else {
      // Show info with colored enhancement text
      const upgradeLabel =
        pendingUpgradeType === "points" ? "+10 points" : "+1 mult";
      const upgradeColor =
        pendingUpgradeType === "points"
          ? COLORS.upgradePoints
          : COLORS.upgradeMult;

      const pill = (
        <Surface
          variant="panel"
          style={[styles.pill, { backgroundColor: upgradeColor }]}
          padding="sm"
        >
          <GameText
            variant="label"
            color={COLORS.text}
            style={styles.shadowText}
          >
            {upgradeLabel}
          </GameText>
        </Surface>
      );

      if (phase === "DICE_EDITOR_DIE") {
        subtitle = (
          <View style={styles.subtitleRow}>
            <GameText
              variant="bodyMedium"
              color={COLORS.text}
              style={styles.shadowText}
            >
              {`Würfel ${dieNum}`}
            </GameText>
            {pill}
          </View>
        );
      } else if (selectedEditorFace !== null) {
        subtitle = (
          <View style={styles.subtitleRow}>
            <GameText
              variant="bodyMedium"
              color={COLORS.text}
              style={styles.shadowText}
            >
              {`Seite ${selectedEditorFace}`}
            </GameText>
            {pill}
          </View>
        );
      } else {
        subtitle = pill;
      }
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        entering={SlideInLeft.duration(300)}
        exiting={SlideOutRight.duration(300)}
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
    justifyContent: "flex-start", // align to top
    paddingTop: SPACING.xl, // add top spacing
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
  },
  content: {
    alignItems: "center",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  pill: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderColor: COLORS.overlays.whiteSubtle,
    borderWidth: 1,
  },
  shadowText: {
    textShadowColor: COLORS.shadows.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
