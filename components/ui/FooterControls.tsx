import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image } from "react-native";
import { PrimaryButton, GameText } from "../shared";
// InsetSlot and Surface removed
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, GamePhase } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import {
  isFaceEnhanceable,
  isArtifactFaceEnhanceable,
} from "../../utils/gameCore";
import { useLayout } from "../../utils/LayoutContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";

// Import icons
// StatPill removed - shifted to HUDHeader

export const FooterControls = () => {
  const layout = useLayout();
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const handsRemaining = useGameStore((s) => s.handsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const acceptHand = useGameStore((s) => s.acceptHand);
  const revealState = useGameStore((s) => s.revealState);
  const cashOutNow = useGameStore((s) => s.cashOutNow);
  const openShop = useGameStore((s) => s.openShop);
  const levelWon = useGameStore((s) => s.levelWon);
  const isWinAnimating = useGameStore((s) => s.isWinAnimating);
  const closeShopNextLevel = useGameStore((s) => s.closeShopNextLevel);
  const startNewRun = useGameStore((s) => s.startNewRun);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);

  // Dice editor state
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const closeDiceEditor = useGameStore((s) => s.closeDiceEditor);
  const advanceToFaceEditor = useGameStore((s) => s.advanceToFaceEditor);
  const backFromFaceEditor = useGameStore((s) => s.backFromFaceEditor);
  const applyDiceUpgrade = useGameStore((s) => s.applyDiceUpgrade);

  // Artifact editor state
  const selectedArtifactFace = useGameStore((s) => s.selectedArtifactFace);
  const artifactEnhancement = useGameStore((s) => s.artifactEnhancement);
  const closeArtifactEditor = useGameStore((s) => s.closeArtifactEditor);
  const applyArtifactUpgrade = useGameStore((s) => s.applyArtifactUpgrade);

  const isLastLevel = currentLevelIndex >= 7;

  // Animation shared values
  const ctaTranslateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Track previous phase to detect transitions
  const prevPhaseRef = useRef<GamePhase>(phase);

  // CTA slide animation for win state
  useEffect(() => {
    if (isWinAnimating) {
      // Slide out (down)
      ctaTranslateY.value = withTiming(100, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      });
    } else if (levelWon) {
      // Slide in (up) - show Cash Out
      ctaTranslateY.value = withDelay(
        100,
        withTiming(0, { duration: 240, easing: Easing.out(Easing.back(1.5)) })
      );
    } else {
      // Reset for normal play
      ctaTranslateY.value = 0;
    }
  }, [isWinAnimating, levelWon]);

  // Glow pulse on phase transitions
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Trigger glow pulse when transitioning to phases with new CTAs
    const shouldGlow =
      (prevPhase === "LEVEL_PLAY" && phase === "LEVEL_RESULT") ||
      (prevPhase === "LEVEL_RESULT" && phase === "SHOP_MAIN") ||
      (prevPhase === "SHOP_PICK_UPGRADE" && phase === "SHOP_MAIN") ||
      (prevPhase === "SHOP_MAIN" && phase === "SHOP_PICK_UPGRADE") ||
      (prevPhase === "SHOP_MAIN" && phase === "DICE_EDITOR_DIE") ||
      (prevPhase === "DICE_EDITOR_DIE" && phase === "SHOP_MAIN") ||
      (prevPhase === "DICE_EDITOR_DIE" && phase === "DICE_EDITOR_FACE") ||
      (prevPhase === "DICE_EDITOR_FACE" && phase === "DICE_EDITOR_DIE") ||
      (prevPhase === "DICE_EDITOR_FACE" && phase === "SHOP_MAIN");

    if (shouldGlow) {
      const glowDuration = ANIMATION.transition.ctaGlowPulseDuration;
      glowOpacity.value = withSequence(
        withDelay(
          ANIMATION.transition.incomingDelay + 60,
          withTiming(0.6, { duration: glowDuration * 0.3 })
        ),
        withTiming(0, { duration: glowDuration * 0.7 })
      );
    }
  }, [phase]);

  // Button height is ~55% of footer height (proportional to layout)
  const buttonHeight = Math.max(44, layout.footerHeight * 0.55);

  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "LEVEL_PLAY" &&
    !selectedHandId &&
    !revealState?.active;

  const isHandSelected = !!selectedHandId && !revealState?.active;
  const isRevealing = !!revealState?.active;

  const handleAcceptHand = () => {
    if (isHandSelected) {
      acceptHand();
      triggerSelectionHaptic();
    }
  };

  const handleCashOut = () => {
    cashOutNow();
    triggerSelectionHaptic();
  };

  const handleOpenShop = () => {
    openShop();
    triggerSelectionHaptic();
  };

  const handleNextLevel = () => {
    closeShopNextLevel();
    triggerSelectionHaptic();
  };

  const handleNewRun = () => {
    startNewRun();
    triggerSelectionHaptic();
  };

  const handleCloseDiceEditor = () => {
    closeDiceEditor();
    triggerSelectionHaptic();
  };

  const handleAdvanceToFaceEditor = () => {
    advanceToFaceEditor();
    triggerSelectionHaptic();
  };

  const handleBackFromFaceEditor = () => {
    backFromFaceEditor();
    triggerSelectionHaptic();
  };

  const handleApplyDiceUpgrade = () => {
    applyDiceUpgrade();
    triggerSelectionHaptic();
  };

  const handleCloseArtifactEditor = () => {
    closeArtifactEditor();
    triggerSelectionHaptic();
  };

  const handleApplyArtifactUpgrade = () => {
    applyArtifactUpgrade();
    triggerSelectionHaptic();
  };

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  // Render the CTA button based on current state
  const renderCTA = () => {
    // Common button style with proportional height
    const buttonStyle = [styles.ctaButton, { height: buttonHeight }];

    // WIN/LOSE screens - New Run button
    if (phase === "WIN_SCREEN" || phase === "LOSE_SCREEN") {
      return (
        <PrimaryButton
          onPress={handleNewRun}
          label="NEUER RUN"
          variant={phase === "WIN_SCREEN" ? "mint" : "coral"}
          compact
          style={buttonStyle}
        />
      );
    }

    // DICE_EDITOR_DIE phase - Dual buttons: ZURÜCK + WÜRFEL VERBESSERN
    if (phase === "DICE_EDITOR_DIE") {
      const canAdvance = selectedEditorDie !== null;
      return (
        <View style={styles.dualButtonRow}>
          <PrimaryButton
            onPress={handleCloseDiceEditor}
            label="ZURÜCK"
            variant="cyan"
            compact
            style={[buttonStyle, styles.halfButton]}
          />
          <PrimaryButton
            onPress={handleAdvanceToFaceEditor}
            label="WEITER"
            variant={pendingUpgradeType === "points" ? "cyan" : "coral"}
            disabled={!canAdvance}
            compact
            style={[buttonStyle, styles.halfButton]}
          />
        </View>
      );
    }

    // DICE_EDITOR_FACE phase - Dual buttons: ZURÜCK + SEITE VERBESSERN
    if (phase === "DICE_EDITOR_FACE") {
      const canEnhance =
        selectedEditorDie !== null &&
        selectedEditorFace !== null &&
        isFaceEnhanceable(
          selectedEditorDie,
          selectedEditorFace,
          diceEnhancements
        );
      return (
        <View style={styles.dualButtonRow}>
          <PrimaryButton
            onPress={handleBackFromFaceEditor}
            label="ZURÜCK"
            variant="cyan"
            compact
            style={[buttonStyle, styles.halfButton]}
          />
          <PrimaryButton
            onPress={handleApplyDiceUpgrade}
            label="VERBESSERN"
            variant={pendingUpgradeType === "points" ? "cyan" : "coral"}
            disabled={!canEnhance}
            compact
            style={[buttonStyle, styles.halfButton]}
          />
        </View>
      );
    }

    // ARTIFACT_EDITOR phase - Dual buttons: ZURÜCK + VERBESSERN
    if (phase === "ARTIFACT_EDITOR") {
      const canEnhance =
        selectedArtifactFace !== null &&
        isArtifactFaceEnhanceable(selectedArtifactFace, artifactEnhancement);
      return (
        <View style={styles.dualButtonRow}>
          <PrimaryButton
            onPress={handleCloseArtifactEditor}
            label="ZURÜCK"
            variant="cyan"
            compact
            style={[buttonStyle, styles.halfButton]}
          />
          <PrimaryButton
            onPress={handleApplyArtifactUpgrade}
            label="VERBESSERN"
            variant="coral"
            disabled={!canEnhance}
            compact
            style={[buttonStyle, styles.halfButton]}
          />
        </View>
      );
    }

    // SHOP_MAIN phase - Next Level button
    if (phase === "SHOP_MAIN") {
      return (
        <PrimaryButton
          onPress={handleNextLevel}
          label={isLastLevel ? "FINISH RUN" : "NEXT LEVEL"}
          variant="cyan"
          compact
          style={buttonStyle}
        />
      );
    }

    // SHOP_PICK_UPGRADE phase - show BACK button
    if (phase === "SHOP_PICK_UPGRADE") {
      return (
        <PrimaryButton
          onPress={() => {
            useGameStore.setState({ phase: "SHOP_MAIN" });
            triggerSelectionHaptic();
          }}
          label="ZURÜCK"
          variant="cyan"
          compact
          style={buttonStyle}
        />
      );
    }

    // LEVEL_RESULT phase - show SHOP button
    if (phase === "LEVEL_RESULT") {
      return (
        <PrimaryButton
          onPress={handleOpenShop}
          label="SHOP"
          variant="mint"
          compact
          style={buttonStyle}
        />
      );
    }

    // Level won - show CASH OUT button
    // Hide this during win animation so we render "Roll" (sliding out) instead
    if (levelWon && phase === "LEVEL_PLAY" && !isRevealing && !isWinAnimating) {
      return (
        <PrimaryButton
          onPress={handleCashOut}
          label="CASH OUT"
          variant="mint"
          compact
          style={buttonStyle}
        />
      );
    }

    // Reveal animation in progress
    if (isRevealing) {
      return (
        <PrimaryButton
          onPress={() => {}}
          label="Zähle..."
          disabled={true}
          variant="cyan"
          compact
          style={buttonStyle}
        />
      );
    }

    // Hand selected - Accept button
    if (isHandSelected) {
      return (
        <PrimaryButton
          onPress={handleAcceptHand}
          label="Annehmen"
          variant="cyan"
          compact
          style={buttonStyle}
        />
      );
    }

    // Default: Roll button
    const label = isRolling ? "Würfeln..." : "Würfeln";

    return (
      <PrimaryButton
        onPress={onPressRoll}
        label={label}
        disabled={!canRoll}
        variant="cyan"
        compact
        style={buttonStyle}
      />
    );
  };

  // Render the CTA area with animation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ctaTranslateY.value }],
    opacity: 1 - Math.min(Math.max(ctaTranslateY.value / 50, 0), 1),
  }));

  // Glow pulse style
  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Determine glow color based on phase
  const getGlowColor = () => {
    if (phase === "LEVEL_RESULT") return COLORS.overlays.mintGlow;
    if (phase === "SHOP_MAIN") return COLORS.overlays.cyanMild;
    return COLORS.overlays.mintGlow;
  };

  const renderCTAArea = () => {
    return (
      <View style={styles.ctaWrapper}>
        {/* Glow pulse behind CTA */}
        <Animated.View
          style={[
            styles.glowPulse,
            glowAnimStyle,
            { backgroundColor: getGlowColor() },
          ]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.ctaArea, animatedStyle]}>
          {renderCTA()}
        </Animated.View>
      </View>
    );
  };

  return <View style={styles.container}>{renderCTAArea()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  ctaWrapper: {
    flex: 1,
    position: "relative",
  },
  glowPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.3 }],
  },
  ctaButton: {
    flex: 1,
    shadowOpacity: 0.6,
  },
  ctaArea: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    // ensure full width/centered
    justifyContent: "center",
  },
  dualButtonRow: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfButton: {
    flex: 1,
  },
});
