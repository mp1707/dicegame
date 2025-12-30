import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { DollarSign, Check } from "lucide-react-native";
import { TileButton, TileButtonState, GameText } from "../shared";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";

// Filter lower hands, excluding Chance (becomes consumable elsewhere)
const LOWER_HANDS_DISPLAY = CATEGORIES.filter(
  (c) => c.section === "lower" && c.id !== "chance"
);

interface LowerSlotProps {
  handId: HandId;
}

const LowerSlot = ({ handId }: LowerSlotProps) => {
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
      ? COLORS.gold
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
      icon={<CategoryIcon categoryId={handId} size={14} color={iconColor} />}
      label={label}
      level={handLevel}
      state={tileState}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.slotStyle}
    />
  );
};

const CashOutButton = () => {
  const cashOutNow = useGameStore((s) => s.cashOutNow);

  return (
    <Pressable3DBase
      onPress={() => {
        triggerSelectionHaptic();
        cashOutNow();
      }}
      depth={4}
      borderRadius={DIMENSIONS.borderRadiusSmall}
      showLighting={false}
      style={styles.slotStyle}
      face={<View style={styles.cashOutFace} />}
    >
      <View style={styles.actionContent}>
        <DollarSign size={20} color={COLORS.textDark} strokeWidth={3} />
        <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>
          CASH OUT
        </Text>
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

export const LowerSection = () => {
  const levelWon = useGameStore((s) => s.levelWon);
  const phase = useGameStore((s) => s.phase);

  // Show Cash Out button if level is won and still in LEVEL_PLAY (pressed on)
  const showCashOut = levelWon && phase === "LEVEL_PLAY";

  // Calculate spacer count based on what buttons are shown
  // 6 hand slots (Chance removed) + buttons should fill to ~10 columns
  // Layout: 6 hands = first row, spacers + optional CASH OUT = second row
  let spacerCount = showCashOut ? 4 : 5;

  return (
    <View style={styles.wrapper}>
      <GameText variant="labelSmall" color={COLORS.textMuted} style={styles.header}>
        UNTEN
      </GameText>
      <View style={styles.container}>
        {LOWER_HANDS_DISPLAY.map((cat) => (
          <View key={cat.id} style={styles.slotWrapper}>
            <LowerSlot handId={cat.id} />
          </View>
        ))}

        {/* Spacers */}
        {[...Array(spacerCount)].map((_, i) => (
          <View key={`spacer-${i}`} style={styles.slotWrapper} />
        ))}

        {/* Cash Out button (shown when level is won and pressing on) */}
        {showCashOut && (
          <View style={styles.slotWrapper}>
            <CashOutButton />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
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
    height: 70,
    width: "100%",
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  cashOutFace: {
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
  winFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gold,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.25)",
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
