import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { Button, GameText } from "../shared";
import { Surface } from "../pixel-ui-kit";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { Check } from "lucide-react-native";

// Hand configuration for upper section (1-6 dice)
const UPPER_HANDS: { id: HandId; label: string; icon: ImageSourcePropType }[] =
  [
    {
      id: "ones",
      label: "Einser",
      icon: require("../../assets/icons/1die.png"),
    },
    {
      id: "twos",
      label: "Zweier",
      icon: require("../../assets/icons/2die.png"),
    },
    {
      id: "threes",
      label: "Dreier",
      icon: require("../../assets/icons/3die.png"),
    },
    {
      id: "fours",
      label: "Vierer",
      icon: require("../../assets/icons/4die.png"),
    },
    {
      id: "fives",
      label: "Fünfer",
      icon: require("../../assets/icons/5die.png"),
    },
    {
      id: "sixes",
      label: "Sechser",
      icon: require("../../assets/icons/6die.png"),
    },
  ];

// Hand configuration for "of a kind" hands (row 2)
const KIND_HANDS: { id: HandId; label: string; icon: ImageSourcePropType }[] = [
  {
    id: "threeOfKind",
    label: "Dreierpasch",
    icon: require("../../assets/icons/3x.png"),
  },
  {
    id: "fourOfKind",
    label: "Viererpasch",
    icon: require("../../assets/icons/4x.png"),
  },
  {
    id: "yahtzee",
    label: "Fünferpasch",
    icon: require("../../assets/icons/5x.png"),
  },
];

// Hand configuration for full house and straights (row 3)
const STRAIGHT_HANDS: {
  id: HandId;
  label: string;
  icon: ImageSourcePropType;
}[] = [
  {
    id: "fullHouse",
    label: "Full House",
    icon: require("../../assets/icons/fullHouse.png"),
  },
  {
    id: "smallStraight",
    label: "Kleine Straße",
    icon: require("../../assets/icons/smStraight.png"),
  },
  {
    id: "largeStraight",
    label: "Große Straße",
    icon: require("../../assets/icons/lgStraight.png"),
  },
];

// Hook to get hand slot state and handlers
const useHandSlot = (handId: HandId) => {
  const {
    handLevel,
    usedHandsThisLevel,
    selectedHandId,
    phase,
    hasRolledThisHand,
    isRolling,
  } = useGameStore(
    useShallow((s) => ({
      handLevel: s.handLevels[handId],
      usedHandsThisLevel: s.usedHandsThisLevel,
      selectedHandId: s.selectedHandId,
      phase: s.phase,
      hasRolledThisHand: s.hasRolledThisHand,
      isRolling: s.isRolling,
    }))
  );

  const selectHand = useGameStore((s) => s.selectHand);
  const deselectHand = useGameStore((s) => s.deselectHand);
  const validHands = useValidHands();

  const isUsed = usedHandsThisLevel.includes(handId);
  const canInteract = phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
  const isValid = canInteract && !isUsed && validHands.includes(handId);
  const isSelected = selectedHandId === handId;

  const handlePress = () => {
    if (isSelected) {
      deselectHand();
    } else if (isValid) {
      selectHand(handId);
    }
  };

  return {
    level: handLevel,
    isUsed,
    isValid,
    isSelected,
    disabled: !isValid || isUsed,
    handlePress,
  };
};

// Level Badge Component
interface LevelBadgeProps {
  level: number;
  style?: object;
}

const LevelBadge = React.memo(({ level, style }: LevelBadgeProps) => (
  <Surface
    tintColor={COLORS.overlays.whiteMedium}
    padding="xxs"
    style={[styles.levelBadge, style]}
    contentStyle={styles.levelBadgeContent}
  >
    <GameText variant="caption" style={styles.levelText}>
      LV {level}
    </GameText>
  </Surface>
));

// Upper Section Button: Centered icon, label below, level badge top-right (partially outside)
interface UpperSectionButtonProps {
  handId: HandId;
  label: string;
  iconSource: ImageSourcePropType;
}

const UpperSectionButton = React.memo(
  ({ handId, label, iconSource }: UpperSectionButtonProps) => {
    const { level, isUsed, isValid, isSelected, disabled, handlePress } =
      useHandSlot(handId);

    const getButtonColor = () => {
      if (isUsed) return COLORS.surface2;
      if (isSelected) return COLORS.purple;
      return COLORS.purple;
    };

    return (
      <View style={styles.upperButtonWrapper}>
        <Button
          onPress={handlePress}
          disabled={disabled}
          selected={isSelected}
          activeColor={getButtonColor()}
          selectedColor={COLORS.purple}
          disabledColor={COLORS.surface2}
          padding="sm"
          depth={3}
          style={styles.upperButton}
          contentStyle={styles.upperButtonContent}
        >
          <View style={styles.upperInnerContent}>
            {isUsed ? (
              <Check size={20} color={COLORS.goldDark} strokeWidth={2.5} />
            ) : (
              <Image
                source={iconSource}
                style={[
                  styles.upperIcon,
                  { opacity: disabled && !isUsed ? 0.5 : 1 },
                ]}
                resizeMode="contain"
              />
            )}
            <GameText
              variant="caption"
              color={
                isUsed
                  ? COLORS.goldDark
                  : disabled
                  ? COLORS.textMuted
                  : COLORS.text
              }
              style={styles.upperLabel}
            >
              {label}
            </GameText>
          </View>
        </Button>
        <LevelBadge level={level} style={styles.upperLevelBadge} />
      </View>
    );
  }
);

// Lower Section Button: Two columns - icon left, level badge + label right
interface LowerSectionButtonProps {
  handId: HandId;
  label: string;
  iconSource: ImageSourcePropType;
}

const LowerSectionButton = React.memo(
  ({ handId, label, iconSource }: LowerSectionButtonProps) => {
    const { level, isUsed, isValid, isSelected, disabled, handlePress } =
      useHandSlot(handId);

    const getButtonColor = () => {
      if (isUsed) return COLORS.surface2;
      if (isSelected) return COLORS.purple;
      return COLORS.purple;
    };

    return (
      <Button
        onPress={handlePress}
        disabled={disabled}
        selected={isSelected}
        activeColor={getButtonColor()}
        selectedColor={COLORS.purple}
        disabledColor={COLORS.surface2}
        padding="sm"
        depth={3}
        style={styles.lowerButton}
        contentStyle={styles.lowerButtonContent}
      >
        <View style={styles.lowerInnerContent}>
          {/* Left column: Icon */}
          <View style={styles.lowerIconContainer}>
            {isUsed ? (
              <Check size={24} color={COLORS.goldDark} strokeWidth={2.5} />
            ) : (
              <Image
                source={iconSource}
                style={[
                  styles.lowerIcon,
                  { opacity: disabled && !isUsed ? 0.5 : 1 },
                ]}
                resizeMode="contain"
              />
            )}
          </View>
          {/* Right column: Level badge + Label */}
          <View style={styles.lowerRightColumn}>
            <LevelBadge level={level} />
            <GameText
              variant="body"
              color={
                isUsed
                  ? COLORS.goldDark
                  : disabled
                  ? COLORS.textMuted
                  : COLORS.text
              }
              style={styles.lowerLabel}
            >
              {label}
            </GameText>
          </View>
        </View>
      </Button>
    );
  }
);

export const ScoringGrid = () => {
  return (
    <View style={styles.container}>
      {/* Row 1: Upper Section - 6 dice buttons */}
      <View style={styles.row}>
        {UPPER_HANDS.map((hand) => (
          <UpperSectionButton
            key={hand.id}
            handId={hand.id}
            label={hand.label}
            iconSource={hand.icon}
          />
        ))}
      </View>

      {/* Row 2: Of a kind hands */}
      <View style={styles.row}>
        {KIND_HANDS.map((hand) => (
          <LowerSectionButton
            key={hand.id}
            handId={hand.id}
            label={hand.label}
            iconSource={hand.icon}
          />
        ))}
      </View>

      {/* Row 3: Full House and Straights */}
      <View style={styles.row}>
        {STRAIGHT_HANDS.map((hand) => (
          <LowerSectionButton
            key={hand.id}
            handId={hand.id}
            label={hand.label}
            iconSource={hand.icon}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "flex-start",
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.xs,
    flex: 1,
  },

  // Upper Section Button styles
  upperButtonWrapper: {
    flex: 1,
    position: "relative",
  },
  upperButton: {
    flex: 1,
  },
  upperButtonContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  upperInnerContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xxs,
  },
  upperIcon: {
    width: 28,
    height: 28,
  },
  upperLabel: {
    textAlign: "center",
    fontSize: 11,
  },
  upperLevelBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },

  // Lower Section Button styles
  lowerButton: {
    flex: 1,
  },
  lowerButtonContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  lowerInnerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    width: "100%",
  },
  lowerIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  lowerIcon: {
    width: 32,
    height: 32,
  },
  lowerRightColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  lowerLabel: {
    fontSize: 13,
  },

  // Level Badge styles
  levelBadge: {
    alignSelf: "flex-start", // Prevent stretching in flex containers
  },
  levelBadgeContent: {
    flex: 0, // Override Surface's default flex: 1
  },
  levelText: {
    color: COLORS.text,
  },
});
