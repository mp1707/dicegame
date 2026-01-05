import React from "react";
import { View, StyleSheet } from "react-native";
import { DiePreview3D } from "./ui/DiePreview3D";
import { useGameStore } from "../store/gameStore";
import { getNextEnhanceablePipIndex } from "../utils/gameCore";

interface SingleDiePreviewProps {
  containerHeight: number;
  containerWidth: number;
}

/**
 * SingleDiePreview - Wrapper for DiePreview3D that connects to the game store
 *
 * Used during DICE_EDITOR_DIE and DICE_EDITOR_FACE phases to show a single
 * large rotatable die in the PlayConsole tray area.
 *
 * NOTE: Titles and subtitles are now handled by DiceEditorTrayOverlay.
 */
export const SingleDiePreview: React.FC<SingleDiePreviewProps> = ({
  containerHeight,
  containerWidth,
}) => {
  const phase = useGameStore((s) => s.phase);
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);
  const selectEditorFace = useGameStore((s) => s.selectEditorFace);
  const enhancedFace = useGameStore((s) => s.enhancedFace);
  const enhancedPipIndex = useGameStore((s) => s.enhancedPipIndex);

  // Compute preview pip for DICE_EDITOR_FACE phase
  // Don't show preview if enhancement animation is playing
  let previewFace: number | undefined;
  let previewPipIndex: number | undefined;

  if (
    phase === "DICE_EDITOR_FACE" &&
    selectedEditorDie !== null &&
    selectedEditorFace !== null &&
    enhancedFace === null // Don't preview during enhancement animation
  ) {
    previewFace = selectedEditorFace;
    previewPipIndex = getNextEnhanceablePipIndex(
      selectedEditorDie,
      selectedEditorFace,
      diceEnhancements
    );
    // Only show preview if there's a pip to enhance
    if (previewPipIndex === -1) {
      previewPipIndex = undefined;
      previewFace = undefined;
    }
  }

  // Shouldn't render if no die is selected, but handle gracefully
  if (selectedEditorDie === null) {
    return <View style={[styles.container, { height: containerHeight }]} />;
  }

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* 3D Die */}
      <DiePreview3D
        dieIndex={selectedEditorDie}
        enhancements={diceEnhancements}
        selectedFace={selectedEditorFace}
        onFaceSelect={selectEditorFace}
        upgradeType={pendingUpgradeType}
        enhancedFace={enhancedFace ?? undefined}
        enhancedPipIndex={enhancedPipIndex ?? undefined}
        previewFace={previewFace}
        previewPipIndex={previewPipIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    // Ensure the 3D die is clickable and interactive
    zIndex: 10,
  },
});
