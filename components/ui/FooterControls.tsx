import React from "react";
import { View, StyleSheet } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { InsetSlot } from "../ui-kit";
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

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  const renderContent = () => {
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

    // Reveal animation in progress
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
    );
  };

  // Show stats only during gameplay
  const showStats = phase === "LEVEL_PLAY" && !isRevealing;

  return (
    <View style={styles.container}>
      {showStats && (
        <View style={styles.statsRow}>
          {/* Hands remaining */}
          <View style={styles.resourceBar}>
            <GameText variant="labelSmall" color={COLORS.textMuted}>
              HANDS
            </GameText>
            <InsetSlot style={styles.resourceSlot}>
              <GameText variant="scoreboardMedium" color={COLORS.cyan}>
                {handsRemaining}
              </GameText>
            </InsetSlot>
          </View>

          {/* Rolls remaining */}
          <View style={styles.resourceBar}>
            <GameText variant="labelSmall" color={COLORS.textMuted}>
              ROLLS
            </GameText>
            <InsetSlot style={styles.resourceSlot}>
              <GameText variant="scoreboardMedium" color={COLORS.gold}>
                {rollsRemaining}
              </GameText>
            </InsetSlot>
          </View>
        </View>
      )}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sectionGap,
    gap: SPACING.md,
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: SPACING.lg,
    alignSelf: "flex-start",
  },
  resourceBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  resourceSlot: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
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
