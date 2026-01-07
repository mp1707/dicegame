import React, { useMemo } from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { SpecialSection } from "./SpecialSection";
import { TileButton, TileButtonState, GameText } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { CategoryIcon } from "../ui/CategoryIcon";
import { useLayout } from "../../utils/LayoutContext";

// Hand configuration with explicit label lines and icons
const UPPER_HANDS: { id: HandId; line1: string; icon: ImageSourcePropType }[] =
  [
    {
      id: "ones",
      line1: "Einser",
      icon: require("../../assets/icons/1die.png"),
    },
    {
      id: "twos",
      line1: "Zweier",
      icon: require("../../assets/icons/2die.png"),
    },
    {
      id: "threes",
      line1: "Dreier",
      icon: require("../../assets/icons/3die.png"),
    },
    {
      id: "fours",
      line1: "Vierer",
      icon: require("../../assets/icons/4die.png"),
    },
    {
      id: "fives",
      line1: "Fünfer",
      icon: require("../../assets/icons/5die.png"),
    },
    {
      id: "sixes",
      line1: "Sechser",
      icon: require("../../assets/icons/6die.png"),
    },
  ];

const LOWER_HANDS: {
  id: HandId;
  line1: string;
  line2: string;
  icon: ImageSourcePropType;
}[] = [
  {
    id: "threeOfKind",
    line1: "Dreier",
    line2: "Pasch",
    icon: require("../../assets/icons/3x.png"),
  },
  {
    id: "fourOfKind",
    line1: "Vierer",
    line2: "Pasch",
    icon: require("../../assets/icons/4x.png"),
  },
  {
    id: "fullHouse",
    line1: "Full",
    line2: "House",
    icon: require("../../assets/icons/fullHouse.png"),
  },
  {
    id: "smallStraight",
    line1: "Kleine",
    line2: "Straße",
    icon: require("../../assets/icons/smStraight.png"),
  },
  {
    id: "largeStraight",
    line1: "Große",
    line2: "Straße",
    icon: require("../../assets/icons/lgStraight.png"),
  },
  {
    id: "yahtzee",
    line1: "Fünfer",
    line2: "Pasch",
    icon: require("../../assets/icons/5x.png"),
  },
];

interface HandSlotProps {
  handId: HandId;
  labelLine1: string;
  labelLine2?: string;
  slotHeight: number;
  iconSource: ImageSourcePropType;
}

// P3.2: Memoize HandSlot to prevent unnecessary re-renders (13 instances)
const HandSlot = React.memo(
  ({
    handId,
    labelLine1,
    labelLine2,
    iconSource,
  }: Omit<HandSlotProps, "slotHeight">) => {
    // P3.2: Batch Zustand selectors to reduce subscription overhead
    const {
      handLevel,
      usedHandsThisLevel,
      selectedHandId,
      phase,
      hasRolledThisHand,
      isRolling,
    } = useGameStore(
      useShallow((s) => ({
        handLevel: s.handLevels[handId],
        usedHandsThisLevel: s.usedHandsThisLevel,
        selectedHandId: s.selectedHandId,
        phase: s.phase,
        hasRolledThisHand: s.hasRolledThisHand,
        isRolling: s.isRolling,
      }))
    );

    // Actions still need separate selectors (stable function references)
    const selectHand = useGameStore((s) => s.selectHand);
    const deselectHand = useGameStore((s) => s.deselectHand);
    const toggleOverview = useGameStore((s) => s.toggleOverview);
    const validHands = useValidHands();

    // Determine states
    const isUsed = usedHandsThisLevel.includes(handId);
    const canInteract =
      phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
    const isValid = canInteract && !isUsed && validHands.includes(handId);
    const isSelected = selectedHandId === handId;

    const getTileState = (): TileButtonState => {
      if (isUsed) return "used";
      if (!canInteract || !isValid) return "invalid";
      if (isSelected) return "selected";
      return "active";
    };

    const tileState = getTileState();

    // Icon color based on state (Only relevant if we fallback to vector icons, but we have images now)
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
        icon={
          <CategoryIcon
            categoryId={handId}
            size={16}
            strokeWidth={2.5}
            color={iconColor}
          />
        }
        iconSource={iconSource}
        labelLine1={labelLine1}
        labelLine2={labelLine2}
        level={handLevel}
        state={tileState}
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={{ flex: 1 }}
      />
    );
  }
);

export const ScoringGrid = () => {
  const layout = useLayout();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <GameText
          variant="labelSmall"
          color={COLORS.textMuted}
          style={styles.header}
        >
          Gegenstände
        </GameText>
        <SpecialSection style={{ flex: 1 }} />
      </View>

      {/* Upper Section */}
      <View style={styles.section}>
        <GameText
          variant="labelSmall"
          color={COLORS.textMuted}
          style={styles.header}
        >
          OBEN
        </GameText>
        <View style={styles.row}>
          {UPPER_HANDS.map((hand) => (
            <View key={hand.id} style={styles.slotWrapper}>
              <HandSlot
                handId={hand.id}
                labelLine1={hand.line1}
                iconSource={hand.icon}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Lower Section */}
      <View style={styles.section}>
        <GameText
          variant="labelSmall"
          color={COLORS.textMuted}
          style={styles.header}
        >
          UNTEN
        </GameText>
        <View style={styles.row}>
          {LOWER_HANDS.map((hand) => (
            <View key={hand.id} style={styles.slotWrapper}>
              <HandSlot
                handId={hand.id}
                labelLine1={hand.line1}
                labelLine2={hand.line2}
                iconSource={hand.icon}
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
    flex: 1,
  },
  header: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.slotGapHorizontal,
    flex: 1,
  },
  slotWrapper: {
    flex: 1,
  },
});
