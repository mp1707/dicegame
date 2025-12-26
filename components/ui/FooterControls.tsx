import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

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

  // Determine button state
  const canRoll = rollsRemaining > 0 && !isRolling && phase === "rolling";

  // Different button modes based on phase
  if (phase === "won") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.rollButton, styles.shopButton]}
          onPress={goToShop}
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
          onPress={retryRun}
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
        onPress={triggerRoll}
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
    paddingHorizontal: 40,
    paddingVertical: SPACING.sectionGap,
    gap: 8,
  },
  rollButton: {
    height: DIMENSIONS.rollButtonHeight,
    backgroundColor: COLORS.bg2, // Dark fill
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 2,
    borderColor: COLORS.cyan, // Cyan border
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  rollButtonDisabled: {
    opacity: 0.5,
    borderColor: COLORS.border,
    shadowOpacity: 0,
  },
  shopButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.green,
    shadowColor: COLORS.green,
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.red,
    shadowColor: COLORS.red,
  },
  buttonText: {
    color: COLORS.cyan, // Cyan text on dark bg
    fontSize: 20,
    fontFamily: "PressStart2P-Regular",
    letterSpacing: 2,
  },
  pipsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 1, // Pixel square pips
  },
  pipActive: {
    backgroundColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  pipUsed: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
