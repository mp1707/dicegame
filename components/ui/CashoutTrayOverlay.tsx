import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { GameText } from "../shared";
import { Surface, Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, useRewardBreakdown } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { SparkleEffect } from "./SparkleEffect";
import { triggerLightImpact, triggerImpactMedium } from "../../utils/haptics";

/**
 * CashoutTrayOverlay - Title and sum card for the dice tray area during LEVEL_RESULT phase
 *
 * Displays:
 * - "LEVEL X COMPLETE" title (centered, no icon)
 * - Tier badge (if applicable)
 * - Payout sum card with count-up animation
 */
export const CashoutTrayOverlay: React.FC = () => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const rewards = useRewardBreakdown();
  const levelNumber = currentLevelIndex + 1;

  // Animation state
  const [showSparkles, setShowSparkles] = useState(false);
  const [displayedPayout, setDisplayedPayout] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Shared values for animations
  const titleScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const tierBadgeTranslateY = useSharedValue(6);
  const tierBadgeOpacity = useSharedValue(0);
  const payoutOpacity = useSharedValue(0);
  const payoutTranslateY = useSharedValue(10);

  // Count-up animation for payout
  const animateCountUp = useCallback(() => {
    const duration = ANIMATION.cashout.countUpDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const targetValue = rewards.totalPayout;

    triggerLightImpact();

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayedPayout(Math.round(targetValue * easedProgress));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayedPayout(targetValue);
        triggerImpactMedium();
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [rewards.totalPayout]);

  // Start all animations
  useEffect(() => {
    if (animationStarted) return;
    setAnimationStarted(true);

    const { heroPayoutDelay } = ANIMATION.cashout;

    // Title pop animation
    titleOpacity.value = withTiming(1, { duration: 150 });
    titleScale.value = withSpring(1, ANIMATION.springs.trophyPop);

    // Tier badge slide up (if applicable)
    if (rewards.tier > 0) {
      tierBadgeOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
      tierBadgeTranslateY.value = withDelay(
        200,
        withTiming(0, { duration: 200 })
      );
    }

    // Hero payout appears
    setTimeout(() => {
      payoutOpacity.value = withTiming(1, { duration: 200 });
      payoutTranslateY.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      setShowSparkles(true);
      animateCountUp();
    }, heroPayoutDelay);
  }, [animationStarted, rewards.tier]);

  // Animated styles
  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const tierBadgeAnimStyle = useAnimatedStyle(() => ({
    opacity: tierBadgeOpacity.value,
    transform: [{ translateY: tierBadgeTranslateY.value }],
  }));

  const payoutAnimStyle = useAnimatedStyle(() => ({
    opacity: payoutOpacity.value,
    transform: [{ translateY: payoutTranslateY.value }],
  }));

  const getTierLabel = () => {
    switch (rewards.tier) {
      case 2:
        return "TIER 2";
      case 1:
        return "TIER 1";
      default:
        return null;
    }
  };

  const tierLabel = getTierLabel();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Animated.View style={[styles.titleRow, titleAnimStyle]}>
        <GameText
          variant="displaySmall"
          color={COLORS.gold}
          style={styles.title}
        >
          LEVEL {levelNumber} COMPLETE
        </GameText>
      </Animated.View>

      {/* Tier Badge */}
      {tierLabel && (
        <Animated.View style={[styles.tierBadge, tierBadgeAnimStyle]}>
          <Chip label={tierLabel} color="gold" size="sm" />
        </Animated.View>
      )}

      {/* Hero Payout Block */}
      <Animated.View style={[styles.heroBlock, payoutAnimStyle]}>
        <Surface variant="panel" style={styles.heroSurface}>
          <GameText variant="label" color={COLORS.textMuted}>
            AUSZAHLUNG
          </GameText>
          <View style={styles.payoutRow}>
            <GameText
              variant="displayLarge"
              color={COLORS.mint}
              style={styles.payoutValue}
            >
              +${formatNumber(displayedPayout)}
            </GameText>
            <View style={styles.sparkleContainer}>
              <SparkleEffect active={showSparkles} color={COLORS.gold} />
            </View>
          </View>
          <GameText variant="bodySmall" color={COLORS.textMuted}>
            Neues Guthaben: ${formatNumber(rewards.newMoney)}
          </GameText>
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  title: {
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tierBadge: {
    marginTop: SPACING.xs,
  },
  heroBlock: {
    marginTop: SPACING.md,
    width: "100%",
  },
  heroSurface: {
    padding: SPACING.md,
    alignItems: "center",
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  payoutValue: {
    textShadowColor: COLORS.shadows.mintStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  sparkleContainer: {
    position: "absolute",
    right: -30,
    top: -10,
  },
});
