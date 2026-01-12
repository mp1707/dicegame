import React, { useState, useCallback } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { useGameStore } from "../../store/gameStore";
import { COLORS, SPACING } from "../../constants/theme";
import { GameText } from "../shared";
import { SingleDiePreview } from "../SingleDiePreview";
import { DieEditorContent } from "./DieEditorContent";
import { FaceEditorContent } from "./FaceEditorContent";

/**
 * DiceEditorLayout - Split layout for dice editor phases
 *
 * Structure:
 * - Upper section (50%): Title header + 3D die preview
 * - Lower section (50%): Selection buttons (die or face)
 *
 * Used for both DICE_EDITOR_DIE and DICE_EDITOR_FACE phases.
 */
export const DiceEditorLayout: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  // Track dimensions for 3D preview
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handlePreviewLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPreviewDimensions({ width, height });
  }, []);

  // Title content based on phase
  const isDiePhase = phase === "DICE_EDITOR_DIE";
  const title = isDiePhase ? "Würfel wählen" : "Seite wählen";
  const subtitle = isDiePhase ? "Schritt 1/2" : "Schritt 2/2";

  return (
    <View style={styles.container}>
      {/* Upper Section: Title + 3D Die Preview */}
      <View style={styles.upperSection}>
        {/* Title Header */}
        <View style={styles.titleHeader}>
          <GameText variant="bodyLarge" color={COLORS.text}>
            {title}
          </GameText>
          <GameText variant="bodySmall" color={COLORS.textMuted}>
            {subtitle}
          </GameText>
        </View>

        {/* 3D Die Preview */}
        <View style={styles.previewContainer} onLayout={handlePreviewLayout}>
          {previewDimensions.width > 0 && previewDimensions.height > 0 && (
            <SingleDiePreview
              containerWidth={previewDimensions.width}
              containerHeight={previewDimensions.height}
            />
          )}
        </View>
      </View>

      {/* Lower Section: Selection Buttons */}
      <View style={styles.lowerSection}>
        {isDiePhase ? <DieEditorContent /> : <FaceEditorContent />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  upperSection: {
    flex: 1,
  },
  titleHeader: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.xxs,
  },
  previewContainer: {
    flex: 1,
  },
  lowerSection: {
    flex: 1,
  },
});
