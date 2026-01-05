import React from "react";
import { View, StyleSheet } from "react-native";
import { DiePreview3D } from "./ui/DiePreview3D";
import { useGameStore } from "../store/gameStore";

interface SingleDiePreviewProps {
  containerHeight: number;
  containerWidth: number;
}

/**
 * SingleDiePreview - Wrapper for DiePreview3D that connects to the game store
 *
 * Used during DICE_EDITOR_FACE phase to show a single large rotatable die
 * in the PlayConsole tray area. Subscribes to editor state and calls
 * selectEditorFace when the die is manually rotated.
 */
export const SingleDiePreview: React.FC<SingleDiePreviewProps> = ({
  containerHeight,
  containerWidth,
}) => {
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);
  const selectEditorFace = useGameStore((s) => s.selectEditorFace);

  // Shouldn't render if no die is selected, but handle gracefully
  if (selectedEditorDie === null) {
    return <View style={[styles.container, { height: containerHeight }]} />;
  }

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      <DiePreview3D
        dieIndex={selectedEditorDie}
        enhancements={diceEnhancements}
        selectedFace={selectedEditorFace}
        onFaceSelect={selectEditorFace}
        upgradeType={pendingUpgradeType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
