import React from "react";
import { View, StyleSheet, ScrollView, ViewStyle, StyleProp } from "react-native";
import { Trophy, Hand, Dices, Star } from "lucide-react-native";
import { GameText } from "../shared";
import { HUDCard, InsetSlot, Divider, Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useRewardBreakdown } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";

interface RewardRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

const RewardRow = ({ icon, label, value, highlight = false }: RewardRowProps) => (
  <InsetSlot padding="sm" style={styles.rewardSlot}>
    <View style={styles.rewardRow}>
      <View style={styles.rewardLeft}>
        {icon}
        <GameText
          variant={highlight ? "bodyLarge" : "bodyMedium"}
          color={highlight ? COLORS.text : COLORS.textMuted}
        >
          {label}
        </GameText>
      </View>
      <GameText
        variant={highlight ? "displaySmall" : "bodyLarge"}
        color={highlight ? COLORS.gold : COLORS.text}
        style={highlight ? styles.highlightValue : undefined}
      >
        {value}
      </GameText>
    </View>
  </InsetSlot>
);

interface CashoutResultListProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * CashoutResultList - Inline reward breakdown that replaces ScoringGrid
 * during LEVEL_RESULT phase. More compact than ResultPanel, no CTA button.
 */
export const CashoutResultList: React.FC<CashoutResultListProps> = ({
  style,
}) => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const rewards = useRewardBreakdown();

  const levelNumber = currentLevelIndex + 1;

  const getTierLabel = () => {
    switch (rewards.tier) {
      case 2:
        return "TIER 2";
      case 1:
        return "TIER 1";
      default:
        return "BASE";
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact Header */}
      <View style={styles.header}>
        <Trophy size={DIMENSIONS.iconSize.lg} color={COLORS.gold} />
        <GameText variant="displaySmall" color={COLORS.gold} style={styles.title}>
          LEVEL {levelNumber} COMPLETE
        </GameText>
      </View>

      {/* Rewards Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HUDCard header="REWARDS" headerColor={COLORS.textMuted}>
          <RewardRow
            icon={<View style={styles.iconPlaceholder} />}
            label="Current Money"
            value={`$${formatNumber(rewards.currentMoney)}`}
          />

          <Divider spacing="sm" />

          <RewardRow
            icon={<Trophy size={DIMENSIONS.iconSize.sm} color={COLORS.mint} />}
            label="Win Reward"
            value={`+$${rewards.baseReward}`}
          />

          <RewardRow
            icon={<Hand size={DIMENSIONS.iconSize.sm} color={COLORS.cyan} />}
            label={`Unused Hands (${rewards.unusedHandsCount})`}
            value={`+$${rewards.unusedHandsBonus}`}
          />

          <RewardRow
            icon={<Dices size={DIMENSIONS.iconSize.sm} color={COLORS.cyan} />}
            label={`Unused Rolls (${rewards.unusedRollsCount})`}
            value={`+$${rewards.unusedRollsBonus}`}
          />

          {rewards.tierBonus > 0 && (
            <View style={styles.tierRow}>
              <RewardRow
                icon={<Star size={DIMENSIONS.iconSize.sm} color={COLORS.gold} />}
                label="Tier Bonus"
                value={`+$${rewards.tierBonus}`}
              />
              <Chip
                label={getTierLabel()}
                color="gold"
                size="sm"
                style={styles.tierChip}
              />
            </View>
          )}

          <Divider spacing="sm" />

          {/* Total Payout - highlighted */}
          <RewardRow
            icon={<View style={styles.iconPlaceholder} />}
            label="TOTAL PAYOUT"
            value={`+$${rewards.totalPayout}`}
            highlight={true}
          />
        </HUDCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  rewardSlot: {
    marginBottom: SPACING.xs,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconPlaceholder: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
  },
  highlightValue: {
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tierRow: {
    flexDirection: "column",
    gap: SPACING.xs,
  },
  tierChip: {
    alignSelf: "flex-end",
    marginTop: -SPACING.xs,
  },
});
