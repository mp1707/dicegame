import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { CategoryIcon } from "../ui/CategoryIcon";
import { GameText } from "../shared";
import { Chip, InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { getUpgradeCost } from "../../utils/gameCore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import {
  triggerSelectionHaptic,
  triggerLightImpact,
} from "../../utils/haptics";

interface UpgradeCardProps {
  handId: HandId;
  level: number;
  cost: number;
  canAfford: boolean;
  onPress: () => void;
}

const UpgradeCard = ({
  handId,
  level,
  cost,
  canAfford,
  onPress,
}: UpgradeCardProps) => {
  const categoryDef = CATEGORIES.find((c) => c.id === handId);
  const label = categoryDef?.labelDe || handId;

  return (
    <Pressable3DBase
      onPress={() => {
        if (canAfford) {
          triggerLightImpact();
          onPress();
        } else {
          triggerSelectionHaptic();
        }
      }}
      depth={4}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      showLighting={false}
      style={[styles.card, !canAfford && styles.cardDisabled]}
      face={
        <View
          style={[styles.cardFace, !canAfford && styles.cardFaceDisabled]}
        />
      }
    >
      <View style={styles.cardContent}>
        {/* Icon */}
        <InsetSlot padding="sm" style={styles.iconContainer}>
          <CategoryIcon
            categoryId={handId}
            size={DIMENSIONS.iconSize.md}
            color={canAfford ? COLORS.cyan : COLORS.textMuted}
          />
        </InsetSlot>

        {/* Hand name + level */}
        <View style={styles.cardInfo}>
          <GameText
            variant="bodySmall"
            color={canAfford ? COLORS.text : COLORS.textMuted}
            numberOfLines={1}
          >
            {label}
          </GameText>
          <Chip
            label={`LV ${level}→${level + 1}`}
            color={canAfford ? "mint" : "muted"}
            size="sm"
          />
        </View>

        {/* Cost badge */}
        <View
          style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}
        >
          <GameText
            variant="bodySmall"
            color={canAfford ? COLORS.textDark : COLORS.text}
          >
            ${cost}
          </GameText>
        </View>
      </View>
    </Pressable3DBase>
  );
};

/**
 * UpgradeContent - Compact upgrade picker for bottom panel slot
 *
 * Simplified from full-screen UpgradePickerPanel:
 * - Compact horizontal card layout
 * - Back button to return to shop
 * - No money display (already in header)
 */
export const UpgradeContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const handLevels = useGameStore((s) => s.handLevels);
  const upgradeOptions = useGameStore((s) => s.upgradeOptions);
  const pickUpgradeHand = useGameStore((s) => s.pickUpgradeHand);

  const handleBack = () => {
    useGameStore.setState({ phase: "SHOP_MAIN" });
    triggerSelectionHaptic();
  };

  const handleSelectHand = (handId: HandId) => {
    pickUpgradeHand(handId);
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable3DBase
          onPress={handleBack}
          depth={2}
          borderRadius={DIMENSIONS.borderRadiusSmall}
          showLighting={false}
          style={styles.backButton}
          face={<View style={styles.backButtonFace} />}
        >
          <ArrowLeft size={DIMENSIONS.iconSize.sm} color={COLORS.text} />
        </Pressable3DBase>

        <GameText variant="bodyMedium" color={COLORS.textMuted}>
          SELECT UPGRADE (+5 BASE)
        </GameText>

        <View style={styles.moneyBadge}>
          <GameText variant="bodySmall" color={COLORS.gold}>
            ${formatNumber(money)}
          </GameText>
        </View>
      </View>

      {/* Upgrade options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {upgradeOptions.map((handId) => {
          const currentLevel = handLevels[handId];
          const cost = getUpgradeCost(currentLevel);
          const canAfford = money >= cost;

          return (
            <UpgradeCard
              key={handId}
              handId={handId}
              level={currentLevel}
              cost={cost}
              canAfford={canAfford}
              onPress={() => handleSelectHand(handId)}
            />
          );
        })}
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
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  backButtonFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteMild,
  },
  moneyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.overlays.goldSubtle,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.gold,
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  card: {
    height: 70,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.cyan,
    borderTopColor: COLORS.overlays.whiteStrong,
    borderBottomWidth: DIMENSIONS.borderWidthThick,
    borderBottomColor: COLORS.overlays.blackMedium,
  },
  cardFaceDisabled: {
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.bg,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    gap: SPACING.xxs,
  },
  costBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.mint,
    borderRadius: SPACING.xs,
  },
  costBadgeDisabled: {
    backgroundColor: COLORS.coral,
    opacity: 0.8,
  },
});
