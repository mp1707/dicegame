import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { ScrollText, Check } from "lucide-react-native";
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

  // Get category metadata (label)
  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  // Manual overrides for long labels if needed to fit 6-col
  let label = categoryDef?.labelDe || categoryId;
  // Abbreviate some labels for space
  if (label === "Dreier Pasch") label = "3er P.";
  if (label === "Vierer Pasch") label = "4er P.";
  if (label === "Kleine Straße") label = "Kl.Str";
  if (label === "Große Straße") label = "Gr.Str";
  if (label === "Full House") label = "Full H.";

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const isPossible = !isFilled && validCategories.includes(categoryId);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isPossible) state = "possible";

  const stateStyle = SLOT_STATES[state];

  // Derive colors
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
        styles.lowerSlot,
        {
          backgroundColor: stateStyle.backgroundColor,
          borderColor: stateStyle.borderColor,
          borderWidth: stateStyle.borderWidth,
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

const OverviewButton = () => {
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  return (
    <TouchableOpacity
      style={[
        styles.lowerSlot,
        {
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          borderWidth: 1,
        },
      ]}
      onPress={toggleOverview}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <ScrollText size={20} color={COLORS.textMuted} strokeWidth={2} />
        <Text style={[styles.label, { color: COLORS.textMuted }]}>
          Übersicht
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const LowerSection = () => {
  // Use a simple flex-wrap container instead of calculating rows manually for max flexibility with 4 columns
  // We need 4 empty spacers between Chance (index 0 of last row) and Overview (index 5).
  // Lower categories: 3kind, 4kind, FH, SmStr, LgStr, Yahtzee (6 items - Row 1)
  // Chance (1 item - Row 2)
  // So Chance is the first item of the second row of THIS section.

  return (
    <View style={styles.container}>
      {LOWER_CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.slotWrapper}>
          <LowerSlot categoryId={cat.id} />
        </View>
      ))}

      {/* 4 Spacers */}
      {[...Array(4)].map((_, i) => (
        <View key={`spacer-${i}`} style={styles.slotWrapper} />
      ))}

      {/* Overview Button at the end */}
      <View style={styles.slotWrapper}>
        <OverviewButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    // paddingHorizontal handled by ScoringGrid
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    width: "15.4%", // 6 columns
  },
  lowerSlot: {
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
    fontSize: 8,
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
