import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { PrimaryButton } from "../shared";
import { COLORS, SPACING } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
// import { RollCounter } from "./RollCounter"; // Removed
// import { MAX_HANDS_PER_LEVEL, MAX_ROLLS_PER_HAND } from "../../utils/gameCore";

export const FooterControls = () => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const handsRemaining = useGameStore((s) => s.handsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const acceptHand = useGameStore((s) => s.acceptHand);
  const revealState = useGameStore((s) => s.revealState);
  const cashOutNow = useGameStore((s) => s.cashOutNow);
  const pressOn = useGameStore((s) => s.pressOn);
  const startNewRun = useGameStore((s) => s.startNewRun);

  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "LEVEL_PLAY" &&
    !selectedHandId &&
    !revealState?.active;

  const isHandSelected = !!selectedHandId && !revealState?.active;
  const isRevealing = !!revealState?.active;

  const handleAcceptHand = () => {
    if (isHandSelected) {
      acceptHand();
      triggerSelectionHaptic();
    }
  };

  const handleCashOut = () => {
    cashOutNow();
    triggerSelectionHaptic();
  };

  const handlePressOn = () => {
    pressOn();
    triggerSelectionHaptic();
  };

  const handleNewRun = () => {
    startNewRun();
    triggerSelectionHaptic();
  };

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  const renderContent = () => {
    // Win screen - New Run button
    if (phase === "WIN_SCREEN") {
      return (
        <PrimaryButton
          onPress={handleNewRun}
          label="NEUER RUN"
          variant="mint"
          style={styles.button}
        />
      );
    }

    // Lose screen - New Run button
    if (phase === "LOSE_SCREEN") {
      return (
        <PrimaryButton
          onPress={handleNewRun}
          label="NOCHMAL"
          variant="coral"
          style={styles.button}
        />
      );
    }

    // Cash out choice - Two buttons
    if (phase === "CASHOUT_CHOICE") {
      return (
        <View style={styles.dualButtonContainer}>
          <PrimaryButton
            onPress={handleCashOut}
            label="CASH OUT"
            variant="mint"
            compact
            style={[styles.button, styles.halfButton]}
          />
          <PrimaryButton
            onPress={handlePressOn}
            label="PRESS ON"
            variant="cyan"
            compact
            style={[styles.button, styles.halfButton]}
          />
        </View>
      );
    }

    // Reveal animation in progress - show "..." indicator
    if (isRevealing) {
      return (
        <PrimaryButton
          onPress={() => {}}
          label="..."
          disabled={true}
          variant="cyan"
          style={styles.button}
        />
      );
    }

    // Hand selected - Accept button
    if (isHandSelected) {
      return (
        <PrimaryButton
          onPress={handleAcceptHand}
          label="ANNEHMEN"
          variant="cyan"
          icon={
            <MaterialCommunityIcons
              name="pencil-outline"
              size={24}
              color={COLORS.textDark}
            />
          }
          style={styles.button}
        />
      );
    }

    // Default: Roll button
    const label = isRolling ? "ROLL..." : "WURF";

    return (
      <View style={styles.mainControlWrapper}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Hands:</Text>
            <Text style={[styles.statValue, { color: COLORS.cyan }]}>
              {handsRemaining}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rolls:</Text>
            <Text style={[styles.statValue, { color: COLORS.gold }]}>
              {rollsRemaining}
            </Text>
          </View>
        </View>
        <PrimaryButton
          onPress={onPressRoll}
          label={label}
          disabled={!canRoll}
          variant="cyan"
          icon={
            canRoll ? (
              <MaterialCommunityIcons
                name="dice-multiple"
                size={24}
                color={COLORS.textDark}
              />
            ) : undefined
          }
        />
      </View>
    );
  };

  // Don't show footer in certain phases
  if (
    phase === "LEVEL_RESULT" ||
    phase === "SHOP_MAIN" ||
    phase === "SHOP_PICK_UPGRADE"
  ) {
    return null;
  }

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: SPACING.sectionGap,
    gap: 8,
    alignItems: "center",
  },
  mainControlWrapper: {
    width: "100%",
    alignItems: "center",
    gap: 8, // Add gap between stats and button
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: "Bungee-Regular",
    fontSize: 20,
    color: COLORS.text,
    lineHeight: 24, // Visual adjustment for Bungee
  },
  button: {
    shadowOpacity: 0.6,
  },
  dualButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  halfButton: {
    flex: 1,
    maxWidth: 160,
  },
});
