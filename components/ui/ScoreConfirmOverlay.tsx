import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  X,
} from "lucide-react-native";
import { COLORS, DIMENSIONS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  CategoryId,
  CATEGORIES,
  calculateScore,
} from "../../utils/yahtzeeScoring";
import { triggerSelectionHaptic } from "../../utils/haptics";

const UPPER_TARGETS: Record<string, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

const getScoringDice = (
  diceValues: number[],
  categoryId: CategoryId
): number[] => {
  if (categoryId in UPPER_TARGETS) {
    const target = UPPER_TARGETS[categoryId];
    return diceValues.filter((value) => value === target);
  }

  const counts = diceValues.reduce<Record<number, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  const pickKind = (required: number) => {
    let bestValue = diceValues[0] ?? 1;
    let bestCount = 0;
    for (const [valueStr, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestValue = Number(valueStr);
      }
    }
    if (bestCount < required) return [];
    return Array.from({ length: required }, () => bestValue);
  };

  switch (categoryId) {
    case "threeOfKind":
      return pickKind(3);
    case "fourOfKind":
      return pickKind(4);
    case "fullHouse": {
      let tripleValue: number | null = null;
      let pairValue: number | null = null;
      for (const [valueStr, count] of Object.entries(counts)) {
        if (count === 3) tripleValue = Number(valueStr);
        if (count === 2) pairValue = Number(valueStr);
      }
      if (tripleValue === null || pairValue === null) return [];
      return [tripleValue, tripleValue, tripleValue, pairValue, pairValue];
    }
    case "smallStraight": {
      const unique = Array.from(new Set(diceValues)).sort((a, b) => a - b);
      const patterns = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6],
      ];
      const match = patterns.find((pattern) =>
        pattern.every((value) => unique.includes(value))
      );
      return match ?? [];
    }
    case "largeStraight": {
      const unique = Array.from(new Set(diceValues)).sort((a, b) => a - b);
      const patterns = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
      ];
      const match = patterns.find((pattern) =>
        pattern.every((value) => unique.includes(value))
      );
      return match ?? [];
    }
    case "yahtzee":
    case "chance":
      return diceValues;
    default:
      return [];
  }
};

export const ScoreConfirmOverlay = () => {
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const clearPendingCategory = useGameStore((s) => s.clearPendingCategory);
  const diceValues = useGameStore((s) => s.diceValues);

  if (!pendingCategoryId) return null;

  const categoryDef = CATEGORIES.find((c) => c.id === pendingCategoryId);
  const label = categoryDef?.labelDe || pendingCategoryId;
  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const scoringDice = getScoringDice(diceValues, pendingCategoryId);
  const displayDice = scoringDice.length > 0 ? scoringDice : diceValues;
  const score = calculateScore(diceValues, pendingCategoryId);

  const handleCancel = () => {
    triggerSelectionHaptic();
    clearPendingCategory();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <X size={16} color={COLORS.textMuted} strokeWidth={3} />
        </TouchableOpacity>

        <View style={styles.diceRow}>
          {displayDice.map((value, index) => {
            const Icon = diceIcons[Math.max(1, Math.min(6, value)) - 1];
            return (
              <Icon
                key={`${value}-${index}`}
                size={22}
                color={COLORS.textWhite}
                strokeWidth={2}
                style={styles.diceIcon}
              />
            );
          })}
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.subtitle}>+{score} PUNKTE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent", // Non-blocking background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 90,
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.cyan, // Highlight border
    borderWidth: 2,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    minWidth: 220,
  },
  closeButton: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  diceRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  diceIcon: {
    opacity: 1,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Bungee-Regular",
    fontSize: 20,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.cyan,
    fontFamily: "Bungee-Regular",
    fontSize: 16,
    textAlign: "center",
  },
});
