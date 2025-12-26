import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Check } from "lucide-react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
} from "../../constants/theme";
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
  const scratchCategory = useGameStore((s) => s.scratchCategory);
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const validCategories = useValidCategories();
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);

  // Get category metadata (label)
  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  const label = categoryDef?.labelDe || categoryId;

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const canScore =
    (phase === "rolling" || phase === "scoring") &&
    hasRolledThisRound &&
    !isRolling;
  const hasPendingSelection = pendingCategoryId !== null;
  const isScratchable = canScore && scratchMode && !isFilled;
  const isPossibleBase =
    canScore &&
    !scratchMode &&
    !isFilled &&
    validCategories.includes(categoryId);
  const isPossible = isPossibleBase && !hasPendingSelection;
  const isSelected = pendingCategoryId === categoryId;
  const isPressable =
    isScratchable || (isPossibleBase && !hasPendingSelection);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isSelected) state = "selected";
  else if (isScratchable) state = "scratch";
  else if (isPossible) state = "possible";

  const stateStyle = SLOT_STATES[state];

  // Derive colors that were previously in SLOT_STATES
  const iconColor = isFilled
    ? COLORS.amber
    : isScratchable
    ? COLORS.red
    : isSelected
    ? COLORS.cyan
    : isPossible
    ? COLORS.cyan
    : COLORS.textMuted;

  const labelColor = isFilled
    ? COLORS.amber
    : isScratchable
    ? COLORS.red
    : isSelected
    ? COLORS.text
    : isPossible
    ? COLORS.text
    : COLORS.textMuted;

  const handlePress = () => {
    if (isScratchable) {
      triggerSelectionHaptic();
      scratchCategory(categoryId);
    } else if (isPossibleBase && !hasPendingSelection) {
      triggerSelectionHaptic();
      setPendingCategory(categoryId);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.upperSlot,
        {
          backgroundColor: stateStyle.backgroundColor,
          borderColor: stateStyle.borderColor,
          borderWidth: stateStyle.borderWidth,
          shadowColor: stateStyle.shadowColor,
          shadowOpacity: (stateStyle as any).shadowOpacity,
          shadowRadius: (stateStyle as any).shadowRadius,
          elevation: (stateStyle as any).elevation,
        },
      ]}
      onPress={handlePress}
      disabled={!isPressable}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {isFilled ? (
          <Check size={20} color={iconColor} strokeWidth={3} />
        ) : (
          <CategoryIcon
            categoryId={categoryId}
            size={20}
            strokeWidth={2}
            color={iconColor}
          />
        )}
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.container}>
      {UPPER_CATEGORIES.map((id) => (
        <View key={id} style={styles.slotWrapper}>
          <UpperSlot categoryId={id} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    // paddingHorizontal is handled by ScoringGrid
    gap: SPACING.slotGapHorizontal,
    marginBottom: SPACING.slotGapHorizontal, // Space between sections
  },
  slotWrapper: {
    // 6 Columns.
    // width = (100% - 5 * gap) / 6
    width: "15.4%",
  },
  upperSlot: {
    aspectRatio: 1,
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: "100%",
  },
  label: {
    fontSize: 8, // Very small for 6-col
    fontFamily: "PressStart2P-Regular",
    textAlign: "center",
    width: "100%",
  },
});
