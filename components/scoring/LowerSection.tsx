import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import {
  CategoryId,
  CATEGORIES,
  calculateScore,
} from "../../utils/yahtzeeScoring";

const LOWER_CATEGORIES = CATEGORIES.filter((c) => c.section === "lower");

interface LowerSlotProps {
  categoryId: CategoryId;
  label: string;
}

const LowerSlot = ({ categoryId, label }: LowerSlotProps) => {
  const categories = useGameStore((s) => s.categories);
  const diceValues = useGameStore((s) => s.diceValues);
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
  const potentialScore = calculateScore(diceValues, categoryId);

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
      {/* Category name */}
      <Text style={[styles.categoryLabel, { color: stateStyle.textColor }]}>
        {label}
      </Text>

      {/* Score and checkmark */}
      <View style={styles.rightSide}>
        <Text style={[styles.slotScore, { color: stateStyle.textColor }]}>
          {isFilled
            ? slot.scratched
              ? "0"
              : slot.score
            : isActive
            ? `+${potentialScore}`
            : "-"}
        </Text>
        {stateStyle.showCheckmark && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
};

export const LowerSection = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {LOWER_CATEGORIES.map((cat) => (
        <LowerSlot key={cat.id} categoryId={cat.id} label={cat.labelDe} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.slotGapVertical,
    paddingBottom: SPACING.sectionGap,
  },
  lowerSlot: {
    height: DIMENSIONS.lowerSlotHeight,
    borderRadius: DIMENSIONS.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  activeGlow: {
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryLabel: {
    ...TYPOGRAPHY.labels,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotScore: {
    ...TYPOGRAPHY.smallScore,
  },
  checkmark: {
    color: COLORS.cyan,
    fontSize: 14,
    fontWeight: "700",
  },
});
