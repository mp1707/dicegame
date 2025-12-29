import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { COLORS, SPACING } from "../../constants/theme";
import { Surface, Chip, InsetSlot } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { HAND_BASE_CONFIG, getBasePoints } from "../../utils/gameCore";
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
  const totalColorProgress = useSharedValue(0);

  // Track animation in progress
  const animationInProgress = useRef(false);

  // Get hand info
  const handInfo = selectedHandId
    ? CATEGORIES.find((c) => c.id === selectedHandId)
    : null;
  const handName = handInfo?.labelShort ?? "—";

  // Get scoring info
  const handLevel = selectedHandId ? handLevels[selectedHandId] : 1;
  const basePoints = selectedHandId
    ? getBasePoints(selectedHandId, handLevel)
    : 0;
  const mult = selectedHandId ? HAND_BASE_CONFIG[selectedHandId].mult : 1;

  // Snappy timing config
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
    const { contributingIndices, finalScore } = revealState.breakdown;
    const currentDiceValues = useGameStore.getState().diceValues;
    const currentLevelScore = useGameStore.getState().levelScore;

    let accumulatedPips = 0;
    let dieIdx = 0;

    const animateNextDie = () => {
      if (dieIdx >= contributingIndices.length) {
        updateRevealAnimation({ animationPhase: "final", currentDieIndex: -1 });
        triggerSelectionHaptic();

        finalScoreScale.value = withSequence(
          withTiming(1.08, {
            duration: 80,
            easing: Easing.out(Easing.back(1.5)),
          }),
          withTiming(1, { duration: 64, easing: Easing.out(Easing.quad) })
        );

        setTimeout(() => {
          updateRevealAnimation({
            animationPhase: "total",
            displayTotal: currentLevelScore + finalScore,
          });
          triggerLightImpact();
          totalColorProgress.value = 0;

          totalScoreScale.value = withSequence(
            withTiming(1.08, {
              duration: 80,
              easing: Easing.out(Easing.back(1.5)),
            }),
            withTiming(1, { duration: 64, easing: Easing.out(Easing.quad) })
          );

          totalColorProgress.value = withDelay(
            200,
            withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
          );

          setTimeout(() => {
            animationInProgress.current = false;
            finalizeHand();
          }, 1600);
        }, 560);
        return;
      }

      const actualDieIndex = contributingIndices[dieIdx];
      const pipValue = currentDiceValues[actualDieIndex];
      accumulatedPips += pipValue;

      updateRevealAnimation({
        currentDieIndex: actualDieIndex,
        accumulatedPips,
      });
      triggerSelectionHaptic();

      pointsScale.value = withSequence(
        withTiming(1.06, snapTiming),
        withTiming(1, returnTiming)
      );

      setTimeout(() => {
        dieIdx++;
        animateNextDie();
      }, 560);
    };

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

  // Get level score for display
  const levelScore = useGameStore((s) => s.levelScore);

  // Calculate delta formula for display during scoring
  const currentPoints =
    revealState?.active && revealState.breakdown
      ? revealState.breakdown.basePoints + revealState.accumulatedPips
      : basePoints;

  // Get display total
  const displayTotal =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal
      : levelScore;

  return (
    <Surface variant="panel" padding="none" style={styles.outerContainer}>
      {/* Row 1: Hand Info + Score */}
      <View style={styles.row1}>
        <View style={styles.leftSection}>
          {selectedHandId ? (
            <>
              <GameText
                variant="displaySmall"
                color={COLORS.text}
                numberOfLines={1}
              >
                {handName}
              </GameText>
              <Chip label={`LV ${handLevel}`} color="cyan" size="sm" />
            </>
          ) : (
            <GameText variant="displaySmall" color={COLORS.text}>
              Punkte
            </GameText>
          )}
        </View>

        <InsetSlot style={styles.scoreSlot}>
          {!selectedHandId ? (
            <GameText variant="scoreboardMedium" color={COLORS.text}>
              {levelScore}
            </GameText>
          ) : revealState?.active && revealState.animationPhase === "total" ? (
            <Animated.Text
              style={[styles.scoreNumber, totalScoreAnimatedStyle]}
            >
              {displayTotal}
            </Animated.Text>
          ) : revealState?.active && revealState.animationPhase === "final" ? (
            <Animated.Text style={[styles.handScore, finalScoreAnimatedStyle]}>
              {revealState.breakdown?.finalScore}
            </Animated.Text>
          ) : (
            <View style={styles.scoreFormula}>
              <Animated.Text style={[styles.pointsText, pointsAnimatedStyle]}>
                {currentPoints}
              </Animated.Text>
              <GameText variant="bodyLarge" color={COLORS.textMuted}>
                {" × "}
              </GameText>
              <GameText variant="scoreboardMedium" color={COLORS.cyan}>
                {mult}
              </GameText>
            </View>
          )}
        </InsetSlot>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    overflow: "hidden",
  },

  // Row 1: Hand Info + Score
  row1: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 10,
    minHeight: 48,
    gap: SPACING.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 2,
  },
  scoreSlot: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },

  // Score display styles
  scoreNumber: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: "M6x11-Regular",
    fontVariant: ["tabular-nums"],
  },
  scoreFormula: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsText: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: "M6x11-Regular",
    fontVariant: ["tabular-nums"],
  },
  handScore: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: "M6x11-Regular",
    fontVariant: ["tabular-nums"],
  },
});
