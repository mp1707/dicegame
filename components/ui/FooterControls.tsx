import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { PrimaryButton, GameText } from "../shared";
import { InsetSlot, Surface } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
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
    <GameText variant="body" color={COLORS.textMuted}>
      {label}
    </GameText>
    <GameText variant="body" color={COLORS.textMuted}>
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
  const openShop = useGameStore((s) => s.openShop);
  const levelWon = useGameStore((s) => s.levelWon);

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

  const handleOpenShop = () => {
    openShop();
    triggerSelectionHaptic();
  };

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  // Render the CTA button based on current state
  const renderCTA = () => {
    // LEVEL_RESULT phase - show SHOP button
    if (phase === "LEVEL_RESULT") {
      return (
        <PrimaryButton
          onPress={handleOpenShop}
          label="SHOP"
          variant="mint"
          compact
          style={styles.ctaButton}
        />
      );
    }

    // Level won - show CASH OUT button
    if (levelWon && phase === "LEVEL_PLAY" && !isRevealing) {
      return (
        <PrimaryButton
          onPress={handleCashOut}
          label="CASH OUT"
          variant="mint"
          compact
          style={styles.ctaButton}
        />
      );
    }

    // Reveal animation in progress
    if (isRevealing) {
      return (
        <PrimaryButton
          onPress={() => {}}
          label="Zähle..."
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
          label="Annehmen"
          variant="cyan"
          compact
          style={styles.ctaButton}
        />
      );
    }

    // Default: Roll button
    const label = isRolling ? "Würfeln..." : "Würfeln";

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

  // Render the CTA area
  const renderCTAArea = () => {
    return <View style={styles.ctaArea}>{renderCTA()}</View>;
  };

  return (
    <View style={styles.container}>
      <Surface variant="panel" padding="sm" style={styles.footerStrip}>
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
        {renderCTAArea()}
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
  ctaArea: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },
});
