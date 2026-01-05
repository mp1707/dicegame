import React, { useEffect } from "react";
import { View, StyleSheet, Image, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { GameText } from "../shared";
import { Surface, InsetSlot, Divider } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useRewardBreakdown } from "../../store/gameStore";
import { triggerLightImpact } from "../../utils/haptics";

interface CashoutRewardsPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * CashoutRewardsPanel - Reward breakdown list for LEVEL_RESULT phase (bottom panel)
 *
 * Layout:
 * - Single surface container
 * - Rows: Label (Left) + Value in Inset (Right)
 * - Includes Total Sum at bottom
 */
export const CashoutRewardsPanel: React.FC<CashoutRewardsPanelProps> = ({
  style,
}) => {
  const rewards = useRewardBreakdown();

  useEffect(() => {
    // Haptic feedback when appearing
    triggerLightImpact();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Surface variant="panel" style={styles.panelContent}>
        <View style={styles.listContainer}>
          {/* Base Win */}
          <RewardRow label="Level Belohnung" value={rewards.baseReward} />

          {/* Unused Hands */}
          <RewardRow
            label={`Hände übrig (${rewards.unusedHandsCount})`}
            value={rewards.unusedHandsBonus}
          />

          <Divider />

          {/* Total */}
          <RewardRow label="GESAMT" value={rewards.totalPayout} isTotal />
        </View>
      </Surface>
    </View>
  );
};

interface RewardRowProps {
  label: string;
  value: number;
  isTotal?: boolean;
}

const RewardRow: React.FC<RewardRowProps> = ({
  label,
  value,
  isTotal = false,
}) => (
  <View style={styles.row}>
    <GameText
      variant={isTotal ? "label" : "bodyMedium"}
      color={isTotal ? COLORS.text : COLORS.textMuted}
      style={styles.label}
    >
      {label}
    </GameText>

    <InsetSlot
      padding="sm" // Corrected from xs to sm
      style={[styles.valueInset, isTotal && styles.totalInset]}
    >
      <Image
        source={require("../../assets/icons/coin.png")}
        style={[styles.coinIcon, isTotal && styles.coinIconTotal]}
      />
      <GameText
        variant={isTotal ? "scoreboardSmall" : "bodyMedium"}
        color={COLORS.gold}
      >
        {value}
      </GameText>
    </InsetSlot>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  panelContent: {
    padding: SPACING.md,
  },
  listContainer: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  label: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  valueInset: {
    width: "33%", // Fixed width as requested
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Align numbers to the right
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  totalInset: {
    backgroundColor: COLORS.overlays.blackMedium, // Darker background for total
    borderColor: COLORS.gold, // Gold accent for total
  },
  coinIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  coinIconTotal: {
    width: 16,
    height: 16,
  },
});
