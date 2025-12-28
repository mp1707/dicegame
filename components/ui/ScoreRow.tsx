import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
  SharedValue,
} from "react-native-reanimated";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import {
  HAND_BASE_CONFIG,
  getBasePoints,
  getContributingDiceIndices,
} from "../../utils/gameCore";
import {
  triggerSelectionHaptic,
  triggerLightImpact,
} from "../../utils/haptics";

export const ScoreRow = () => {
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const handLevels = useGameStore((s) => s.handLevels);
  const revealState = useGameStore((s) => s.revealState);
  const diceValues = useGameStore((s) => s.diceValues);
  const finalizeHand = useGameStore((s) => s.finalizeHand);
  const updateRevealAnimation = useGameStore((s) => s.updateRevealAnimation);

  // Animation values
  const pointsScale = useSharedValue(1);
  const finalScoreScale = useSharedValue(1);
  const totalScoreScale = useSharedValue(1);
  const totalColorProgress = useSharedValue(0); // 0 = gold, 1 = white

  // Track animation in progress
  const animationInProgress = useRef(false);

  // Get hand info
  const handInfo = selectedHandId
    ? CATEGORIES.find((c) => c.id === selectedHandId)
    : null;
  const handName = handInfo?.labelDe ?? "—";

  // Get scoring info
  const handLevel = selectedHandId ? handLevels[selectedHandId] : 1;
  const basePoints = selectedHandId
    ? getBasePoints(selectedHandId, handLevel)
    : 0;
  const mult = selectedHandId ? HAND_BASE_CONFIG[selectedHandId].mult : 1;

  // Snappy timing config - fast attack, quick settle
  const snapTiming = { duration: 100, easing: Easing.out(Easing.cubic) };
  const returnTiming = { duration: 80, easing: Easing.inOut(Easing.quad) };

  // Run reveal animation when revealState becomes active
  useEffect(() => {
    if (
      !revealState?.active ||
      !revealState.breakdown ||
      animationInProgress.current
    ) {
      return;
    }

    animationInProgress.current = true;
    const {
      contributingIndices,
      basePoints: bp,
      finalScore,
    } = revealState.breakdown;
    const currentDiceValues = useGameStore.getState().diceValues;
    const currentLevelScore = useGameStore.getState().levelScore;

    let accumulatedPips = 0;
    let dieIdx = 0;

    const animateNextDie = () => {
      if (dieIdx >= contributingIndices.length) {
        // All dice counted - show hand score (white), clear highlight
        updateRevealAnimation({ animationPhase: "final", currentDieIndex: -1 });

        // Haptic for hand score reveal
        triggerSelectionHaptic();

        // Snappy pop for hand score
        finalScoreScale.value = withSequence(
          withTiming(1.08, {
            duration: 80,
            easing: Easing.out(Easing.back(1.5)),
          }),
          withTiming(1, { duration: 64, easing: Easing.out(Easing.quad) })
        );

        // After 560ms (matching dice tick timing), transition to total score phase
        setTimeout(() => {
          // Update to total phase with new total
          updateRevealAnimation({
            animationPhase: "total",
            displayTotal: currentLevelScore + finalScore,
          });

          // Haptic for total score reveal (slightly stronger)
          triggerLightImpact();

          // Reset color progress for gold start
          totalColorProgress.value = 0;

          // Snappy pop for total score
          totalScoreScale.value = withSequence(
            withTiming(1.08, {
              duration: 80,
              easing: Easing.out(Easing.back(1.5)),
            }),
            withTiming(1, { duration: 64, easing: Easing.out(Easing.quad) })
          );

          // Fade from gold to white over 1 second
          totalColorProgress.value = withDelay(
            200, // Start after the scale pop
            withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
          );

          // Hold for 1.6 seconds total, then finalize
          setTimeout(() => {
            animationInProgress.current = false;
            finalizeHand();
          }, 1600);
        }, 560);
        return;
      }

      const actualDieIndex = contributingIndices[dieIdx];
      const pipValue = currentDiceValues[actualDieIndex];

      // Update accumulated pips
      accumulatedPips += pipValue;

      // Update reveal state
      updateRevealAnimation({
        currentDieIndex: actualDieIndex,
        accumulatedPips,
      });

      // Subtle haptic on each counting tick
      triggerSelectionHaptic();

      // Snappy pop on points update
      pointsScale.value = withSequence(
        withTiming(1.06, snapTiming),
        withTiming(1, returnTiming)
      );

      // Wait then animate next die (20% faster: 700ms -> 560ms)
      setTimeout(() => {
        dieIdx++;
        animateNextDie();
      }, 560);
    };

    // Start animation after short delay (20% faster: 800ms -> 640ms)
    setTimeout(animateNextDie, 640);
  }, [revealState?.active]);

  // Reset animation when reveal ends
  useEffect(() => {
    if (!revealState?.active) {
      pointsScale.value = 1;
      finalScoreScale.value = 1;
      totalScoreScale.value = 1;
      totalColorProgress.value = 0;
      animationInProgress.current = false;
    }
  }, [revealState?.active]);

  // Animated styles
  const pointsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsScale.value }],
  }));

  const finalScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: finalScoreScale.value }],
  }));

  const totalScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScoreScale.value }],
    color: interpolateColor(
      totalColorProgress.value,
      [0, 1],
      [COLORS.gold, COLORS.text]
    ),
  }));

  // Determine contributing indices (from breakdown during reveal, or calculate from selected hand)
  const contributingIndices =
    revealState?.breakdown?.contributingIndices ||
    (selectedHandId
      ? getContributingDiceIndices(selectedHandId, diceValues)
      : []);
  const contributingSet = new Set(contributingIndices);

  // Get level score for display when no hand is selected
  const levelScore = useGameStore((s) => s.levelScore);

  // Determine content components
  const showDiceRow = !!selectedHandId; // Only show dice row if a hand is selected

  // Calculate current score display
  let scoreComponent;

  if (!selectedHandId) {
    // Case: No hand selected -> Show total level score
    scoreComponent = <Text style={styles.standScore}>{levelScore}</Text>;
  } else if (revealState?.active && revealState.animationPhase === "total") {
    // Case: Total phase -> Show total score (gold fading to white)
    scoreComponent = (
      <Animated.Text style={[styles.totalScore, totalScoreAnimatedStyle]}>
        {revealState.displayTotal}
      </Animated.Text>
    );
  } else if (revealState?.active && revealState.animationPhase === "final") {
    // Case: Hand score phase -> Show hand score (white)
    scoreComponent = (
      <Animated.Text style={[styles.handScore, finalScoreAnimatedStyle]}>
        {revealState.breakdown?.finalScore}
      </Animated.Text>
    );
  } else {
    // Case: Hand selected / Reveal in progress -> Show prediction formula
    const currentPoints =
      revealState?.active && revealState.breakdown
        ? revealState.breakdown.basePoints + revealState.accumulatedPips
        : basePoints;

    scoreComponent = (
      <View style={styles.scoreFormula}>
        <Animated.Text style={[styles.pointsText, pointsAnimatedStyle]}>
          {currentPoints}
        </Animated.Text>
        <Text style={styles.multSymbol}> × </Text>
        <Text style={styles.multText}>{mult}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left: Hand name */}
      <View style={styles.leftSection}>
        <Text
          style={[styles.handName, !selectedHandId && styles.placeholder]}
          numberOfLines={1}
        >
          {handName}
        </Text>
        {selectedHandId && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LV {handLevel}</Text>
          </View>
        )}
      </View>

      {/* Right: Score Info */}
      <View style={styles.rightSection}>{scoreComponent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    minHeight: 56,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 120,
  },
  handName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Bungee-Regular",
    letterSpacing: 0.5,
  },
  placeholder: {
    color: COLORS.textMuted,
    opacity: 0.5,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  levelText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontFamily: "Inter-Bold",
    letterSpacing: 0.5,
  },
  // Score formula styles
  scoreFormula: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsText: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
  },
  multSymbol: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontFamily: "Bungee-Regular",
  },
  multText: {
    color: COLORS.cyan,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
  },
  finalScore: {
    color: COLORS.gold,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Hand score (shown after dice counting) - white
  handScore: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
  },
  // Total score (animated gold -> white)
  totalScore: {
    fontSize: 24,
    fontFamily: "Bungee-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  standScore: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "Bungee-Regular",
  },
});
