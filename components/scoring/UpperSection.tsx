import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Check } from "lucide-react-native";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  SLOT_STATES,
  TYPOGRAPHY,
} from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import {
  CategoryId,
  CATEGORIES,
  calculateScore,
} from "../../utils/yahtzeeScoring";
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
  isBestOption?: boolean;
}

const UpperSlot = ({ categoryId, isBestOption }: UpperSlotProps) => {
  const categories = useGameStore((s) => s.categories);
  const setPendingCategory = useGameStore((s) => s.setPendingCategory);
  const scratchCategory = useGameStore((s) => s.scratchCategory);
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const diceValues = useGameStore((s) => s.diceValues);
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
  const isPressable = isScratchable || (isPossibleBase && !hasPendingSelection);

  // Calculate predicted score if possible
  const predictedScore = useMemo(() => {
    if (isPossible || isSelected) {
      return calculateScore(diceValues, categoryId);
    }
    return 0;
  }, [diceValues, categoryId, isPossible, isSelected]);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isSelected) state = "selected";
  else if (isScratchable) state = "scratch";
  else if (isPossible) state = "possible";

  const stateStyle = SLOT_STATES[state];

  // Dynamic Styles
  const containerStyle = [
    styles.upperSlot,
    {
      backgroundColor: stateStyle.backgroundColor,
      borderColor: stateStyle.borderColor,
      borderWidth: stateStyle.borderWidth,
      // Manual shadow properties
      shadowColor: stateStyle.shadowColor,
      shadowOpacity: (stateStyle as any).shadowOpacity || 0,
      shadowRadius: (stateStyle as any).shadowRadius || 0,
      elevation: (stateStyle as any).elevation || 0,
    },
    // Bevel hacks
    stateStyle.borderTopColor && {
      borderTopWidth: stateStyle.borderTopWidth,
      borderTopColor: stateStyle.borderTopColor,
      borderBottomWidth: stateStyle.borderBottomWidth,
      borderBottomColor: stateStyle.borderBottomColor,
    },
    // Best option highlight (Gold Edge)
    (isPossible || isSelected) &&
      isBestOption &&
      !isFilled && {
        borderColor: COLORS.gold,
        borderWidth: 2,
      },
  ];

  // Content Colors
  const iconColor = isFilled
    ? COLORS.text
    : isScratchable
    ? COLORS.coral
    : isSelected
    ? COLORS.cyan
    : isPossible
    ? COLORS.cyan
    : COLORS.textMuted;

  const labelColor = isFilled
    ? COLORS.gold
    : isScratchable
    ? COLORS.coral
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
      style={containerStyle}
      onPress={handlePress}
      disabled={!isPressable}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {/* Top: Icon + Label */}
        <View style={styles.topRow}>
          {isFilled ? (
            <Check size={16} color={COLORS.gold} strokeWidth={4} />
          ) : (
            <CategoryIcon
              categoryId={categoryId}
              size={16}
              strokeWidth={2.5}
              color={iconColor}
            />
          )}
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {/* Bottom: Score / Prediction */}
        <View style={styles.scoreRow}>
          {isFilled ? (
            <Text style={styles.scoreFilled}>{slot.score}</Text>
          ) : isPossible || isSelected ? (
            <Text style={styles.scorePredicted}>+{predictedScore}</Text>
          ) : (
            <Text style={styles.scoreEmpty}>-</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const UpperSection = () => {
  const diceValues = useGameStore((s) => s.diceValues);
  const categories = useGameStore((s) => s.categories);

  // Find which category yields the highest score currently
  const bestOptionId = useMemo(() => {
    let max = -1;
    let bestId: CategoryId | null = null;

    // Only check unfilled categories
    UPPER_CATEGORIES.forEach((id) => {
      if (categories[id].score === null) {
        const score = calculateScore(diceValues, id);
        if (score > max && score > 0) {
          max = score;
          bestId = id;
        }
      }
    });

    // Also check lower categories? Usually "Best" implies global best.
    // Ideally we pass this down or calculate it globally, but for now local best in section is okay?
    // User requirement: "The best scoring option gets a gold edge".
    // We should probably check ALL categories.
    // But since this component only renders Upper, we need to know if an Upper slot is THE best.
    // Let's implement a global best check helper or logic here for now.

    // Actually, let's just highlight the best logic within available options.
    // We can do a quick global check here.
    let globalMax = -1;
    let globalBestId: CategoryId | null = null;

    CATEGORIES.forEach((cat) => {
      if (categories[cat.id].score === null) {
        const score = calculateScore(diceValues, cat.id);
        if (score > globalMax && score > 0) {
          globalMax = score;
          globalBestId = cat.id;
        }
      }
    });

    return globalBestId;
  }, [diceValues, categories]);

  return (
    <View style={styles.container}>
      {UPPER_CATEGORIES.map((id) => (
        <View key={id} style={styles.slotWrapper}>
          <UpperSlot categoryId={id} isBestOption={id === bestOptionId} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.slotGapHorizontal,
    marginBottom: SPACING.slotGapHorizontal, // Space between sections
  },
  slotWrapper: {
    // 6 Columns.
    // width = (100% - 5 * gap) / 6
    width: "15%",
  },
  upperSlot: {
    aspectRatio: 0.85, // Taller for score
    borderRadius: DIMENSIONS.borderRadiusSmall,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  topRow: {
    alignItems: "center",
    gap: 2,
  },
  scoreRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 7, // Small label
    textAlign: "center",
    width: "100%",
    marginTop: 2,
  },
  scoreFilled: {
    ...TYPOGRAPHY.scoreValue,
    color: COLORS.gold,
    fontSize: 14,
  },
  scorePredicted: {
    ...TYPOGRAPHY.scoreValue,
    color: COLORS.text, // White numbers
    fontSize: 12,
    opacity: 0.9,
  },
  scoreEmpty: {
    ...TYPOGRAPHY.scoreValue,
    color: COLORS.textMuted,
    fontSize: 12,
    opacity: 0.3,
  },
});
