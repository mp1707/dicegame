import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { CategoryIcon } from "../ui/CategoryIcon";
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";
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
        {/* Icon */}
        <View style={styles.iconContainer}>
          <CategoryIcon
            categoryId={handId}
            size={32}
            color={canAfford ? COLORS.cyan : COLORS.textMuted}
          />
        </View>

        {/* Hand name */}
        <Text
          style={[styles.handName, !canAfford && styles.textDisabled]}
          numberOfLines={2}
        >
          {label}
        </Text>

        {/* Level badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LV {level}</Text>
          <Text style={styles.arrowText}> → </Text>
          <Text style={[styles.levelText, styles.newLevel]}>LV {level + 1}</Text>
        </View>

        {/* Cost */}
        <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
          <Text
            style={[styles.costText, !canAfford && styles.costTextDisabled]}
          >
            ${cost}
          </Text>
        </View>
      </View>
    </Pressable3DBase>
  );
};

export const UpgradePickerScreen = () => {
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
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable3DBase
          onPress={handleBack}
          depth={3}
          borderRadius={8}
          showLighting={false}
          style={styles.backButton}
          face={<View style={styles.backButtonFace} />}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable3DBase>

        <Text style={styles.title}>CHOOSE UPGRADE</Text>

        <View style={styles.moneyBadge}>
          <Text style={styles.moneyText}>${formatNumber(money)}</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Select a hand to increase its base points by +5
      </Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  backButtonFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Bungee-Regular",
    letterSpacing: 1,
  },
  moneyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 200, 87, 0.15)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  moneyText: {
    color: COLORS.gold,
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginBottom: 24,
  },
  optionsGrid: {
    flex: 1,
    gap: 16,
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
    borderWidth: 2,
    borderColor: COLORS.cyan,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  cardFaceDisabled: {
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.bg,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
  },
  handName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter-Bold",
    textTransform: "uppercase",
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 6,
  },
  levelText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter-Bold",
  },
  arrowText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  newLevel: {
    color: COLORS.mint,
  },
  costBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.mint,
    borderRadius: 6,
  },
  costBadgeDisabled: {
    backgroundColor: COLORS.coral,
    opacity: 0.8,
  },
  costText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
  costTextDisabled: {
    color: COLORS.text,
  },
});
