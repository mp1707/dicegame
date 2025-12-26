import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { ScrollText, Check, X } from "lucide-react-native";
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

const LOWER_CATEGORIES = CATEGORIES.filter((c) => c.section === "lower");

interface LowerSlotProps {
  categoryId: CategoryId;
  isBestOption?: boolean;
}

const LowerSlot = ({ categoryId, isBestOption }: LowerSlotProps) => {
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
    styles.lowerSlot,
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

  // Colors
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

const OverviewButton = () => {
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  return (
    <TouchableOpacity
      style={[
        styles.lowerSlot,
        {
          backgroundColor: COLORS.surface2,
          borderColor: "transparent",
          // Bevel
          borderTopWidth: 2,
          borderTopColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 4,
          borderBottomColor: "rgba(0,0,0,0.2)",
        },
      ]}
      onPress={() => {
        triggerSelectionHaptic();
        toggleOverview();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.contentContainer, { justifyContent: "center" }]}>
        <ScrollText size={20} color={COLORS.cyan} strokeWidth={2} />
        <Text style={[styles.label, { color: COLORS.cyan, marginTop: 4 }]}>
          ÜBER
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ScratchButton = () => {
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const toggleScratchMode = useGameStore((s) => s.toggleScratchMode);
  const canScratch =
    (phase === "rolling" || phase === "scoring") &&
    hasRolledThisRound &&
    !isRolling &&
    !pendingCategoryId;
  const iconColor = canScratch ? COLORS.coral : COLORS.textMuted;
  const labelColor = canScratch ? COLORS.coral : COLORS.textMuted;
  const label = canScratch && scratchMode ? "ZURÜCK" : "STREICH";

  return (
    <TouchableOpacity
      style={[
        styles.lowerSlot,
        {
          backgroundColor: COLORS.surface2,
          borderColor: "transparent",
          // Bevel
          borderTopWidth: 2,
          borderTopColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 4,
          borderBottomColor: "rgba(0,0,0,0.2)",
        },
        !canScratch && { opacity: 0.5 },
      ]}
      onPress={() => {
        triggerSelectionHaptic();
        toggleScratchMode();
      }}
      disabled={!canScratch}
      activeOpacity={0.7}
    >
      <View style={[styles.contentContainer, { justifyContent: "center" }]}>
        <X size={20} color={iconColor} strokeWidth={3} />
        <Text style={[styles.label, { color: labelColor, marginTop: 4 }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const LowerSection = () => {
  const diceValues = useGameStore((s) => s.diceValues);
  const categories = useGameStore((s) => s.categories);

  // Find which category yields the highest score currently
  const bestOptionId = useMemo(() => {
    let globalMax = -1;
    let globalBestId: CategoryId | null = null;

    // Check global best for consistency
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

  // Use a simple flex-wrap container instead of calculating rows manually for max flexibility with 4 columns
  // We need 3 empty spacers between Chance (index 0 of last row) and Scratch/Overview (index 4/5).
  // Lower categories: 3kind, 4kind, FH, SmStr, LgStr, Yahtzee (6 items - Row 1)
  // Chance (1 item - Row 2)
  // So Chance is the first item of the second row of THIS section.

  return (
    <View style={styles.container}>
      {LOWER_CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.slotWrapper}>
          <LowerSlot
            categoryId={cat.id}
            isBestOption={cat.id === bestOptionId}
          />
        </View>
      ))}

      {/* 3 Spacers */}
      {[...Array(3)].map((_, i) => (
        <View key={`spacer-${i}`} style={styles.slotWrapper} />
      ))}

      {/* Scratch + Overview buttons at the end */}
      <View style={styles.slotWrapper}>
        <ScratchButton />
      </View>
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
    width: "15%", // 6 columns
  },
  lowerSlot: {
    aspectRatio: 0.85,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
    fontSize: 7,
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
