import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Trophy, Hand, Dices, Star } from "lucide-react-native";
import { PrimaryButton, GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useRewardBreakdown } from "../../store/gameStore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";

interface RewardRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

const RewardRow = ({ icon, label, value, highlight = false }: RewardRowProps) => (
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
);

export const ResultScreen = () => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const openShop = useGameStore((s) => s.openShop);
  const rewards = useRewardBreakdown();

  const levelNumber = currentLevelIndex + 1;

  const handleOpenShop = () => {
    triggerSelectionHaptic();
    openShop();
  };

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Trophy size={DIMENSIONS.iconSize.xl} color={COLORS.gold} />
        <GameText variant="displayMedium" color={COLORS.gold} style={styles.title}>
          LEVEL {levelNumber} COMPLETE
        </GameText>
      </View>

      {/* Rewards list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.rewardsList}
        showsVerticalScrollIndicator={false}
      >
        <RewardRow
          icon={<View style={styles.iconPlaceholder} />}
          label="Current Money"
          value={`$${formatNumber(rewards.currentMoney)}`}
        />

        <View style={styles.divider} />

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
          <RewardRow
            icon={<Star size={DIMENSIONS.iconSize.sm} color={COLORS.gold} />}
            label={`${getTierLabel()} Bonus`}
            value={`+$${rewards.tierBonus}`}
          />
        )}

        <View style={styles.divider} />

        <RewardRow
          icon={<View style={styles.iconPlaceholder} />}
          label="TOTAL PAYOUT"
          value={`+$${rewards.totalPayout}`}
          highlight={true}
        />
      </ScrollView>

      {/* CTA Button */}
      <View style={styles.footer}>
        <PrimaryButton
          onPress={handleOpenShop}
          label="SHOP"
          variant="mint"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  title: {
    textAlign: "center",
    textShadowColor: COLORS.shadows.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  rewardsList: {
    backgroundColor: COLORS.overlays.blackMild,
    borderRadius: DIMENSIONS.borderRadius,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  rewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.overlays.whiteMild,
    marginVertical: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
