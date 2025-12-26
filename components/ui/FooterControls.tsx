import React from "react";
import { View, StyleSheet } from "react-native";
import { CTA3DButton } from "./Button3DVariants";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import { RollCounter } from "./RollCounter";

export const FooterControls = () => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const goToShop = useGameStore((s) => s.goToShop);
  const retryRun = useGameStore((s) => s.retryRun);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const submitCategory = useGameStore((s) => s.submitCategory);
  // const isRoundOver = useGameStore((s) => s.isRoundOver); // Removed if not existing

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

  const handleConfirmCategory = () => {
    if (isConfirming && pendingCategoryId) {
      submitCategory(pendingCategoryId);
      triggerSelectionHaptic();
      return;
    }
  };

  const onPressRoll = () => {
    if (!canRoll) return;
    triggerRoll();
    triggerLightImpact();
  };

  const renderContent = () => {
    // Different button modes based on phase
    if (phase === "won") {
      return (
        <CTA3DButton
          onPress={handleGoToShop}
          label="SHOP"
          colors={[COLORS.mint, "#00A36C"] as const}
          style={styles.shopButton}
        />
      );
    }

    if (phase === "lost") {
      return (
        <CTA3DButton
          onPress={handleRetryRun}
          label="NOCHMAL"
          colors={[COLORS.coral, "#C24466"] as const}
          style={styles.retryButton}
        />
      );
    }

    // Confirmation Button State
    if (isConfirming) {
      return (
        <CTA3DButton
          onPress={handleConfirmCategory}
          label="ANNEHMEN"
          colors={[COLORS.cyan, "#0098B3"]}
          icon={
            <MaterialCommunityIcons
              name="pencil-outline"
              size={24}
              color={COLORS.textDark}
            />
          }
          style={styles.confirmButton}
          // Removed textStyle
        />
      );
    }

    // Main Roll Button
    const rollsLeft = rollsRemaining;
    const label = isRolling ? "ROLLING..." : "WURF";
    const buttonColors = [COLORS.cyan, "#0098B3"] as const;

    return (
      <View style={styles.mainControlWrapper}>
        {/* Roll Counter Pill placed above button */}
        <RollCounter remaining={rollsRemaining} />

        <CTA3DButton
          onPress={onPressRoll}
          label={label}
          subLabel={canRoll ? `ROLL ${rollsLeft}` : undefined}
          disabled={!canRoll} // removed invalid !isRoundOver
          colors={buttonColors}
          icon={
            canRoll ? (
              <MaterialCommunityIcons
                name="dice-multiple"
                size={24}
                color={COLORS.textDark}
              />
            ) : undefined
          }
          // Removed textStyle
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
