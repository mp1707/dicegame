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
}

const LowerSlot = ({ categoryId }: LowerSlotProps) => {
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
  const clearPendingCategory = useGameStore((s) => s.clearPendingCategory);

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

  // Logic from before
  const isPossibleBase =
    canScore &&
    !scratchMode &&
    !isFilled &&
    validCategories.includes(categoryId);

  const isPossible = isPossibleBase && !hasPendingSelection;
  const isSelected = pendingCategoryId === categoryId;
  const isPressable =
    isScratchable || (isPossibleBase && (!hasPendingSelection || isSelected));

  // Calculate predicted score if possible
  const predictedScore = useMemo(() => {
    if ((isPossible || isSelected) && !scratchMode) {
      return calculateScore(diceValues, categoryId);
    }
    return 0;
  }, [diceValues, categoryId, isPossible, isSelected, scratchMode]);

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
      triggerSelectionHaptic();
      scratchCategory(categoryId);
    } else if (isPossibleBase) {
      if (isSelected) {
        triggerSelectionHaptic();
        clearPendingCategory();
      } else if (!hasPendingSelection) {
        triggerSelectionHaptic();
        setPendingCategory(categoryId);
      }
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
          <CategoryIcon
            categoryId={categoryId}
            size={16}
            strokeWidth={2.5}
            color={iconColor}
          />
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
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

  // Visuals for Scratch Button
  // Active: Filled Coral
  // Inactive: Muted default
  const isActive = scratchMode;

  const containerStyle: any = [
    styles.lowerSlot,
    !canScratch && { opacity: 0.5 },
  ];

  if (isActive) {
    containerStyle.push({
      backgroundColor: COLORS.coral,
      borderColor: COLORS.coral,
      borderWidth: 0,
      borderTopWidth: 0, // Flat filled ? Or keep bevel?
      // Let's keep a slight bevel for filled button
      borderBottomWidth: 4,
      borderBottomColor: "rgba(0,0,0,0.2)",
    });
  } else {
    containerStyle.push({
      backgroundColor: COLORS.surface2,
      borderColor: "transparent",
      // Bevel
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
  const label = isActive ? "ZURÜCK" : "STREICH";

  return (
    <TouchableOpacity
      style={containerStyle}
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
  return (
    <View style={styles.container}>
      {LOWER_CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.slotWrapper}>
          <LowerSlot categoryId={cat.id} />
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
