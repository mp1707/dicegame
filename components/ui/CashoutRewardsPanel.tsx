import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Trophy, Hand, Dices, Star } from "lucide-react-native";
import { GameText } from "../shared";
import { InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useRewardBreakdown } from "../../store/gameStore";
import { triggerLightImpact } from "../../utils/haptics";

interface CashoutRewardsPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * CashoutRewardsPanel - Reward breakdown list for LEVEL_RESULT phase (bottom panel)
 *
 * Shows staggered animated rows for:
 * - Win Reward
 * - Unused Hands Bonus
 * - Unused Rolls Bonus
 * - Tier Bonus (if applicable)
 *
 * Note: Title and sum card are now displayed in CashoutTrayOverlay instead.
 */
export const CashoutRewardsPanel: React.FC<CashoutRewardsPanelProps> = ({
  style,
}) => {
  const rewards = useRewardBreakdown();

  // Row animations (up to 4 rows)
  const rowAnimations = [
    {
      translateX: useSharedValue(-18),
      opacity: useSharedValue(0),
      scale: useSharedValue(1),
    },
    {
      translateX: useSharedValue(-18),
      opacity: useSharedValue(0),
      scale: useSharedValue(1),
    },
    {
      translateX: useSharedValue(-18),
      opacity: useSharedValue(0),
      scale: useSharedValue(1),
    },
    {
      translateX: useSharedValue(-18),
      opacity: useSharedValue(0),
      scale: useSharedValue(1),
    },
  ];

  // Animate a single row
  const animateRow = useCallback((index: number, delay: number) => {
    const row = rowAnimations[index];
    if (!row) return;

    const { rowAnimDuration, rowTickScale } = ANIMATION.cashout;

    row.translateX.value = withDelay(
      delay,
      withTiming(0, {
        duration: rowAnimDuration,
        easing: Easing.out(Easing.quad),
      })
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

  // Start row animations - delayed to sync with tray overlay
  useEffect(() => {
    const { heroPayoutDelay, rowStartDelay, rowStagger } = ANIMATION.cashout;
    const baseDelay = heroPayoutDelay + rowStartDelay;

    const rowCount = rewards.tierBonus > 0 ? 4 : 3;
    for (let i = 0; i < rowCount; i++) {
      animateRow(i, baseDelay + i * rowStagger);
    }
  }, [rewards.tierBonus, animateRow]);

  // Animated styles
  const rowAnimStyles = rowAnimations.map((row) =>
    useAnimatedStyle(() => ({
      opacity: row.opacity.value,
      transform: [
        { translateX: row.translateX.value },
        { scale: row.scale.value },
      ],
    }))
  );

  return (
    <View style={[styles.container, style]}>
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
