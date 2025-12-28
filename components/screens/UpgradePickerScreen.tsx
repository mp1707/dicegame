import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
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
import { triggerSelectionHaptic, triggerLightImpact } from "../../utils/haptics";

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
      depth={6}
      borderRadius={DIMENSIONS.borderRadius}
      showLighting={false}
      style={[styles.card, !canAfford && styles.cardDisabled]}
      face={
        <View
          style={[styles.cardFace, !canAfford && styles.cardFaceDisabled]}
        />
      }
    >
      <View style={styles.cardContent}>
        {/* Icon in InsetSlot */}
        <InsetSlot padding="sm" style={styles.iconContainer}>
          <CategoryIcon
            categoryId={handId}
            size={DIMENSIONS.iconSize.xl}
            color={canAfford ? COLORS.cyan : COLORS.textMuted}
          />
        </InsetSlot>

        {/* Hand name */}
        <GameText
          variant="bodyMedium"
          color={canAfford ? COLORS.text : COLORS.textMuted}
          numberOfLines={2}
          style={styles.handName}
        >
          {label}
        </GameText>

        {/* Level badge using Chip */}
        <Chip
          label={`LV ${level} → ${level + 1}`}
          color={canAfford ? "mint" : "muted"}
          size="sm"
        />

        {/* Cost badge */}
        <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
          <GameText
            variant="bodyMedium"
            color={canAfford ? COLORS.textDark : COLORS.text}
          >
            ${cost}
          </GameText>
        </View>
      </View>
    </Pressable3DBase>
  );
};

interface UpgradePickerPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * UpgradePickerPanel - The inner content, extracted for PhaseDeck animation
 */
export const UpgradePickerPanel: React.FC<UpgradePickerPanelProps> = ({ style }) => {
  const money = useGameStore((s) => s.money);
  const handLevels = useGameStore((s) => s.handLevels);
  const upgradeOptions = useGameStore((s) => s.upgradeOptions);
  const pickUpgradeHand = useGameStore((s) => s.pickUpgradeHand);

  const handleBack = () => {
    // Go back to shop main
    useGameStore.setState({ phase: "SHOP_MAIN" });
    triggerSelectionHaptic();
  };

  const handleSelectHand = (handId: HandId) => {
    pickUpgradeHand(handId);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable3DBase
          onPress={handleBack}
          depth={3}
          borderRadius={DIMENSIONS.borderRadiusSmall}
          showLighting={false}
          style={styles.backButton}
          face={<View style={styles.backButtonFace} />}
        >
          <ArrowLeft size={DIMENSIONS.iconSize.sm + 2} color={COLORS.text} />
        </Pressable3DBase>

        <GameText variant="scoreboardSmall" style={styles.title}>
          CHOOSE UPGRADE
        </GameText>

        <View style={styles.moneyBadge}>
          <GameText variant="bodyMedium" color={COLORS.gold}>
            ${formatNumber(money)}
          </GameText>
        </View>
      </View>

      {/* Subtitle */}
      <GameText variant="bodySmall" color={COLORS.textMuted} style={styles.subtitle}>
        Select a hand to increase its base points by +5
      </GameText>

      {/* Upgrade options */}
      <View style={styles.optionsGrid}>
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
      </View>
    </View>
  );
};

/**
 * UpgradePickerScreen - Full screen wrapper (for backwards compatibility)
 */
export const UpgradePickerScreen = () => {
  return <UpgradePickerPanel />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  backButtonFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.overlays.whiteMild,
  },
  title: {
    letterSpacing: 1,
  },
  moneyBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.iconGapMedium,
    backgroundColor: COLORS.overlays.goldSubtle,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.gold,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  optionsGrid: {
    flex: 1,
    gap: SPACING.lg,
  },
  card: {
    flex: 1,
    maxHeight: 140,
    borderRadius: DIMENSIONS.borderRadius,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.cyan,
    borderTopWidth: DIMENSIONS.borderWidthThin,
    borderTopColor: COLORS.overlays.whiteStrong,
    borderBottomWidth: DIMENSIONS.borderWidthThick + 1,
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
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  handName: {
    flex: 1,
    textTransform: "uppercase",
  },
  costBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.iconGapMedium,
    backgroundColor: COLORS.mint,
    borderRadius: SPACING.iconGapMedium,
  },
  costBadgeDisabled: {
    backgroundColor: COLORS.coral,
    opacity: 0.8,
  },
});
