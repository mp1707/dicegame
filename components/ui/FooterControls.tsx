import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { InsetSlot, Surface } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";

// Import icons
const DieIcon = require("../../assets/icons/die.png");
const GloveIcon = require("../../assets/icons/Glove.png");

// Stat Pill Component - Icon + Label + Value as single unified component
interface StatPillProps {
  icon: any;
  label: string;
  value: number;
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, label, value }) => (
  <InsetSlot style={styles.statPill}>
    <Image source={icon} style={styles.statIcon} />
    <GameText variant="body" color={COLORS.text}>
      {label}
    </GameText>
    <GameText variant="body" color={COLORS.text}>
      {value}
    </GameText>
  </InsetSlot>
);

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

  // Render the CTA button based on current state
  const renderCTA = () => {
    // Reveal animation in progress
    if (isRevealing) {
      return (
        <PrimaryButton
          onPress={() => {}}
          label="..."
          disabled={true}
          variant="cyan"
          compact
          style={styles.ctaButton}
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
          compact
          icon={
            <MaterialCommunityIcons
              name="pencil-outline"
              size={DIMENSIONS.iconSize.md}
              color={COLORS.textDark}
            />
          }
          style={styles.ctaButton}
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
        compact
        style={styles.ctaButton}
      />
    );
  };

  // Cash out choice - Two full-width buttons (special case without stats)
  if (phase === "CASHOUT_CHOICE") {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  // Show stats only during gameplay
  const showStats = phase === "LEVEL_PLAY" && !isRevealing;

  return (
    <View style={styles.container}>
      <Surface variant="panel" padding="sm" style={styles.footerStrip}>
        {showStats && (
          <View style={styles.statsContainer}>
            <StatPill
              icon={GloveIcon}
              label="Hände:"
              value={handsRemaining}
              color={COLORS.cyan}
            />
            <StatPill
              icon={DieIcon}
              label="Würfe:"
              value={rollsRemaining}
              color={COLORS.gold}
            />
          </View>
        )}
        {renderCTA()}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sectionGap,
  },
  footerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  statsContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: SPACING.xs,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  statIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  ctaButton: {
    flex: 1,
    shadowOpacity: 0.6,
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
