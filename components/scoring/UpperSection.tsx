import React from "react";
import { View, StyleSheet } from "react-native";
import { TileButton, TileButtonVariant } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";

const UPPER_HANDS: HandId[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

interface UpperSlotProps {
  handId: HandId;
}

const UpperSlot = ({ handId }: UpperSlotProps) => {
  const handLevels = useGameStore((s) => s.handLevels);
  const usedHandsThisLevel = useGameStore((s) => s.usedHandsThisLevel);
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const selectHand = useGameStore((s) => s.selectHand);
  const deselectHand = useGameStore((s) => s.deselectHand);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisHand = useGameStore((s) => s.hasRolledThisHand);
  const isRolling = useGameStore((s) => s.isRolling);
  const validHands = useValidHands();

  const categoryDef = CATEGORIES.find((c) => c.id === handId);
  const label = categoryDef?.labelDe || handId;
  const handLevel = handLevels[handId];

  // Determine states
  const isUsed = usedHandsThisLevel.includes(handId);
  const canInteract =
    phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
  const isValid = canInteract && !isUsed && validHands.includes(handId);
  const isSelected = selectedHandId === handId;
  const isPressable = isValid;

  // Determine variant
  let variant: TileButtonVariant = "default";
  if (isUsed) variant = "filled";
  else if (isValid) variant = "active";

  // Icon color based on state
  const iconColor = isUsed
    ? COLORS.text
    : isSelected
    ? COLORS.cyan
    : isValid
    ? COLORS.cyan
    : COLORS.textMuted;

  const handlePress = () => {
    if (!isPressable) return;

    if (isSelected) {
      triggerSelectionHaptic();
      deselectHand();
    } else {
      triggerSelectionHaptic();
      selectHand(handId);
    }
  };

  return (
    <TileButton
      icon={
        <CategoryIcon
          categoryId={handId}
          size={16}
          strokeWidth={2.5}
          color={iconColor}
        />
      }
      label={label}
      level={handLevel}
      variant={variant}
      selected={isSelected}
      disabled={!isPressable}
      onPress={handlePress}
      style={styles.slotStyle}
    />
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {UPPER_HANDS.map((id) => (
          <View key={id} style={styles.slotWrapper}>
            <UpperSlot handId={id} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 8,
    marginBottom: SPACING.slotGapHorizontal,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    width: "15%",
  },
  slotStyle: {
    aspectRatio: 0.85,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
});
