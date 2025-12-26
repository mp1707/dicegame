import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Check, X } from "lucide-react-native";
import { Tile3DButton } from "../ui/Button3DVariants";
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
}

const UpperSlot = ({ categoryId }: UpperSlotProps) => {
  const categories = useGameStore((s) => s.categories);
  const setPendingCategory = useGameStore((s) => s.setPendingCategory);
  const setPendingScratchCategory = useGameStore(
    (s) => s.setPendingScratchCategory
  );
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const diceValues = useGameStore((s) => s.diceValues);
  const validCategories = useValidCategories();
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const clearPendingCategory = useGameStore((s) => s.clearPendingCategory);
  const clearPendingScratchCategory = useGameStore(
    (s) => s.clearPendingScratchCategory
  );

  // Get category metadata (label)
  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  const label = categoryDef?.labelDe || categoryId;

  const slot = categories[categoryId];
  const isFilled = slot.score !== null;
  const canScore =
    (phase === "rolling" || phase === "scoring") &&
    hasRolledThisRound &&
    !isRolling;
  const hasPendingSelection =
    pendingCategoryId !== null || pendingScratchCategoryId !== null;
  const hasPendingScratch = pendingScratchCategoryId !== null;
  const isScratchable = canScore && scratchMode && !isFilled;
  // const isPossibleBase = validCategories.includes(categoryId); // Not used logic in scratch mode per se

  // Logic from before:
  const isPossibleBase =
    canScore &&
    !scratchMode &&
    !isFilled &&
    validCategories.includes(categoryId);

  const isPossible = isPossibleBase && !hasPendingSelection;
  const isScoreSelected = pendingCategoryId === categoryId;
  const isScratchSelected = pendingScratchCategoryId === categoryId;
  const isSelected = scratchMode ? isScratchSelected : isScoreSelected;
  const isPressable =
    (isScratchable && (!hasPendingScratch || isScratchSelected)) ||
    (isPossibleBase && (!hasPendingSelection || isScoreSelected));

  // Calculate predicted score if possible
  const predictedScore = useMemo(() => {
    if ((isPossible || isScoreSelected) && !scratchMode) {
      return calculateScore(diceValues, categoryId);
    }
    return 0;
  }, [diceValues, categoryId, isPossible, isScoreSelected, scratchMode]);

  // Determine visual state
  let state: keyof typeof SLOT_STATES = "empty";
  if (isFilled) state = "filled";
  else if (isSelected) state = "selected";
  else if (isScratchable) state = "scratch";
  else if (isPossible) state = "possible";

  const stateStyle = SLOT_STATES[state];

  // Dynamic Styles
  const containerStyle = [
    // styles.upperSlot, // Removed base style from array, applied to child wrapper

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
    // Scratch Selection Override (Coral Glow)
    isSelected &&
      scratchMode && {
        borderColor: COLORS.coral,
        shadowColor: COLORS.coral,
      },
    // Dim ineligible tiles in scratch mode
    scratchMode && !isScratchable && { opacity: 0.4 },
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
      if (isScratchSelected) {
        triggerSelectionHaptic();
        clearPendingScratchCategory();
      } else if (!hasPendingScratch) {
        triggerSelectionHaptic();
        setPendingScratchCategory(categoryId);
      }
    } else if (isPossibleBase) {
      if (isScoreSelected) {
        triggerSelectionHaptic();
        clearPendingCategory();
      } else if (!hasPendingSelection) {
        triggerSelectionHaptic();
        setPendingCategory(categoryId);
      }
    }
  };

  return (
    <Tile3DButton
      style={styles.upperSlotWrapper} // Layout only (width/aspect)
      onPress={handlePress}
      disabled={!isPressable}
      selected={isSelected}
      variant={scratchMode ? "scratch" : "default"}
    >
      <View style={[styles.upperSlotVisuals, ...containerStyle]}>
        <View style={styles.contentContainer}>
          {/* Top: Icon + Label */}
          <View style={styles.topRow}>
            <CategoryIcon
              categoryId={categoryId}
              size={16}
              strokeWidth={2.5}
              color={iconColor}
            />
            <Text
              style={[styles.label, { color: labelColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>

          {/* Bottom: Score / Prediction */}
          <View style={styles.scoreRow}>
            {isFilled ? (
              <Text style={styles.scoreFilled}>{slot.score}</Text>
            ) : isPossible || (isSelected && !scratchMode) ? (
              <Text style={styles.scorePredicted}>+{predictedScore}</Text>
            ) : (
              // Show dash or empty
              <Text
                style={[styles.scoreEmpty, isScratchable && { opacity: 0.1 }]}
              >
                -
              </Text>
            )}
          </View>

          {/* Badges (Absolute Top Right) */}
          {isFilled && (
            <View style={styles.badge}>
              <Check size={10} color={COLORS.bg} strokeWidth={4} />
            </View>
          )}
          {isScratchable && !isSelected && (
            <View style={[styles.badge, styles.badgeScratch]}>
              <X size={10} color={COLORS.bg} strokeWidth={4} />
            </View>
          )}
        </View>
      </View>
    </Tile3DButton>
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {UPPER_CATEGORIES.map((id) => (
          <View key={id} style={styles.slotWrapper}>
            <UpperSlot categoryId={id} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 8,
    marginBottom: SPACING.slotGapHorizontal,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    // 6 Columns.
    // width = (100% - 5 * gap) / 6
    width: "15%",
  },
  upperSlotWrapper: {
    aspectRatio: 0.85,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    // No overflow hidden here if we want depth to show?
    // But defaults usually ok.
  },
  upperSlotVisuals: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    // Ensure background covers the face area
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
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeScratch: {
    backgroundColor: COLORS.coral,
  },
});
