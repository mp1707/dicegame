import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Trophy, Hand, Dices, Star } from "lucide-react-native";
import { GameText } from "../shared";
import { Surface, InsetSlot, Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, useRewardBreakdown } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { SparkleEffect } from "./SparkleEffect";
import {
  triggerLightImpact,
  triggerImpactMedium,
} from "../../utils/haptics";

interface CashoutRewardsPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * CashoutRewardsPanel - Celebratory reward breakdown with animations.
 * Replaces CashoutResultList with hero payout, staggered rows, and sparkles.
 */
export const CashoutRewardsPanel: React.FC<CashoutRewardsPanelProps> = ({
  style,
}) => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const rewards = useRewardBreakdown();
  const levelNumber = currentLevelIndex + 1;

  // Animation state
  const [showSparkles, setShowSparkles] = useState(false);
  const [displayedPayout, setDisplayedPayout] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Shared values for animations
  const trophyScale = useSharedValue(0.9);
  const trophyOpacity = useSharedValue(0);
  const tierBadgeTranslateY = useSharedValue(6);
  const tierBadgeOpacity = useSharedValue(0);
  const payoutOpacity = useSharedValue(0);

  // Row animations (up to 4 rows)
  const rowAnimations = [
    { translateX: useSharedValue(-18), opacity: useSharedValue(0), scale: useSharedValue(1) },
    { translateX: useSharedValue(-18), opacity: useSharedValue(0), scale: useSharedValue(1) },
    { translateX: useSharedValue(-18), opacity: useSharedValue(0), scale: useSharedValue(1) },
    { translateX: useSharedValue(-18), opacity: useSharedValue(0), scale: useSharedValue(1) },
  ];

  // Count-up animation for payout
  const animateCountUp = useCallback(() => {
    const duration = ANIMATION.cashout.countUpDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const targetValue = rewards.totalPayout;

    triggerLightImpact(); // Start haptic

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayedPayout(Math.round(targetValue * easedProgress));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayedPayout(targetValue);
        triggerImpactMedium(); // End haptic
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [rewards.totalPayout]);

  // Animate a single row
  const animateRow = useCallback((index: number, delay: number) => {
    const row = rowAnimations[index];
    if (!row) return;

    const { rowAnimDuration, rowTickScale } = ANIMATION.cashout;

    row.translateX.value = withDelay(
      delay,
      withTiming(0, { duration: rowAnimDuration, easing: Easing.out(Easing.quad) })
    );

    row.opacity.value = withDelay(
      delay,
      withTiming(1, { duration: rowAnimDuration })
    );

    // Landing tick
    row.scale.value = withDelay(
      delay + rowAnimDuration * 0.7,
      withSequence(
        withTiming(rowTickScale, { duration: 60 }),
        withSpring(1, ANIMATION.springs.rowLand)
      )
    );

    // Haptic on landing (max 4)
    if (index < 4) {
      setTimeout(() => triggerLightImpact(), delay + rowAnimDuration);
    }
  }, []);

  // Start all animations
  useEffect(() => {
    if (animationStarted) return;
    setAnimationStarted(true);

    const { heroPayoutDelay, rowStartDelay, rowStagger } = ANIMATION.cashout;

    // Trophy pop animation
    trophyOpacity.value = withTiming(1, { duration: 150 });
    trophyScale.value = withSpring(1, ANIMATION.springs.trophyPop);

    // Tier badge slide up (if applicable)
    if (rewards.tier > 0) {
      tierBadgeOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
      tierBadgeTranslateY.value = withDelay(200, withTiming(0, { duration: 200 }));
    }

    // Hero payout appears
    setTimeout(() => {
      payoutOpacity.value = withTiming(1, { duration: 200 });
      setShowSparkles(true);
      animateCountUp();
    }, heroPayoutDelay);

    // Stagger row animations
    const rowCount = rewards.tierBonus > 0 ? 4 : 3;
    for (let i = 0; i < rowCount; i++) {
      const delay = heroPayoutDelay + rowStartDelay + i * rowStagger;
      animateRow(i, delay);
    }
  }, [animationStarted, rewards.tier, rewards.tierBonus]);

  // Animated styles
  const trophyAnimStyle = useAnimatedStyle(() => ({
    opacity: trophyOpacity.value,
    transform: [{ scale: trophyScale.value }],
  }));

  const tierBadgeAnimStyle = useAnimatedStyle(() => ({
    opacity: tierBadgeOpacity.value,
    transform: [{ translateY: tierBadgeTranslateY.value }],
  }));

  const payoutAnimStyle = useAnimatedStyle(() => ({
    opacity: payoutOpacity.value,
  }));

  const rowAnimStyles = rowAnimations.map((row) =>
    useAnimatedStyle(() => ({
      opacity: row.opacity.value,
      transform: [
        { translateX: row.translateX.value },
        { scale: row.scale.value },
      ],
    }))
  );

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
    <View style={[styles.container, style]}>
      {/* Header Strip */}
      <View style={styles.headerStrip}>
        <Animated.View style={trophyAnimStyle}>
          <Trophy size={DIMENSIONS.iconSize.lg} color={COLORS.gold} />
        </Animated.View>
        <GameText variant="displaySmall" color={COLORS.gold} style={styles.levelTitle}>
          LEVEL {levelNumber} COMPLETE
        </GameText>
        {tierLabel && (
          <Animated.View style={tierBadgeAnimStyle}>
            <Chip label={tierLabel} color="gold" size="sm" />
          </Animated.View>
        )}
      </View>

      {/* Hero Payout Block */}
      <Animated.View style={[styles.heroBlock, payoutAnimStyle]}>
        <Surface variant="panel" style={styles.heroSurface}>
          <GameText variant="label" color={COLORS.textMuted}>
            AUSZAHLUNG
          </GameText>
          <View style={styles.payoutRow}>
            <GameText variant="displayLarge" color={COLORS.mint} style={styles.payoutValue}>
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

      {/* Reward Breakdown List */}
      <View style={styles.rewardList}>
        {/* Row 1: Win Reward */}
        <Animated.View style={rowAnimStyles[0]}>
          <RewardRow
            icon={<Trophy size={DIMENSIONS.iconSize.sm} color={COLORS.mint} />}
            label="Gewinn"
            value={`+$${rewards.baseReward}`}
          />
        </Animated.View>

        {/* Row 2: Unused Hands */}
        <Animated.View style={rowAnimStyles[1]}>
          <RewardRow
            icon={<Hand size={DIMENSIONS.iconSize.sm} color={COLORS.cyan} />}
            label={`Hände übrig (${rewards.unusedHandsCount})`}
            value={`+$${rewards.unusedHandsBonus}`}
          />
        </Animated.View>

        {/* Row 3: Unused Rolls */}
        <Animated.View style={rowAnimStyles[2]}>
          <RewardRow
            icon={<Dices size={DIMENSIONS.iconSize.sm} color={COLORS.cyan} />}
            label={`Würfe übrig (${rewards.unusedRollsCount})`}
            value={`+$${rewards.unusedRollsBonus}`}
          />
        </Animated.View>

        {/* Row 4: Tier Bonus (conditional) */}
        {rewards.tierBonus > 0 && (
          <Animated.View style={rowAnimStyles[3]}>
            <RewardRow
              icon={<Star size={DIMENSIONS.iconSize.sm} color={COLORS.gold} />}
              label="Tier Bonus"
              value={`+$${rewards.tierBonus}`}
              highlight
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// Reward Row Component
interface RewardRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

const RewardRow: React.FC<RewardRowProps> = ({
  icon,
  label,
  value,
  highlight = false,
}) => (
  <InsetSlot padding="sm" style={styles.rewardSlot}>
    <View style={styles.rewardRowInner}>
      <View style={styles.rewardLeft}>
        {icon}
        <GameText
          variant="bodyMedium"
          color={highlight ? COLORS.gold : COLORS.textMuted}
        >
          {label}
        </GameText>
      </View>
      <GameText
        variant="bodyLarge"
        color={highlight ? COLORS.gold : COLORS.text}
        style={highlight ? styles.highlightValue : undefined}
      >
        {value}
      </GameText>
    </View>
  </InsetSlot>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  headerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  levelTitle: {
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroBlock: {
    marginBottom: SPACING.md,
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
  rewardList: {
    gap: SPACING.xs,
  },
  rewardSlot: {
    marginBottom: SPACING.xs,
  },
  rewardRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  highlightValue: {
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
