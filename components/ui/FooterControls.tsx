import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Image } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { Surface, InsetSlot, GlassPanel } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, GamePhase, ShopOfferType } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";
import {
  isFaceEnhanceable,
  getDiceUpgradeCost,
  getUpgradeCost,
} from "../../utils/gameCore";
import { getShopItemById } from "../../items";
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

  // Shop selection state
  const selectedShopOffer = useGameStore((s) => s.selectedShopOffer);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const shopItemId = useGameStore((s) => s.shopItemId);
  const money = useGameStore((s) => s.money);
  const handLevels = useGameStore((s) => s.handLevels);
  const purchaseSelectedOffer = useGameStore((s) => s.purchaseSelectedOffer);

  const isLastLevel = currentLevelIndex >= 7;

  // Calculate selected offer price and affordability
  const selectedOfferInfo = useMemo(() => {
    if (!selectedShopOffer) return null;

    switch (selectedShopOffer) {
      case "upgrade": {
        const avgLevel = Math.floor(
          Object.values(handLevels).reduce((a, b) => a + b, 0) /
            Object.keys(handLevels).length
        );
        const price = getUpgradeCost(avgLevel);
        return { price, canAfford: money >= price };
      }
      case "dice": {
        if (!shopDiceUpgradeType) return null;
        const price = getDiceUpgradeCost(shopDiceUpgradeType);
        return { price, canAfford: money >= price };
      }
      case "item": {
        if (!shopItemId) return null;
        const itemDef = getShopItemById(shopItemId);
        if (!itemDef) return null;
        return { price: itemDef.cost, canAfford: money >= itemDef.cost };
      }
      default:
        return null;
    }
  }, [selectedShopOffer, shopDiceUpgradeType, shopItemId, money, handLevels]);

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

  const handlePurchaseOffer = () => {
    triggerImpactMedium();
    purchaseSelectedOffer();
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

    // SHOP_MAIN phase - Purchase CTA or Next Level button
    if (phase === "SHOP_MAIN") {
      // Show purchase CTA if offer is selected and affordable
      if (selectedShopOffer && selectedOfferInfo?.canAfford) {
        return (
          <PrimaryButton
            onPress={handlePurchaseOffer}
            label={`Kaufen – ${selectedOfferInfo.price} Münzen`}
            variant="mint"
            compact
            style={buttonStyle}
          />
        );
      }
      // Show disabled purchase CTA if offer selected but not affordable
      if (
        selectedShopOffer &&
        selectedOfferInfo &&
        !selectedOfferInfo.canAfford
      ) {
        return (
          <PrimaryButton
            onPress={() => {}}
            label={`Kaufen – ${selectedOfferInfo.price} Münzen`}
            variant="coral"
            disabled
            compact
            style={buttonStyle}
          />
        );
      }
      // Default: Next Level button
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
        <View style={styles.ctaRow}>
          {/* Hands Display (Left) - Only show during gameplay phases */}
          {(phase === "LEVEL_PLAY" || phase === "LEVEL_RESULT") && (
            <GlassPanel style={styles.statPill}>
              <View style={styles.statContent}>
                <GameText variant="labelSmall" color={COLORS.textMuted}>
                  HÄNDE
                </GameText>
                <View style={styles.statRow}>
                  <Image
                    source={require("../../assets/icons/Glove.png")}
                    style={styles.iconSm}
                  />
                  <GameText variant="scoreboardSmall" color={COLORS.cyan}>
                    {handsRemaining}
                  </GameText>
                </View>
              </View>
            </GlassPanel>
          )}

          <Animated.View style={[styles.ctaArea, animatedStyle]}>
            {renderCTA()}
          </Animated.View>

          {/* Rolls Display (Right) - Only show during gameplay phases */}
          {(phase === "LEVEL_PLAY" || phase === "LEVEL_RESULT") && (
            <GlassPanel style={styles.statPill}>
              <View style={styles.statContent}>
                <GameText variant="labelSmall" color={COLORS.textMuted}>
                  WÜRFE
                </GameText>
                <View style={styles.statRow}>
                  <Image
                    source={require("../../assets/icons/die.png")}
                    style={styles.iconSm}
                  />
                  <GameText variant="scoreboardSmall" color={COLORS.gold}>
                    {rollsRemaining}
                  </GameText>
                </View>
              </View>
            </GlassPanel>
          )}
        </View>
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
    justifyContent: "center",
  },
  ctaRow: {
    // NEW wrapper for 3-column footer layout
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    justifyContent: "space-between",
  },
  glowPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.3 }],
    left: "25%", // Center behind main button (approx)
    width: "50%",
  },
  ctaButton: {
    flex: 1,
    shadowOpacity: 0.6,
  },
  ctaArea: {
    flex: 2, // Main button takes 50% width (2/4)
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
  },
  statPill: {
    flex: 1, // Side stats take 25% width each (1/4)
    height: "100%", // Match button height
    justifyContent: "center",
    borderRadius: DIMENSIONS.borderRadius,
  },
  statContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.xs,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  iconSm: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginLeft: -SPACING.xs,
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
