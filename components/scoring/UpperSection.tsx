import React from "react";
import { View, StyleSheet } from "react-native";
import { TileButton, TileButtonVariant } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId, CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";

const UPPER_CATEGORIES: CategoryId[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

interface UpperSlotProps {
  categoryId: CategoryId;
}

const UpperSlot = ({ categoryId }: UpperSlotProps) => {
  const categories = useGameStore((s) => s.categories);
  const setPendingCategory = useGameStore((s) => s.setPendingCategory);
  const setPendingScratchCategory = useGameStore(
    (s) => s.setPendingScratchCategory
  );
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const validCategories = useValidCategories();
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const clearPendingCategory = useGameStore((s) => s.clearPendingCategory);
  const clearPendingScratchCategory = useGameStore(
    (s) => s.clearPendingScratchCategory
  );

  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  const label = categoryDef?.labelDe || categoryId;

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const canScore =
    (phase === "rolling" || phase === "scoring") &&
    hasRolledThisRound &&
    !isRolling;
  const isScratchable = canScore && scratchMode && !isFilled;

  const isPossibleBase =
    canScore &&
    !scratchMode &&
    !isFilled &&
    validCategories.includes(categoryId);

  const isPossible = isPossibleBase;
  const isScoreSelected = pendingCategoryId === categoryId;
  const isScratchSelected = pendingScratchCategoryId === categoryId;
  const isSelected = scratchMode ? isScratchSelected : isScoreSelected;
  const isPressable = isScratchable || isPossibleBase;

  // Determine variant
  let variant: TileButtonVariant = "default";
  if (isFilled) variant = "filled";
  else if (isScratchable) variant = "scratch";
  else if (isPossible) variant = "active";

  // Icon color based on state
  const iconColor = isFilled
    ? COLORS.text
    : isScratchable
    ? COLORS.coral
    : isSelected
    ? COLORS.cyan
    : isPossible
    ? COLORS.cyan
    : COLORS.textMuted;

  const handlePress = () => {
    if (isScratchable) {
      if (isScratchSelected) {
        triggerSelectionHaptic();
        clearPendingScratchCategory();
      } else {
        triggerSelectionHaptic();
        setPendingScratchCategory(categoryId);
      }
    } else if (isPossibleBase) {
      if (isScoreSelected) {
        triggerSelectionHaptic();
        clearPendingCategory();
      } else {
        triggerSelectionHaptic();
        setPendingCategory(categoryId);
      }
    }
  };

  return (
    <TileButton
      icon={
        <CategoryIcon
          categoryId={categoryId}
          size={16}
          strokeWidth={2.5}
          color={iconColor}
        />
      }
      label={label}
      level={1}
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
        {UPPER_CATEGORIES.map((id) => (
          <View key={id} style={styles.slotWrapper}>
            <UpperSlot categoryId={id} />
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
