import React from "react";
import { View, StyleSheet } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";

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
              size={DIMENSIONS.iconSize.md}
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
            <GameText variant="bodyMedium" color={COLORS.textMuted}>
              Hands:
            </GameText>
            <GameText variant="displaySmall" color={COLORS.cyan}>
              {handsRemaining}
            </GameText>
          </View>
          <View style={styles.statItem}>
            <GameText variant="bodyMedium" color={COLORS.textMuted}>
              Rolls:
            </GameText>
            <GameText variant="displaySmall" color={COLORS.gold}>
              {rollsRemaining}
            </GameText>
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
                size={DIMENSIONS.iconSize.md}
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
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sectionGap,
    gap: SPACING.sm,
    alignItems: "center",
  },
  mainControlWrapper: {
    width: "100%",
    alignItems: "center",
    gap: SPACING.sm,
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.iconGapMedium,
  },
  button: {
    shadowOpacity: 0.6,
  },
  dualButtonContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    width: "100%",
    justifyContent: "center",
  },
  halfButton: {
    flex: 1,
    maxWidth: 160,
  },
});
