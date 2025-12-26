import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ScrollText, Check, X } from "lucide-react-native";
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

const LOWER_CATEGORIES = CATEGORIES.filter((c) => c.section === "lower");

interface LowerSlotProps {
  categoryId: CategoryId;
}

const LowerSlot = ({ categoryId }: LowerSlotProps) => {
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
  const hasPendingSelection =
    pendingCategoryId !== null || pendingScratchCategoryId !== null;
  const hasPendingScratch = pendingScratchCategoryId !== null;
  const isScratchable = canScore && scratchMode && !isFilled;

  // Logic from before
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
    // styles.lowerSlot, // Removed

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
      style={styles.lowerSlotWrapper}
      onPress={handlePress}
      disabled={!isPressable}
      selected={isSelected}
      variant={scratchMode ? "scratch" : "default"}
    >
      <View style={[styles.lowerSlotVisuals, ...containerStyle]}>
        <View style={styles.contentContainer}>
          {/* Top: Label + Icon */}
          <View style={styles.topRow}>
            <CategoryIcon categoryId={categoryId} size={14} color={iconColor} />
            <Text
              style={[styles.label, { color: labelColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>

          {/* Middle/Bottom: Score */}
          <View style={styles.scoreRow}>
            {isFilled ? (
              <Text style={styles.scoreFilled}>{slot.score}</Text>
            ) : isPossible || (isSelected && !scratchMode) ? (
              <Text style={styles.scorePredicted}>+{predictedScore}</Text>
            ) : (
              <Text
                style={[styles.scoreEmpty, isScratchable && { opacity: 0.1 }]}
              >
                -
              </Text>
            )}
          </View>

          {/* Badges */}
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

const OverviewButton = () => {
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  return (
    <Tile3DButton
      style={[styles.lowerSlotWrapper]}
      onPress={() => {
        triggerSelectionHaptic();
        toggleOverview();
      }}
    >
      <View
        style={[
          styles.lowerSlotVisuals,
          {
            backgroundColor: COLORS.surface2,
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderStyle: "solid",
            // Bevel
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.15)",
            borderBottomWidth: 3,
            borderBottomColor: "rgba(0,0,0,0.3)",
          },
        ]}
      >
        <View style={[styles.contentContainer, { justifyContent: "center" }]}>
          <ScrollText size={20} color={COLORS.cyan} strokeWidth={2} />
          <Text style={[styles.label, { color: COLORS.cyan, marginTop: 4 }]}>
            PUNKTE
          </Text>
        </View>
      </View>
    </Tile3DButton>
  );
};

const WinButton = () => {
  const forceWin = useGameStore((s) => s.forceWin);

  return (
    <Tile3DButton
      style={styles.lowerSlotWrapper}
      onPress={() => {
        triggerSelectionHaptic();
        forceWin();
      }}
    >
      <View style={[styles.lowerSlotVisuals, styles.winButtonVisuals]}>
        <View style={[styles.contentContainer, { justifyContent: "center" }]}>
          <Check size={20} color={COLORS.textDark} strokeWidth={3} />
          <Text style={[styles.label, styles.winLabel]}>WIN</Text>
        </View>
      </View>
    </Tile3DButton>
  );
};

const ScratchButton = () => {
  const scratchMode = useGameStore((s) => s.scratchMode);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisRound = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const toggleScratchMode = useGameStore((s) => s.toggleScratchMode);
  const canScratch =
    (phase === "rolling" || phase === "scoring") &&
    hasRolledThisRound &&
    !isRolling &&
    !pendingCategoryId &&
    !pendingScratchCategoryId;

  // Visuals for Scratch Button
  // Active: Filled Coral
  // Inactive: Muted default
  const isActive = scratchMode;

  // Visual styles for the inner View
  const visualStyle: any = [
    styles.lowerSlotVisuals,
    !canScratch && { opacity: 0.5 },
  ];

  if (isActive) {
    visualStyle.push({
      backgroundColor: COLORS.coral,
      borderColor: COLORS.coral,
      borderWidth: 0,
      borderBottomWidth: 4,
      borderBottomColor: "rgba(0,0,0,0.2)",
    });
  } else {
    visualStyle.push({
      backgroundColor: COLORS.surface2,
      borderColor: "transparent",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.15)",
      borderBottomWidth: 3,
      borderBottomColor: "rgba(0,0,0,0.3)",
    });
  }

  const iconColor = isActive
    ? COLORS.textWhite
    : canScratch
    ? COLORS.coral
    : COLORS.textMuted;
  const labelColor = isActive
    ? COLORS.textWhite
    : canScratch
    ? COLORS.coral
    : COLORS.textMuted;
  const label = isActive ? "ZURÜCK" : "STREICHEN";

  return (
    <Tile3DButton
      style={styles.lowerSlotWrapper}
      onPress={() => {
        triggerSelectionHaptic();
        toggleScratchMode();
      }}
      disabled={!canScratch}
      variant={isActive ? "scratch" : "default"}
    >
      <View style={visualStyle}>
        <View style={[styles.contentContainer, { justifyContent: "center" }]}>
          <X size={20} color={iconColor} strokeWidth={3} />
          <Text style={[styles.label, { color: labelColor, marginTop: 4 }]}>
            {label}
          </Text>
        </View>
      </View>
    </Tile3DButton>
  );
};

export const LowerSection = () => {
  const scratchMode = useGameStore((s) => s.scratchMode);
  const spacerCount = scratchMode ? 2 : 3;

  return (
    <View style={styles.container}>
      {LOWER_CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.slotWrapper}>
          <LowerSlot categoryId={cat.id} />
        </View>
      ))}

      {/* Spacers to keep 6-column grid aligned */}
      {[...Array(spacerCount)].map((_, i) => (
        <View key={`spacer-${i}`} style={styles.slotWrapper} />
      ))}

      {/* Win + Scratch + Overview buttons at the end */}
      {scratchMode && (
        <View style={styles.slotWrapper}>
          <WinButton />
        </View>
      )}
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
  lowerSlotWrapper: {
    height: 70, // Fixed height for alignment
    width: "100%",
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  lowerSlotVisuals: {
    width: "100%",
    height: "100%",
    padding: 6,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    overflow: "hidden",
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
  winButtonVisuals: {
    backgroundColor: COLORS.mint,
    borderColor: COLORS.mint,
    borderWidth: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.25)",
  },
  winLabel: {
    color: COLORS.textDark,
    marginTop: 4,
  },
});
