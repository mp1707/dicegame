import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { X, Dices, ChevronLeft } from "lucide-react-native";
import { Canvas } from "@react-three/fiber";
import { GameText } from "../shared";
import { Surface } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, DiceUpgradeType } from "../../store/gameStore";
import {
  getDiceUpgradeCost,
  isFaceEnhanceable,
  hasDieAnyEnhanceableFace,
} from "../../utils/gameCore";
import {
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";
import { DiePreview3D } from "./DiePreview3D";

// ─────────────────────────────────────────────────────────────────────────────
// Die Tile Component (for die picker grid)
// ─────────────────────────────────────────────────────────────────────────────

interface DieTileProps {
  index: number;
  isSelected: boolean;
  isMaxed: boolean;
  onPress: () => void;
  animationDelay: number;
}

const DieTile: React.FC<DieTileProps> = ({
  index,
  isSelected,
  isMaxed,
  onPress,
  animationDelay,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      animationDelay,
      withSpring(1, { damping: 14, stiffness: 120 })
    );
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: 180 }));
  }, [animationDelay]);

  // Selection pulse
  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.dieTileWrapper, animatedStyle]}>
      <Pressable
        onPress={() => {
          if (!isMaxed) {
            triggerSelectionHaptic();
            onPress();
          }
        }}
        style={[
          styles.dieTile,
          isSelected && styles.dieTileSelected,
          isMaxed && styles.dieTileMaxed,
        ]}
      >
        <Dices
          size={DIMENSIONS.iconSize.lg}
          color={
            isMaxed ? COLORS.textMuted : isSelected ? COLORS.cyan : COLORS.text
          }
          strokeWidth={2}
        />
        <GameText
          variant="bodySmall"
          color={
            isMaxed ? COLORS.textMuted : isSelected ? COLORS.cyan : COLORS.text
          }
        >
          {index + 1}
        </GameText>
        {isMaxed && (
          <View style={styles.maxBadge}>
            <GameText variant="caption" color={COLORS.textMuted}>
              MAX
            </GameText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────────────────────────────────────

type EditorScreen = "die-picker" | "face-picker";

export const DiceEditorModal: React.FC = () => {
  const diceEditorOpen = useGameStore((s) => s.diceEditorOpen);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const money = useGameStore((s) => s.money);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);

  const closeDiceEditor = useGameStore((s) => s.closeDiceEditor);
  const selectEditorDie = useGameStore((s) => s.selectEditorDie);
  const selectEditorFace = useGameStore((s) => s.selectEditorFace);
  const applyDiceUpgrade = useGameStore((s) => s.applyDiceUpgrade);

  const [currentScreen, setCurrentScreen] =
    useState<EditorScreen>("die-picker");

  // Success animation state
  const [successState, setSuccessState] = useState<{
    face: number;
    pipIndex: number;
    enhancements: typeof diceEnhancements;
  } | null>(null);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const panelY = useSharedValue(50);

  // Reset state when modal opens
  useEffect(() => {
    if (diceEditorOpen) {
      setCurrentScreen("die-picker");
      setSuccessState(null);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      panelY.value = withSpring(0, ANIMATION.diceEditor.panelSlideIn);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      panelY.value = withTiming(50, { duration: 150 });
    }
  }, [diceEditorOpen]);

  // Auto-close after success animation
  useEffect(() => {
    if (successState) {
      const timer = setTimeout(() => {
        // Now apply the upgrade and close modal
        applyDiceUpgrade();
      }, 1500); // 1.5s animation duration
      return () => clearTimeout(timer);
    }
  }, [successState, applyDiceUpgrade]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
  }));

  if (!diceEditorOpen) return null;

  const handleBack = () => {
    if (currentScreen === "face-picker") {
      setCurrentScreen("die-picker");
    } else {
      closeDiceEditor();
    }
  };

  const handleDieSelect = (index: number) => {
    selectEditorDie(index);
  };

  const handleAdvanceToFacePicker = () => {
    if (selectedEditorDie !== null) {
      triggerImpactMedium();
      setCurrentScreen("face-picker");
    }
  };

  const handleFaceSelect = (face: number) => {
    selectEditorFace(face);
  };

  const handleApplyUpgrade = () => {
    if (
      selectedEditorDie === null ||
      selectedEditorFace === null ||
      !pendingUpgradeType
    )
      return;

    // Find which pip index will be enhanced (first "none" pip)
    const faceEnhancements =
      diceEnhancements[selectedEditorDie]?.faces[selectedEditorFace - 1] || [];
    const enhancedPipIndex = faceEnhancements.findIndex((s) => s === "none");

    if (enhancedPipIndex === -1) return; // No enhanceable pip found

    triggerImpactMedium();

    // DON'T apply upgrade yet - create the NEW enhancement state for animation
    const newEnhancements = diceEnhancements.map((die, dieIdx) => {
      if (dieIdx !== selectedEditorDie) return die;
      return {
        faces: die.faces.map((face, faceIdx) => {
          if (faceIdx !== selectedEditorFace - 1) return face;
          const newFace = [...face];
          newFace[enhancedPipIndex] = pendingUpgradeType;
          return newFace;
        }),
      };
    });

    setSuccessState({
      face: selectedEditorFace,
      pipIndex: enhancedPipIndex,
      enhancements: newEnhancements,
    });
  };

  // Calculate cost
  const cost = pendingUpgradeType ? getDiceUpgradeCost(pendingUpgradeType) : 0;
  const canAfford = money >= cost;

  // Check if selected face is enhanceable
  const canEnhanceFace =
    selectedEditorDie !== null &&
    selectedEditorFace !== null &&
    isFaceEnhanceable(selectedEditorDie, selectedEditorFace, diceEnhancements);

  // Title based on upgrade type
  const upgradeTitle =
    pendingUpgradeType === "points"
      ? "Würfel verbessern (Punkte)"
      : "Würfel verbessern (Mult)";
  const upgradeColor =
    pendingUpgradeType === "points" ? COLORS.upgradePoints : COLORS.upgradeMult;

  return (
    <Modal transparent visible={diceEditorOpen} animationType="none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBack} />
      </Animated.View>

      {/* Panel */}
      <Animated.View style={[styles.panelContainer, panelStyle]}>
        <Surface variant="panel" style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              {currentScreen === "face-picker" ? (
                <ChevronLeft
                  size={DIMENSIONS.iconSize.md}
                  color={COLORS.text}
                />
              ) : (
                <X size={DIMENSIONS.iconSize.md} color={COLORS.text} />
              )}
            </Pressable>
            <GameText
              variant="bodyMedium"
              color={COLORS.text}
              style={styles.headerTitle}
            >
              {currentScreen === "die-picker"
                ? "Welchen Würfel verbessern?"
                : "Seite auswählen"}
            </GameText>
            <View style={styles.headerSpacer} />
          </View>

          {/* Upgrade type indicator */}
          <View style={[styles.typeIndicator, { borderColor: upgradeColor }]}>
            <GameText variant="bodySmall" color={upgradeColor}>
              {pendingUpgradeType === "points"
                ? "+10 Punkte/Pip"
                : "+1 Mult/Pip"}
            </GameText>
          </View>

          {/* Content */}
          {currentScreen === "die-picker" ? (
            <View style={styles.content}>
              {/* Die Grid - 2+3 layout */}
              <View style={styles.dieGrid}>
                <View style={styles.dieRow}>
                  {[0, 1].map((i) => (
                    <DieTile
                      key={i}
                      index={i}
                      isSelected={selectedEditorDie === i}
                      isMaxed={!hasDieAnyEnhanceableFace(i, diceEnhancements)}
                      onPress={() => handleDieSelect(i)}
                      animationDelay={ANIMATION.diceEditor.dieStagger * i}
                    />
                  ))}
                </View>
                <View style={styles.dieRow}>
                  {[2, 3, 4].map((i) => (
                    <DieTile
                      key={i}
                      index={i}
                      isSelected={selectedEditorDie === i}
                      isMaxed={!hasDieAnyEnhanceableFace(i, diceEnhancements)}
                      onPress={() => handleDieSelect(i)}
                      animationDelay={ANIMATION.diceEditor.dieStagger * i}
                    />
                  ))}
                </View>
              </View>

              {/* Selection indicator (reserved height) */}
              <View style={styles.selectionIndicator}>
                <GameText variant="bodySmall" color={COLORS.textMuted}>
                  {selectedEditorDie !== null
                    ? `Ausgewählt: Würfel ${selectedEditorDie + 1}`
                    : " "}
                </GameText>
              </View>

              {/* CTA */}
              <Pressable
                onPress={handleAdvanceToFacePicker}
                disabled={selectedEditorDie === null}
                style={[
                  styles.ctaButton,
                  { backgroundColor: upgradeColor },
                  selectedEditorDie === null && styles.ctaButtonDisabled,
                ]}
              >
                <GameText
                  variant="buttonMedium"
                  color={
                    selectedEditorDie === null
                      ? COLORS.textMuted
                      : COLORS.textDark
                  }
                >
                  WÜRFEL VERBESSERN
                </GameText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              {/* 3D Die Viewer */}
              <View style={styles.dieViewerContainer}>
                <DiePreview3D
                  dieIndex={selectedEditorDie!}
                  enhancements={successState?.enhancements || diceEnhancements}
                  selectedFace={selectedEditorFace}
                  onFaceSelect={successState ? () => {} : handleFaceSelect}
                  upgradeType={pendingUpgradeType}
                  enhancedFace={successState?.face}
                  enhancedPipIndex={successState?.pipIndex}
                />
              </View>

              {/* Face indicator */}
              <View style={styles.selectionIndicator}>
                {successState ? (
                  <GameText variant="bodySmall" color={upgradeColor}>
                    ✨ Verbessert!
                  </GameText>
                ) : (
                  <>
                    <GameText variant="bodySmall" color={COLORS.textMuted}>
                      {selectedEditorFace !== null
                        ? `Seite: ${selectedEditorFace}`
                        : " "}
                    </GameText>
                    {selectedEditorFace !== null && !canEnhanceFace && (
                      <GameText variant="caption" color={COLORS.coral}>
                        Diese Seite ist bereits voll verbessert.
                      </GameText>
                    )}
                  </>
                )}
              </View>

              {
                /* CTA - invisible but present during success animation to maintain layout */
                <Pressable
                  onPress={successState ? undefined : handleApplyUpgrade}
                  disabled={!!successState || !canEnhanceFace || !canAfford}
                  style={[
                    styles.ctaButton,
                    { backgroundColor: upgradeColor },
                    (!!successState || !canEnhanceFace || !canAfford) &&
                      styles.ctaButtonDisabled,
                    successState && { opacity: 0 }, // Hide visually but keep layout
                  ]}
                >
                  <GameText
                    variant="buttonMedium"
                    color={
                      !canEnhanceFace || !canAfford
                        ? COLORS.textMuted
                        : COLORS.textDark
                    }
                  >
                    SEITE VERBESSERN
                  </GameText>
                </Pressable>
              }
            </View>
          )}
        </Surface>
      </Animated.View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlays.backdrop,
  },
  panelContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  panel: {
    flex: 1,
    maxHeight: 500,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.overlays.whiteMild,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: DIMENSIONS.iconSize.md + SPACING.xs * 2,
  },
  typeIndicator: {
    alignSelf: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: "space-between",
  },
  dieGrid: {
    alignItems: "center",
    gap: SPACING.md,
  },
  dieRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.md,
  },
  dieTileWrapper: {},
  dieTile: {
    width: 72,
    height: 72,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: COLORS.surface2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.overlays.whiteMild,
  },
  dieTileSelected: {
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.overlays.cyanSubtle,
  },
  dieTileMaxed: {
    opacity: 0.5,
  },
  maxBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectionIndicator: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: COLORS.surface2,
  },
  dieViewerContainer: {
    flex: 1,
    minHeight: 200,
  },
});
