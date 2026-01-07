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
import { COLORS, SPACING, FONT_FAMILY } from "../../constants/theme";
import { InsetSlot, Chip } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { HAND_BASE_CONFIG, getBasePoints } from "../../utils/gameCore";
import {
  triggerSelectionHaptic,
  triggerLightImpact,
} from "../../utils/haptics";

/**
 * ScoreLip - Integrated score readout strip (not a standalone card)
 *
 * Used inside PlayConsole as the bottom section.
 * Shows: hand name + level, and score/formula in fixed-width display.
 * Now includes enhancement bonuses in the formula display.
 *
 * No outer panel wrapper - that's provided by PlayConsole.
 */
export const ScoreLip = () => {
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const handLevels = useGameStore((s) => s.handLevels);
  const revealState = useGameStore((s) => s.revealState);
  const diceValues = useGameStore((s) => s.diceValues);
  const finalizeHand = useGameStore((s) => s.finalizeHand);
  const updateRevealAnimation = useGameStore((s) => s.updateRevealAnimation);
  const artifactDieUnlocked = useGameStore((s) => s.artifactDieUnlocked);
  const artifactValue = useGameStore((s) => s.artifactValue);

  // Animation values
  const pointsScale = useSharedValue(1);
  const multScale = useSharedValue(1);
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
  const baseMult = selectedHandId ? HAND_BASE_CONFIG[selectedHandId].mult : 1;

  // Get enhancement bonuses from breakdown
  const bonusPoints = revealState?.breakdown?.bonusPoints ?? 0;
  const bonusMult = revealState?.breakdown?.bonusMult ?? 0;
  const artifactMult = revealState?.breakdown?.artifactMult ?? 0;
  const totalBonusMult = bonusMult + artifactMult;

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
    const {
      contributingIndices,
      finalScore,
      bonusMult: totalBonusMult,
    } = revealState.breakdown;
    const currentDiceValues = useGameStore.getState().diceValues;
    const currentLevelScore = useGameStore.getState().levelScore;

    let accumulatedPips = 0;
    let dieIdx = 0;

    const animateNextDie = () => {
      if (dieIdx >= contributingIndices.length) {
        // Points counting phase complete - now show mult bonus if any
        if (totalBonusMult > 0) {
          // Animate mult bonus addition with red pulse
          multScale.value = withSequence(
            withTiming(1.15, {
              duration: 100,
              easing: Easing.out(Easing.back(2)),
            }),
            withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) })
          );
          triggerSelectionHaptic();
        }

        // Short delay then show final score
        setTimeout(
          () => {
            updateRevealAnimation({
              animationPhase: "final",
              currentDieIndex: -1,
            });
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
                withTiming(1, {
                  duration: 800,
                  easing: Easing.out(Easing.quad),
                })
              );

              setTimeout(() => {
                animationInProgress.current = false;
                finalizeHand();
              }, 1600);
            }, 560);
          },
          totalBonusMult > 0 ? 350 : 0
        ); // Extra delay if showing mult bonus
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
      multScale.value = 1;
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

  const multAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multScale.value }],
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

  // Calculate display values during scoring animation
  const currentPoints =
    revealState?.active && revealState.breakdown
      ? revealState.breakdown.basePoints +
        revealState.accumulatedPips +
        bonusPoints
      : basePoints;

  // Total mult includes bonus mult (dice enhancements + artifact)
  const displayMult = baseMult + totalBonusMult;

  // Get display total
  const displayTotal =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal
      : levelScore;

  return (
    <View style={styles.container}>
      {/* Left: Hand Info */}
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

      {/* Right: Score Display (inside InsetSlot for consistent styling) */}
      <InsetSlot style={styles.scoreSlot}>
        {!selectedHandId ? (
          <GameText variant="scoreboardMedium" color={COLORS.text}>
            {levelScore}
          </GameText>
        ) : revealState?.active && revealState.animationPhase === "total" ? (
          <Animated.View style={totalScoreAnimatedStyle}>
            <GameText variant="scoreboardMedium" color={COLORS.gold}>
              {displayTotal}
            </GameText>
          </Animated.View>
        ) : revealState?.active && revealState.animationPhase === "final" ? (
          <Animated.View style={finalScoreAnimatedStyle}>
            <GameText variant="scoreboardMedium" color={COLORS.text}>
              {revealState.breakdown?.finalScore}
            </GameText>
          </Animated.View>
        ) : (
          <View style={styles.scoreFormula}>
            <Animated.View style={pointsAnimatedStyle}>
              <View style={styles.pointsContainer}>
                <GameText variant="scoreboardMedium" color={COLORS.text}>
                  {currentPoints}
                </GameText>
                {bonusPoints > 0 && revealState?.active && (
                  <GameText variant="bodySmall" color={COLORS.upgradePoints}>
                    (+{bonusPoints})
                  </GameText>
                )}
              </View>
            </Animated.View>
            <GameText variant="bodyLarge" color={COLORS.textMuted}>
              {" × "}
            </GameText>
            <Animated.View style={multAnimatedStyle}>
              <View style={styles.multContainer}>
                <GameText
                  variant="scoreboardMedium"
                  color={
                    totalBonusMult > 0
                      ? artifactMult > 0
                        ? COLORS.artifact
                        : COLORS.upgradeMult
                      : COLORS.cyan
                  }
                >
                  {displayMult}
                </GameText>
                {totalBonusMult > 0 && revealState?.active && (
                  <GameText
                    variant="bodySmall"
                    color={
                      artifactMult > 0 ? COLORS.artifact : COLORS.upgradeMult
                    }
                  >
                    (+{totalBonusMult})
                  </GameText>
                )}
              </View>
            </Animated.View>
          </View>
        )}
      </InsetSlot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  scoreSlot: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  scoreFormula: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  multContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
});
