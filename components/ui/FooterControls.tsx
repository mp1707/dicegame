import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";

// Roll pips indicator
const RollPips = ({ remaining }: { remaining: number }) => {
  return (
    <View style={styles.pipsContainer}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i < remaining ? styles.pipActive : styles.pipUsed,
          ]}
        />
      ))}
    </View>
  );
};

export const FooterControls = () => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const goToShop = useGameStore((s) => s.goToShop);
  const retryRun = useGameStore((s) => s.retryRun);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);

  // Determine button state
  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "rolling" &&
    !pendingCategoryId;
  const handleGoToShop = () => {
    triggerSelectionHaptic();
    goToShop();
  };

  const handleRetryRun = () => {
    triggerSelectionHaptic();
    retryRun();
  };

  const handleTriggerRoll = () => {
    if (!canRoll) return;
    triggerLightImpact();
    triggerRoll();
  };

  // Different button modes based on phase
  if (phase === "won") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.rollButton, styles.shopButton]}
          onPress={handleGoToShop}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: COLORS.textWhite }]}>
            SHOP
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "lost") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.rollButton, styles.retryButton]}
          onPress={handleRetryRun}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: COLORS.textWhite }]}>
            NOCHMAL
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main roll button */}
      <TouchableOpacity
        style={[
          styles.rollButton,
          !canRoll && styles.rollButtonDisabled,
          // Add glow effect based on state or assume it's always glowing if active can be done with shadow
        ]}
        onPress={handleTriggerRoll}
        disabled={!canRoll}
        activeOpacity={0.8}
      >
        <RollPips remaining={rollsRemaining} />
        <Text style={styles.buttonText}>
          {isRolling ? "ROLLING..." : "WURF"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: SPACING.sectionGap,
    gap: 8,
  },
  rollButton: {
    height: DIMENSIONS.rollButtonHeight,
    // FILLED button - not outline-only (reads as primary action)
    backgroundColor: "#0098B3", // Deep cyan base
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 0, // No border on filled button
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    // Cyan glow
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  rollButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  shopButton: {
    backgroundColor: "#00A36C", // Deep mint/green
    shadowColor: COLORS.green,
  },
  retryButton: {
    backgroundColor: "#C24466", // Deep coral
    shadowColor: COLORS.coral,
  },
  buttonText: {
    color: COLORS.textWhite, // White on filled button
    fontSize: 20,
    fontFamily: "PressStart2P-Regular",
    letterSpacing: 2,
  },
  pipsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5, // Round pips
  },
  pipActive: {
    backgroundColor: COLORS.textWhite,
    shadowColor: COLORS.textWhite,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  pipUsed: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
