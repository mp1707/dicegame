import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { CategoryIcon } from "../ui/CategoryIcon";
import { GameText } from "../shared";
import { Chip, InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { getUpgradeCost } from "../../utils/gameCore";
import { formatNumber } from "../../utils/yahtzeeScoring";
import {
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";

// Stagger delay between cards
const CARD_STAGGER = 90;

interface UpgradeCardProps {
  handId: HandId;
  level: number;
  cost: number;
  canAfford: boolean;
  onPress: () => void;
  animationDelay: number;
  isSelected: boolean;
  isOtherSelected: boolean;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  handId,
  level,
  cost,
  canAfford,
  onPress,
  animationDelay,
  isSelected,
  isOtherSelected,
}) => {
  const categoryDef = CATEGORIES.find((c) => c.id === handId);
  const label = categoryDef?.labelDe || handId;

  // Entrance animation
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  // Selection state
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Cascade entrance
    translateX.value = withDelay(
      animationDelay,
      withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: 200 }));
  }, [animationDelay]);

  useEffect(() => {
    // Selection animation
    if (isSelected) {
      // Chosen card: scale tick
      scale.value = withSequence(
        withTiming(1.02, { duration: 80 }),
        withSpring(1, ANIMATION.springs.rowLand)
      );
    } else if (isOtherSelected) {
      // Other cards: fade to 35%
      opacity.value = withTiming(0.35, { duration: 140 });
    }
  }, [isSelected, isOtherSelected]);

  const handlePress = () => {
    if (!canAfford) {
      triggerSelectionHaptic();
      return;
    }

    // Visual feedback before action
    scale.value = withSequence(
      withTiming(1.02, { duration: 60 }),
      withSpring(1, ANIMATION.springs.celebration)
    );

    triggerImpactMedium();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={handlePress}
        style={[
          styles.card,
          !canAfford && styles.cardDisabled,
          isPressed && canAfford && styles.cardPressed,
        ]}
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
      </Pressable>
    </Animated.View>
  );
};

/**
 * UpgradeContent - Enhanced upgrade picker with cascade animations
 *
 * Features:
 * - Cascade entrance animation (90ms stagger)
 * - Pressed state with cyan glow
 * - Selection feedback: chosen scales, others fade
 */
export const UpgradeContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const handLevels = useGameStore((s) => s.handLevels);
  const upgradeOptions = useGameStore((s) => s.upgradeOptions);
  const pickUpgradeHand = useGameStore((s) => s.pickUpgradeHand);

  // Track selected card for animation
  const [selectedHandId, setSelectedHandId] = useState<HandId | null>(null);

  // Header animation
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(6);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 180 });
    headerTranslateY.value = withTiming(0, { duration: 180 });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const handleBack = () => {
    useGameStore.setState({ phase: "SHOP_MAIN" });
    triggerSelectionHaptic();
  };

  const handleSelectHand = useCallback((handId: HandId) => {
    setSelectedHandId(handId);

    // Delay the actual action to show animation
    setTimeout(() => {
      pickUpgradeHand(handId);
    }, 200);
  }, [pickUpgradeHand]);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
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
      </Animated.View>

      {/* Upgrade options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {upgradeOptions.map((handId, index) => {
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
              animationDelay={100 + index * CARD_STAGGER}
              isSelected={selectedHandId === handId}
              isOtherSelected={selectedHandId !== null && selectedHandId !== handId}
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
    backgroundColor: COLORS.surface,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.cyan,
    borderTopColor: COLORS.overlays.whiteStrong,
    borderBottomWidth: DIMENSIONS.borderWidthThick,
    borderBottomColor: COLORS.overlays.blackMedium,
  },
  cardDisabled: {
    opacity: 0.6,
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.bg,
  },
  cardPressed: {
    borderColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
