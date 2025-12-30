import React from "react";
import { View, StyleSheet } from "react-native";
import { TileButton, TileButtonState, GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";

const UPPER_HANDS: HandId[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

interface UpperSlotProps {
  handId: HandId;
}

const UpperSlot = ({ handId }: UpperSlotProps) => {
  const handLevels = useGameStore((s) => s.handLevels);
  const usedHandsThisLevel = useGameStore((s) => s.usedHandsThisLevel);
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const selectHand = useGameStore((s) => s.selectHand);
  const deselectHand = useGameStore((s) => s.deselectHand);
  const toggleOverview = useGameStore((s) => s.toggleOverview);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisHand = useGameStore((s) => s.hasRolledThisHand);
  const isRolling = useGameStore((s) => s.isRolling);
  const validHands = useValidHands();

  const categoryDef = CATEGORIES.find((c) => c.id === handId);
  const label = categoryDef?.labelDe || handId;
  const handLevel = handLevels[handId];

  // Determine states
  const isUsed = usedHandsThisLevel.includes(handId);
  const canInteract = phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
  const isValid = canInteract && !isUsed && validHands.includes(handId);
  const isSelected = selectedHandId === handId;

  // New state mapping
  const getTileState = (): TileButtonState => {
    if (isUsed) return "used";
    if (!canInteract || !isValid) return "invalid";
    if (isSelected) return "selected";
    return "active";
  };

  const tileState = getTileState();

  // Icon color based on state
  const iconColor =
    tileState === "selected"
      ? COLORS.cyan // Only selected is cyan
      : tileState === "active"
      ? COLORS.text // Active/playable is white
      : tileState === "used"
      ? COLORS.goldDark
      : COLORS.tileTextMuted;

  const handlePress = () => {
    if (isSelected) {
      deselectHand();
    } else {
      selectHand(handId);
    }
  };

  const handleLongPress = () => {
    toggleOverview();
  };

  return (
    <TileButton
      icon={
        <CategoryIcon
          categoryId={handId}
          size={16}
          strokeWidth={2.5}
          color={iconColor}
        />
      }
      label={label}
      level={handLevel}
      state={tileState}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.slotStyle}
    />
  );
};

export const UpperSection = () => {
  return (
    <View style={styles.wrapper}>
      <GameText
        variant="labelSmall"
        color={COLORS.textMuted}
        style={styles.header}
      >
        OBEN
      </GameText>
      <View style={styles.container}>
        {UPPER_HANDS.map((id) => (
          <View key={id} style={styles.slotWrapper}>
            <UpperSlot handId={id} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: SPACING.slotGapHorizontal,
  },
  header: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    width: "15%",
  },
  slotStyle: {
    aspectRatio: 0.85,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
});
