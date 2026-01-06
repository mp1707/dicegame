import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { GameText, TileButton, TileButtonState } from "../shared";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore, HandId } from "../../store/gameStore";
import { getUpgradeCost } from "../../utils/gameCore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import {
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";

// Stagger delay between cards
const CARD_STAGGER = 90;

interface UpgradeTileProps {
  handId: HandId;
  level: number;
  cost: number;
  canAfford: boolean;
  onPress: () => void;
  animationDelay: number;
  isSelected: boolean;
  isOtherSelected: boolean;
}

// Icon mapping matching ScoringGrid
const HAND_ICONS: Partial<Record<HandId, any>> = {
  ones: require("../../assets/icons/1die.png"),
  twos: require("../../assets/icons/2die.png"),
  threes: require("../../assets/icons/3die.png"),
  fours: require("../../assets/icons/4die.png"),
  fives: require("../../assets/icons/5die.png"),
  sixes: require("../../assets/icons/6die.png"),
  threeOfKind: require("../../assets/icons/3x.png"),
  fourOfKind: require("../../assets/icons/4x.png"),
  fullHouse: require("../../assets/icons/fullHouse.png"),
  smallStraight: require("../../assets/icons/smStraight.png"),
  largeStraight: require("../../assets/icons/lgStraight.png"),
  yahtzee: require("../../assets/icons/5x.png"),
};

const UpgradeTile: React.FC<UpgradeTileProps> = ({
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
  const iconSource = HAND_ICONS[handId];

  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrance
    scale.value = withDelay(
      animationDelay,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: 200 }));
  }, [animationDelay]);

  useEffect(() => {
    // Selection effects on the container
    if (isOtherSelected) {
      opacity.value = withTiming(0.4, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
    } else {
      // Reset if deselecting (optional, but good for safety)
      if (!isOtherSelected && opacity.value < 1) {
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withTiming(1, { duration: 200 });
      }
    }
  }, [isOtherSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    flex: 1,
  }));

  const handlePress = () => {
    if (!canAfford) {
      triggerSelectionHaptic();
      return;
    }
    triggerImpactMedium();
    onPress();
  };

  // Map internal state to TileButtonState
  let tileState: TileButtonState = "default";
  if (isSelected) tileState = "selected";
  else if (canAfford) tileState = "active";
  else tileState = "invalid";

  return (
    <Animated.View style={animatedStyle}>
      <View style={{ flex: 1, alignItems: "center" }}>
        {/* Reused TileButton */}
        <TileButton
          iconSource={iconSource}
          labelLine1={label}
          level={level + 1}
          state={tileState}
          onPress={handlePress}
          style={styles.tileButton}
        />

        {/* Cost Pill - Outside/Below Tile */}
        <View style={[styles.costPill, !canAfford && styles.costPillMuted]}>
          <Image
            source={require("../../assets/icons/coin.png")}
            style={[styles.coinIcon, !canAfford && { opacity: 0.5 }]}
          />
          <GameText
            variant="bodySmall"
            color={canAfford ? COLORS.gold : COLORS.textMuted}
          >
            {cost}
          </GameText>
        </View>
      </View>
    </Animated.View>
  );
};

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

  const handleSelectHand = useCallback(
    (handId: HandId) => {
      setSelectedHandId(handId);
      // Delay the actual action to show animation
      setTimeout(() => {
        pickUpgradeHand(handId);
      }, 400); // 400ms to allow shine animation
    },
    [pickUpgradeHand]
  );

  return (
    <View style={styles.container}>
      {/* Horizontal Upgrade Tiles - header is now in UpgradeTrayOverlay */}
      <View style={styles.optionsContainer}>
        {upgradeOptions.map((handId, index) => {
          const currentLevel = handLevels[handId];
          const cost = getUpgradeCost(currentLevel);
          const canAfford = money >= cost;

          return (
            <UpgradeTile
              key={handId}
              handId={handId}
              level={currentLevel}
              cost={cost}
              canAfford={canAfford}
              onPress={() => handleSelectHand(handId)}
              animationDelay={100 + index * CARD_STAGGER}
              isSelected={selectedHandId === handId}
              isOtherSelected={
                selectedHandId !== null && selectedHandId !== handId
              }
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
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "center", // Vertically center the whole content
    paddingBottom: SPACING.xl, // Push up slightly
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    height: 30,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: SPACING.xxs, // Tighter gap to match shop
    height: 120,
    alignItems: "flex-start",
  },

  // UpgradeTile Styles
  tileButton: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 90,
  },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.overlays.blackSubtle,
  },
  costPillMuted: {
    opacity: 0.6,
  },
  coinIcon: {
    width: 12,
    height: 12,
    resizeMode: "contain",
  },
});
