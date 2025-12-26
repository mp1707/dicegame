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
  const submitCategory = useGameStore((s) => s.submitCategory);
  const validCategories = useValidCategories();

  // Get category metadata (label)
  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  const label = categoryDef?.labelDe || categoryId;

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const isPossible = !isFilled && validCategories.includes(categoryId);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isPossible) state = "possible";

  const stateStyle = SLOT_STATES[state];

  // Derive colors that were previously in SLOT_STATES
  const iconColor = isFilled
    ? COLORS.amber
    : isPossible
    ? COLORS.cyan
    : COLORS.textMuted;

  const labelColor = isFilled
    ? COLORS.amber
    : isPossible
    ? COLORS.text
    : COLORS.textMuted;

  const handlePress = () => {
    if (isPossible) {
      submitCategory(categoryId);
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
          // Apply shadows/elevation manually if needed or from stateStyle if it has them (it does)
          shadowColor: stateStyle.shadowColor,
          elevation: (stateStyle as any).elevation,
        },
        isPossible && styles.possibleGlow,
      ]}
      onPress={handlePress}
      disabled={!isPossible}
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
  possibleGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
