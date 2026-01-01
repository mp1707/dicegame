import React from "react";
import { View, StyleSheet } from "react-native";
import { SpecialSection } from "./SpecialSection";
import { TileButton, TileButtonState, GameText } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { CategoryIcon } from "../ui/CategoryIcon";
import { useLayout } from "../../utils/LayoutContext";

// Hand configuration with explicit label lines
const UPPER_HANDS: { id: HandId; line1: string }[] = [
  { id: "ones", line1: "Einser" },
  { id: "twos", line1: "Zweier" },
  { id: "threes", line1: "Dreier" },
  { id: "fours", line1: "Vierer" },
  { id: "fives", line1: "Fünfer" },
  { id: "sixes", line1: "Sechser" },
];

const LOWER_HANDS: { id: HandId; line1: string; line2: string }[] = [
  { id: "threeOfKind", line1: "Dreier", line2: "Pasch" },
  { id: "fourOfKind", line1: "Vierer", line2: "Pasch" },
  { id: "fullHouse", line1: "Full", line2: "House" },
  { id: "smallStraight", line1: "Kleine", line2: "Straße" },
  { id: "largeStraight", line1: "Große", line2: "Straße" },
  { id: "yahtzee", line1: "Fünfer", line2: "Pasch" },
];

interface HandSlotProps {
  handId: HandId;
  labelLine1: string;
  labelLine2?: string;
  slotHeight: number;
}

const HandSlot = ({ handId, labelLine1, labelLine2, slotHeight }: HandSlotProps) => {
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

  const handLevel = handLevels[handId];

  // Determine states
  const isUsed = usedHandsThisLevel.includes(handId);
  const canInteract = phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
  const isValid = canInteract && !isUsed && validHands.includes(handId);
  const isSelected = selectedHandId === handId;

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
      ? COLORS.cyan
      : tileState === "active"
      ? COLORS.text
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
      icon={<CategoryIcon categoryId={handId} size={16} strokeWidth={2.5} color={iconColor} />}
      labelLine1={labelLine1}
      labelLine2={labelLine2}
      level={handLevel}
      state={tileState}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{ height: slotHeight }}
    />
  );
};

export const ScoringGrid = () => {
  const layout = useLayout();

  return (
    <View style={styles.container}>
      <SpecialSection />

      {/* Upper Section */}
      <View style={styles.section}>
        <GameText variant="labelSmall" color={COLORS.textMuted} style={styles.header}>
          OBEN
        </GameText>
        <View style={styles.row}>
          {UPPER_HANDS.map((hand) => (
            <View key={hand.id} style={styles.slotWrapper}>
              <HandSlot
                handId={hand.id}
                labelLine1={hand.line1}
                slotHeight={layout.upperSlotHeight}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Lower Section */}
      <View style={styles.section}>
        <GameText variant="labelSmall" color={COLORS.textMuted} style={styles.header}>
          UNTEN
        </GameText>
        <View style={styles.row}>
          {LOWER_HANDS.map((hand) => (
            <View key={hand.id} style={styles.slotWrapper}>
              <HandSlot
                handId={hand.id}
                labelLine1={hand.line1}
                labelLine2={hand.line2}
                slotHeight={layout.lowerSlotHeight}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "flex-start",
    gap: SPACING.md,
  },
  section: {
    width: "100%",
  },
  header: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
  },
  slotWrapper: {
    flex: 1,
  },
});
