import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from "react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
  TYPOGRAPHY,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId, CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.labelDe])
) as Record<CategoryId, string>;

interface SlotProps {
  categoryId: CategoryId;
  size: number;
}

const Slot = ({ categoryId, size }: SlotProps) => {
  const categories = useGameStore((s) => s.categories);
  const submitCategory = useGameStore((s) => s.submitCategory);
  const validCategories = useValidCategories();

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const isActive = !isFilled && validCategories.includes(categoryId);

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
        styles.slot,
        {
          width: size,
          height: size,
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
      <Text style={[styles.slotLabel, { color: stateStyle.textColor }]}>
        {CATEGORY_LABELS[categoryId]}
      </Text>
    </TouchableOpacity>
  );
};

export const ScoringGrid = () => {
  const columns = 6;
  const rows: (typeof CATEGORIES)[] = [];
  const { width: screenWidth } = useWindowDimensions();
  const slotSize =
    (screenWidth -
      SPACING.screenPadding * 2 -
      SPACING.slotGapHorizontal * (columns - 1)) /
    columns;

  for (let i = 0; i < CATEGORIES.length; i += columns) {
    rows.push(CATEGORIES.slice(i, i + columns));
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
                  style={[
                    styles.slot,
                    styles.placeholderSlot,
                    { width: slotSize, height: slotSize },
                  ]}
                  pointerEvents="none"
                />
              );
            }

            return <Slot key={cat.id} categoryId={cat.id} size={slotSize} />;
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
    gap: SPACING.slotGapHorizontal,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
  },
  slot: {
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  slotLabel: {
    ...TYPOGRAPHY.metaInfo,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
    flexShrink: 1,
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
