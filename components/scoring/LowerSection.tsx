import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId, CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";

const LOWER_CATEGORIES = CATEGORIES.filter((c) => c.section === "lower");

interface LowerSlotProps {
  categoryId: CategoryId;
}

const LowerSlot = ({ categoryId }: LowerSlotProps) => {
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
        styles.lowerSlot,
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
        size={24}
        strokeWidth={2}
        color={stateStyle.textColor}
      />
    </TouchableOpacity>
  );
};

export const LowerSection = () => {
  const columns = 6;
  const rows: (typeof LOWER_CATEGORIES)[] = [];
  for (let i = 0; i < LOWER_CATEGORIES.length; i += columns) {
    rows.push(LOWER_CATEGORIES.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {Array.from({ length: columns }).map((_, index) => {
            const cat = row[index];
            if (!cat) {
              return (
                <View
                  key={`empty-${rowIndex}-${index}`}
                  style={[styles.lowerSlot, styles.placeholderSlot]}
                  pointerEvents="none"
                />
              );
            }

            return <LowerSlot key={cat.id} categoryId={cat.id} />;
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.sectionGap,
    gap: SPACING.slotGapVertical,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
  },
  lowerSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeGlow: {
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholderSlot: {
    opacity: 0,
  },
});
