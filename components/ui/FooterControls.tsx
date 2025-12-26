import React from "react";
import { View, StyleSheet } from "react-native";
import { Dices, PencilLine } from "lucide-react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import { RollCounter } from "./RollCounter";
import { PrimaryCTAButton } from "./ButtonVariants";

export const FooterControls = () => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const goToShop = useGameStore((s) => s.goToShop);
  const retryRun = useGameStore((s) => s.retryRun);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const submitCategory = useGameStore((s) => s.submitCategory);

  // Determine button state
  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "rolling" &&
    !pendingCategoryId;

  const isConfirming = !!pendingCategoryId;

  const handleGoToShop = () => {
    // Haptics handled by button
    goToShop();
  };

  const handleRetryRun = () => {
    retryRun();
  };

  const handleTriggerRoll = () => {
    if (isConfirming && pendingCategoryId) {
      submitCategory(pendingCategoryId);
      return;
    }
    if (!canRoll) return;
    triggerRoll();
  };

  const renderContent = () => {
    // Different button modes based on phase
    if (phase === "won") {
      return (
        <PrimaryCTAButton
          onPress={handleGoToShop}
          label="SHOP"
          colors={[COLORS.mint, "#00A36C"]}
          style={styles.shopButton}
        />
      );
    }

    if (phase === "lost") {
      return (
        <PrimaryCTAButton
          onPress={handleRetryRun}
          label="NOCHMAL"
          colors={[COLORS.coral, "#C24466"]}
          style={styles.retryButton}
        />
      );
    }

    // Confirmation Button State
    if (isConfirming) {
      return (
        <PrimaryCTAButton
          onPress={handleTriggerRoll}
          label="ANNEHMEN"
          colors={[COLORS.cyan, "#0098B3"]}
          icon={
            <PencilLine size={28} color={COLORS.textDark} strokeWidth={3} />
          }
          style={styles.confirmButton}
        />
      );
    }

    // Main Roll Button
    return (
      <View style={styles.mainControlWrapper}>
        {/* Roll Counter Pill placed above button */}
        <RollCounter remaining={rollsRemaining} />

        <PrimaryCTAButton
          onPress={handleTriggerRoll}
          disabled={!canRoll}
          label={isRolling ? "ROLLING..." : "WURF"}
          colors={[COLORS.cyan, "#0098B3"]}
          icon={
            <Dices
              size={28}
              color={!canRoll ? COLORS.textMuted : COLORS.textDark}
            />
          }
        />
      </View>
    );
  };

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
  },
  shopButton: {
    shadowColor: COLORS.mint,
    shadowOpacity: 0.6,
  },
  retryButton: {
    shadowColor: COLORS.coral,
    shadowOpacity: 0.6,
  },
  confirmButton: {
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.6,
  },
});
