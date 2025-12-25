import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, useHasValidCategories } from "../../store/gameStore";

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

interface FooterControlsProps {
  onScratchPress: () => void;
}

export const FooterControls = ({ onScratchPress }: FooterControlsProps) => {
  const rollsRemaining = useGameStore((s) => s.rollsRemaining);
  const isRolling = useGameStore((s) => s.isRolling);
  const triggerRoll = useGameStore((s) => s.triggerRoll);
  const phase = useGameStore((s) => s.phase);
  const hasRolled = useGameStore((s) => s.hasRolledThisRound);
  const hasValidCategories = useHasValidCategories();
  const goToShop = useGameStore((s) => s.goToShop);
  const retryRun = useGameStore((s) => s.retryRun);

  // Determine button state
  const canRoll = rollsRemaining > 0 && !isRolling && phase === "rolling";
  const showScratch = hasRolled && !hasValidCategories && rollsRemaining === 0;

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
      {/* Scratch button (conditional) */}
      {showScratch && (
        <TouchableOpacity
          style={styles.scratchButton}
          onPress={onScratchPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: COLORS.textWhite }]}>
            STREICHEN
          </Text>
        </TouchableOpacity>
      )}

      {/* Main roll button */}
      <TouchableOpacity
        style={[styles.rollButton, !canRoll && styles.rollButtonDisabled]}
        onPress={triggerRoll}
        disabled={!canRoll}
        activeOpacity={0.8}
      >
        <RollPips remaining={rollsRemaining} />
        <Text style={styles.buttonText}>
          {isRolling ? "WÜRFELT..." : "WURF"}
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
    backgroundColor: COLORS.gold,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: COLORS.goldDark,
    borderBottomWidth: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  rollButtonDisabled: {
    opacity: 0.5,
  },
  shopButton: {
    backgroundColor: COLORS.green,
    borderColor: "#166534",
  },
  retryButton: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.redDark,
  },
  scratchButton: {
    height: 40,
    backgroundColor: COLORS.red,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 3,
    borderColor: COLORS.redDark,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.textBlack,
    ...TYPOGRAPHY.mediumScore,
    letterSpacing: 1,
  },
  pipsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pipActive: {
    backgroundColor: COLORS.textBlack,
  },
  pipUsed: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});
