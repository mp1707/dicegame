import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dices, PencilLine } from "lucide-react-native";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
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
  const submitCategory = useGameStore((s) => s.submitCategory);
  const diceValues = useGameStore((s) => s.diceValues);

  // Calculate score for display in button
  const pendingScore = React.useMemo(() => {
    if (!pendingCategoryId) return 0;
    const { calculateScore } = require("../../utils/yahtzeeScoring");
    return calculateScore(diceValues, pendingCategoryId);
  }, [pendingCategoryId, diceValues]);

  // Determine button state
  const canRoll =
    rollsRemaining > 0 &&
    !isRolling &&
    phase === "rolling" &&
    !pendingCategoryId;

  const isConfirming = !!pendingCategoryId;

  const handleGoToShop = () => {
    triggerSelectionHaptic();
    goToShop();
  };

  const handleRetryRun = () => {
    triggerSelectionHaptic();
    retryRun();
  };

  const handleTriggerRoll = () => {
    if (isConfirming && pendingCategoryId) {
      triggerSelectionHaptic();
      submitCategory(pendingCategoryId);
      return;
    }
    if (!canRoll) return;
    triggerLightImpact();
    triggerRoll();
  };

  // Different button modes based on phase
  if (phase === "won") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleGoToShop}
          activeOpacity={0.9}
          style={styles.fullWidth}
        >
          <LinearGradient
            colors={[COLORS.mint, "#00A36C"]}
            style={[styles.rollButton, styles.shopButton]}
          >
            <View style={styles.overlayHighlight} />
            <Text style={[styles.buttonText, { color: COLORS.textDark }]}>
              SHOP
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "lost") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleRetryRun}
          activeOpacity={0.9}
          style={styles.fullWidth}
        >
          <LinearGradient
            colors={[COLORS.coral, "#C24466"]}
            style={[styles.rollButton, styles.retryButton]}
          >
            <View style={styles.overlayHighlight} />
            <Text style={[styles.buttonText, { color: COLORS.textWhite }]}>
              NOCHMAL
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Confirmation Button State
  if (isConfirming) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleTriggerRoll}
          activeOpacity={0.9}
          style={styles.fullWidth}
        >
          <LinearGradient
            colors={[COLORS.cyan, "#0098B3"]}
            style={[styles.rollButton, styles.confirmButton]}
          >
            <View style={styles.overlayHighlight} />
            <View style={styles.innerContent}>
              <PencilLine size={28} color={COLORS.textDark} strokeWidth={3} />
              <Text style={[styles.buttonText, { color: COLORS.textDark }]}>
                ANNEHMEN
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main roll button */}
      <TouchableOpacity
        onPress={handleTriggerRoll}
        disabled={!canRoll}
        activeOpacity={0.9}
        style={styles.fullWidth}
      >
        <LinearGradient
          colors={
            !canRoll
              ? [COLORS.surface2, COLORS.surface2]
              : [COLORS.cyan, "#0098B3"]
          }
          style={[styles.rollButton, !canRoll && styles.rollButtonDisabled]}
        >
          <View style={styles.overlayHighlight} />

          <View style={styles.innerContent}>
            <Dices
              size={28}
              color={!canRoll ? COLORS.textMuted : COLORS.textDark}
            />

            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.buttonText,
                  !canRoll && { color: COLORS.textMuted },
                ]}
              >
                {isRolling ? "ROLLING..." : "WURF"}
              </Text>
              <RollPips remaining={rollsRemaining} />
            </View>
          </View>
        </LinearGradient>
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
  fullWidth: {
    width: "100%",
  },
  rollButton: {
    height: DIMENSIONS.rollButtonHeight,
    borderRadius: DIMENSIONS.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // Shadow calculated manually for "Toy" feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 1, // Sharp shadow
    elevation: 8,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  rollButtonDisabled: {
    opacity: 0.8,
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  shopButton: {
    shadowColor: COLORS.mint,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  retryButton: {
    shadowColor: COLORS.coral,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  confirmButton: {
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  overlayHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255,255,255,0.15)", // Top bevel highlight
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  textContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  buttonText: {
    color: COLORS.textDark,
    fontSize: 24, // Bigger display size
    fontFamily: "Bungee-Regular",
    lineHeight: 26,
    letterSpacing: 2,
  },
  pipsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipActive: {
    backgroundColor: COLORS.textDark,
  },
  pipUsed: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
  },
});
