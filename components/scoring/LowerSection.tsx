import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { ScrollText, Check, X } from "lucide-react-native";
import { TileButton, TileButtonVariant } from "../shared";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";
import { useGameStore, useValidCategories } from "../../store/gameStore";
import { CategoryId, CATEGORIES } from "../../utils/yahtzeeScoring";
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
  const validCategories = useValidCategories();
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingScratchCategoryId = useGameStore(
    (s) => s.pendingScratchCategoryId
  );
  const clearPendingCategory = useGameStore((s) => s.clearPendingCategory);
  const clearPendingScratchCategory = useGameStore(
    (s) => s.clearPendingScratchCategory
  );

  const categoryDef = CATEGORIES.find((c) => c.id === categoryId);
  let label = categoryDef?.labelDe || categoryId;
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
  const isScratchable = canScore && scratchMode && !isFilled;

  const isPossibleBase =
    canScore &&
    !scratchMode &&
    !isFilled &&
    validCategories.includes(categoryId);

  const isPossible = isPossibleBase;
  const isScoreSelected = pendingCategoryId === categoryId;
  const isScratchSelected = pendingScratchCategoryId === categoryId;
  const isSelected = scratchMode ? isScratchSelected : isScoreSelected;
  const isPressable = isScratchable || isPossibleBase;

  let variant: TileButtonVariant = "default";
  if (isFilled) variant = "filled";
  else if (isScratchable) variant = "scratch";
  else if (isPossible) variant = "active";

  const iconColor = isFilled
    ? COLORS.text
    : isScratchable
    ? COLORS.coral
    : isSelected
    ? COLORS.cyan
    : isPossible
    ? COLORS.cyan
    : COLORS.textMuted;

  const handlePress = () => {
    if (isScratchable) {
      if (isScratchSelected) {
        triggerSelectionHaptic();
        clearPendingScratchCategory();
      } else {
        triggerSelectionHaptic();
        setPendingScratchCategory(categoryId);
      }
    } else if (isPossibleBase) {
      if (isScoreSelected) {
        triggerSelectionHaptic();
        clearPendingCategory();
      } else {
        triggerSelectionHaptic();
        setPendingCategory(categoryId);
      }
    }
  };

  return (
    <TileButton
      icon={
        <CategoryIcon categoryId={categoryId} size={14} color={iconColor} />
      }
      label={label}
      level={1}
      variant={variant}
      selected={isSelected}
      disabled={!isPressable}
      onPress={handlePress}
      style={styles.slotStyle}
    />
  );
};

const OverviewButton = () => {
  const toggleOverview = useGameStore((s) => s.toggleOverview);

  return (
    <Pressable3DBase
      onPress={() => {
        triggerSelectionHaptic();
        toggleOverview();
      }}
      depth={4}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      showLighting={false}
      style={styles.slotStyle}
      face={<View style={styles.actionFace} />}
    >
      <View style={styles.actionContent}>
        <ScrollText size={20} color={COLORS.cyan} strokeWidth={2} />
        <Text style={[styles.actionLabel, { color: COLORS.cyan }]}>PUNKTE</Text>
      </View>
    </Pressable3DBase>
  );
};

const WinButton = () => {
  const forceWin = useGameStore((s) => s.forceWin);

  return (
    <Pressable3DBase
      onPress={() => {
        triggerSelectionHaptic();
        forceWin();
      }}
      depth={4}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      showLighting={false}
      style={styles.slotStyle}
      face={<View style={styles.winFace} />}
    >
      <View style={styles.actionContent}>
        <Check size={20} color={COLORS.textDark} strokeWidth={3} />
        <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>
          WIN
        </Text>
      </View>
    </Pressable3DBase>
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

  const isActive = scratchMode;
  const iconColor = isActive
    ? COLORS.textWhite
    : canScratch
    ? COLORS.coral
    : COLORS.textMuted;
  const labelColor = iconColor;
  const label = isActive ? "ZURÜCK" : "STREICHEN";

  return (
    <Pressable3DBase
      onPress={() => {
        triggerSelectionHaptic();
        toggleScratchMode();
      }}
      disabled={!canScratch}
      depth={4}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      showLighting={false}
      style={[styles.slotStyle, !canScratch && { opacity: 0.5 }]}
      face={
        <View
          style={[styles.actionFace, isActive && styles.scratchActiveFace]}
        />
      }
    >
      <View style={styles.actionContent}>
        <X size={20} color={iconColor} strokeWidth={3} />
        <Text style={[styles.actionLabel, { color: labelColor }]}>{label}</Text>
      </View>
    </Pressable3DBase>
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

      {[...Array(spacerCount)].map((_, i) => (
        <View key={`spacer-${i}`} style={styles.slotWrapper} />
      ))}

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
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    width: "15%",
  },
  slotStyle: {
    height: 70,
    width: "100%",
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  actionBase: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    backgroundColor: COLORS.shadow,
  },
  actionFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface2,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  winFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.mint,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: COLORS.mint,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.25)",
  },
  scratchActiveFace: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.2)",
  },
  actionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 7,
    textAlign: "center",
  },
});
