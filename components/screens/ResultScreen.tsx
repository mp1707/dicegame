import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Trophy, Hand, Dices, Star } from "lucide-react-native";
import { PrimaryButton } from "../shared";
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
      <Text style={[styles.rewardLabel, highlight && styles.highlightText]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.rewardValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
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
        <Trophy size={32} color={COLORS.gold} />
        <Text style={styles.title}>LEVEL {levelNumber} COMPLETE</Text>
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
          icon={<Trophy size={18} color={COLORS.mint} />}
          label="Win Reward"
          value={`+$${rewards.baseReward}`}
        />

        <RewardRow
          icon={<Hand size={18} color={COLORS.cyan} />}
          label={`Unused Hands (${rewards.unusedHandsCount})`}
          value={`+$${rewards.unusedHandsBonus}`}
        />

        <RewardRow
          icon={<Dices size={18} color={COLORS.cyan} />}
          label={`Unused Rolls (${rewards.unusedRollsCount})`}
          value={`+$${rewards.unusedRollsBonus}`}
        />

        {rewards.tierBonus > 0 && (
          <RewardRow
            icon={<Star size={18} color={COLORS.gold} />}
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    color: COLORS.gold,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
    textAlign: "center",
    textShadowColor: "rgba(255, 200, 87, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  rewardsList: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
    gap: 12,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
  },
  rewardLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  rewardValue: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontVariant: ["tabular-nums"],
  },
  highlightText: {
    color: COLORS.text,
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
  highlightValue: {
    color: COLORS.gold,
    fontSize: 20,
    fontFamily: "Bungee-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
