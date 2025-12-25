import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId, calculateScore } from "../../utils/yahtzeeScoring";

// Pip patterns for dice faces (1-6)
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.5],
    [0.75, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
};

const UPPER_CATEGORIES: { id: CategoryId; number: number }[] = [
  { id: "ones", number: 1 },
  { id: "twos", number: 2 },
  { id: "threes", number: 3 },
  { id: "fours", number: 4 },
  { id: "fives", number: 5 },
  { id: "sixes", number: 6 },
];

interface DiceIconProps {
  value: number;
  size: number;
  color: string;
}

const DiceIcon = ({ value, size, color }: DiceIconProps) => {
  const pips = PIP_LAYOUTS[value] || [];
  const pipSize = size * 0.18;

  return (
    <View style={[styles.diceIcon, { width: size, height: size }]}>
      {pips.map(([x, y], i) => (
        <View
          key={i}
          style={[
            styles.pip,
            {
              width: pipSize,
              height: pipSize,
              borderRadius: pipSize / 2,
              backgroundColor: color,
              left: x * size - pipSize / 2,
              top: y * size - pipSize / 2,
            },
          ]}
        />
      ))}
    </View>
  );
};

interface UpperSlotProps {
  categoryId: CategoryId;
  diceNumber: number;
}

const UpperSlot = ({ categoryId, diceNumber }: UpperSlotProps) => {
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
      <DiceIcon value={diceNumber} size={24} color={stateStyle.textColor} />

      {/* Score or dash */}
      <Text style={[styles.slotScore, { color: stateStyle.textColor }]}>
        {isFilled ? slot.score ?? "-" : isActive ? `+${potentialScore}` : "-"}
      </Text>

      {/* Checkmark for active */}
      {stateStyle.showCheckmark && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.container}>
      {UPPER_CATEGORIES.map(({ id, number }) => (
        <UpperSlot key={id} categoryId={id} diceNumber={number} />
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
  diceIcon: {
    position: "relative",
  },
  pip: {
    position: "absolute",
  },
  slotScore: {
    fontSize: 10,
    fontWeight: "900",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "700",
  },
});
