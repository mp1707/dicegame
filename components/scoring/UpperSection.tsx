import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId } from "../../utils/yahtzeeScoring";
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

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const isActive = !isFilled && validCategories.includes(categoryId);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isActive) state = "active";

  const stateStyle = SLOT_STATES[state];

  const handlePress = () => {
    if (isActive) {
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
        },
        isActive && styles.activeGlow,
      ]}
      onPress={handlePress}
      disabled={!isActive}
      activeOpacity={0.7}
    >
      <CategoryIcon
        categoryId={categoryId}
        size={26}
        strokeWidth={2}
        color={stateStyle.textColor}
      />
    </TouchableOpacity>
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.container}>
      {UPPER_CATEGORIES.map((id) => (
        <UpperSlot key={id} categoryId={id} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
    paddingHorizontal: SPACING.screenPadding,
  },
  upperSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  activeGlow: {
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
});
