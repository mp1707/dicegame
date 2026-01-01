import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { InsetSlot, Surface } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import { useLayout } from "../../utils/LayoutContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
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

  // Animation shared val
  const ctaTranslateY = useSharedValue(0);

  React.useEffect(() => {
    if (isWinAnimating) {
      // Slide out (down)
      ctaTranslateY.value = withTiming(100, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      });
    } else if (levelWon) {
      // Slide in (up) - show Cash Out
      // Small delay to ensure text update happened (though React render is fast)
      ctaTranslateY.value = withDelay(
        100,
        withTiming(0, { duration: 240, easing: Easing.out(Easing.back(1.5)) })
      );
    } else {
      // Reset for normal play
      ctaTranslateY.value = 0;
    }
  }, [isWinAnimating, levelWon]);

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

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  // Render the CTA button based on current state
  const renderCTA = () => {
    // Common button style with proportional height
    const buttonStyle = [styles.ctaButton, { height: buttonHeight }];

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

  const renderCTAArea = () => {
    return (
      <Animated.View style={[styles.ctaArea, animatedStyle]}>
        {renderCTA()}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Surface variant="panel" padding="sm" style={styles.footerStrip}>
        {renderCTAArea()}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  footerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the button since it's alone now
    gap: SPACING.sm,
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
});
