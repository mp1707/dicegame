import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { ScrollText, DollarSign, Check } from "lucide-react-native";
import { TileButton, TileButtonVariant } from "../shared";
import { Pressable3DBase } from "../ui/Pressable3DBase";
import { COLORS, SPACING, DIMENSIONS, TYPOGRAPHY } from "../../constants/theme";
import { useGameStore, useValidHands, HandId } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { CategoryIcon } from "../ui/CategoryIcon";
import { triggerSelectionHaptic } from "../../utils/haptics";

const LOWER_HANDS = CATEGORIES.filter((c) => c.section === "lower");

interface LowerSlotProps {
  handId: HandId;
}

const LowerSlot = ({ handId }: LowerSlotProps) => {
  const handLevels = useGameStore((s) => s.handLevels);
  const usedHandsThisLevel = useGameStore((s) => s.usedHandsThisLevel);
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const selectHand = useGameStore((s) => s.selectHand);
  const deselectHand = useGameStore((s) => s.deselectHand);
  const phase = useGameStore((s) => s.phase);
  const hasRolledThisHand = useGameStore((s) => s.hasRolledThisHand);
  const isRolling = useGameStore((s) => s.isRolling);
  const validHands = useValidHands();

  const categoryDef = CATEGORIES.find((c) => c.id === handId);
  let label = categoryDef?.labelDe || handId;
  // Shorten long labels
  if (label === "Dreier Pasch") label = "3er P.";
  if (label === "Vierer Pasch") label = "4er P.";
  if (label === "Kleine Straße") label = "Kl.Str";
  if (label === "Große Straße") label = "Gr.Str";
  if (label === "Full House") label = "Full H.";

  const handLevel = handLevels[handId];

  // Determine states
  const isUsed = usedHandsThisLevel.includes(handId);
  const canInteract =
    phase === "LEVEL_PLAY" && hasRolledThisHand && !isRolling;
  const isValid = canInteract && !isUsed && validHands.includes(handId);
  const isSelected = selectedHandId === handId;
  const isPressable = isValid;

  // Determine variant
  let variant: TileButtonVariant = "default";
  if (isUsed) variant = "filled";
  else if (isValid) variant = "active";

  const iconColor = isUsed
    ? COLORS.text
    : isSelected
    ? COLORS.cyan
    : isValid
    ? COLORS.cyan
    : COLORS.textMuted;

  const handlePress = () => {
    if (!isPressable) return;

    if (isSelected) {
      triggerSelectionHaptic();
      deselectHand();
    } else {
      triggerSelectionHaptic();
      selectHand(handId);
    }
  };

  return (
    <TileButton
      icon={
        <CategoryIcon categoryId={handId} size={14} color={iconColor} />
      }
      label={label}
      level={handLevel}
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
  // 7 hand slots + buttons should fill to ~10 columns
  let spacerCount = showCashOut ? 1 : 2;

  return (
    <View style={styles.container}>
      {LOWER_HANDS.map((cat) => (
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

      {/* Overview button */}
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
