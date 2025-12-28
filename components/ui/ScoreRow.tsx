import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
  SharedValue,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
import { formatCompactNumber } from "../../utils/formatting";

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

  // Calculate delta formula for display during scoring
  const currentPoints =
    revealState?.active && revealState.breakdown
      ? revealState.breakdown.basePoints + revealState.accumulatedPips
      : basePoints;

  // Determine if we should show delta formula
  const showDelta =
    selectedHandId &&
    !(revealState?.active && revealState.animationPhase === "total");

  // Get display total - use animated value during total phase, otherwise current levelScore
  const displayTotal =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal
      : levelScore;

  // ─────────────────────────────────────────────────────────────────────────────
  // Goal Meter Rail (Row 2) - State & Animations
  // ─────────────────────────────────────────────────────────────────────────────
  const levelGoal = useGameStore((s) => s.levelGoal);
  const levelWon = useGameStore((s) => s.levelWon);

  // Track if we've already triggered the goal-reached celebration
  const hasTriggeredGoalCelebration = useRef(false);
  const previousLevelScore = useRef(levelScore);

  // Meter animation values
  const meterProgress = useSharedValue(0); // 0-1 representing fill percentage
  const plaqueScale = useSharedValue(1);
  const plaqueGlow = useSharedValue(0); // 0 = no glow, 1 = full gold glow
  const seamFlash = useSharedValue(0);
  const sweepPosition = useSharedValue(0); // 0-1 for traveling sweep
  const overshootRibbon = useSharedValue(0); // 0-1 for overshoot ribbon width
  const iconColorProgress = useSharedValue(0); // 0 = cyan, 1 = gold
  const ambientSheen = useSharedValue(0); // For idle state sheen animation
  const armedState = useSharedValue(0); // 0 = normal, 1 = gold "armed" state
  const overshootPercent = useSharedValue(0); // Animated percentage display

  // Display state for animated percentage (updated via useAnimatedReaction)
  const [displayPercent, setDisplayPercent] = useState(0);

  // Sync animated percentage to display state
  useAnimatedReaction(
    () => Math.round(overshootPercent.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayPercent)(current);
      }
    },
    [overshootPercent]
  );

  // Calculate progress percentage
  const targetProgress =
    levelGoal > 0 ? Math.min(levelScore / levelGoal, 1) : 0;
  const isOvershoot = levelScore > levelGoal;
  const overshootAmount = isOvershoot
    ? (levelScore - levelGoal) / levelGoal
    : 0;

  // Ambient sheen animation (idle state)
  useEffect(() => {
    const runAmbientSheen = () => {
      ambientSheen.value = 0;
      ambientSheen.value = withDelay(
        8000 + Math.random() * 4000, // 8-12 seconds
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) })
      );
    };

    runAmbientSheen();
    const interval = setInterval(runAmbientSheen, 12000);
    return () => clearInterval(interval);
  }, []);

  // Goal-reaching celebration animation
  useEffect(() => {
    // Check if we just crossed the goal threshold
    const justReachedGoal =
      levelScore >= levelGoal &&
      previousLevelScore.current < levelGoal &&
      levelGoal > 0 &&
      !hasTriggeredGoalCelebration.current;

    if (justReachedGoal) {
      hasTriggeredGoalCelebration.current = true;

      // 1. Plaque punch: 1 → 1.04 → 1 (~220ms)
      plaqueScale.value = withSequence(
        withTiming(1.04, { duration: 110, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) })
      );

      // 2. Gold seam flash
      seamFlash.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 200 })
      );

      // 3. Glow ring bloom (400-600ms)
      plaqueGlow.value = withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) })
      );

      // 4. Traveling sweep (250-350ms)
      sweepPosition.value = 0;
      sweepPosition.value = withDelay(
        50,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
      );

      // 5. Icon turns gold + plaque enters "armed" state
      iconColorProgress.value = withTiming(1, { duration: 300 });
      armedState.value = withTiming(1, { duration: 300 });
    }

    previousLevelScore.current = levelScore;
  }, [levelScore, levelGoal]);

  // Reset celebration tracking when level changes
  useEffect(() => {
    if (!levelWon) {
      hasTriggeredGoalCelebration.current = false;
      iconColorProgress.value = 0;
      overshootRibbon.value = 0;
      overshootPercent.value = 0;
      armedState.value = 0;
    }
  }, [levelWon]);

  // Animation value for percentage scale punch
  const percentScale = useSharedValue(1);

  // Meter progress animation - Balatro-style with punch and precise timing
  useEffect(() => {
    if (revealState?.active && revealState.animationPhase === "total") {
      // During reveal total phase, animate to new progress
      const newProgress =
        levelGoal > 0
          ? Math.min((revealState.displayTotal || levelScore) / levelGoal, 1)
          : 0;

      // BALATRO-STYLE: Cyan bar slams in with overshoot and settle
      // Delay 150ms after Row 1, then fast attack (200ms) with slight overshoot
      meterProgress.value = withDelay(
        150,
        withSequence(
          // Fast slam to target + 3% overshoot
          withTiming(Math.min(newProgress * 1.03, 1), {
            duration: 180,
            easing: Easing.out(Easing.back(1.2)),
          }),
          // Brief hold at peak (creates "weight")
          withDelay(
            40,
            // Settle back to actual value
            withTiming(newProgress, {
              duration: 120,
              easing: Easing.inOut(Easing.quad),
            })
          )
        )
      );

      // Handle gold overshoot bar (staggered: fills after cyan bar settles)
      if ((revealState.displayTotal || 0) > levelGoal) {
        const newOvershoot =
          ((revealState.displayTotal || 0) - levelGoal) / levelGoal;
        const finalPercent = Math.round(newOvershoot * 100);

        // BALATRO-STYLE: Gold bar slams in after cyan (150 + 180 + 40 + 120 = 490ms)
        const goldBarDelay = 490;
        overshootRibbon.value = withDelay(
          goldBarDelay,
          withSequence(
            // Fast slam with overshoot
            withTiming(Math.min(newOvershoot * 1.05, 1), {
              duration: 160,
              easing: Easing.out(Easing.back(1.4)),
            }),
            // Hold then settle
            withDelay(
              30,
              withTiming(Math.min(newOvershoot, 1), {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
              })
            )
          )
        );

        // BALATRO-STYLE: Percentage ticks up with rhythmic scale pulses
        // Start slightly before gold bar for anticipation
        overshootPercent.value = withDelay(
          goldBarDelay - 50,
          withTiming(finalPercent, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
          })
        );

        // Punch scale on percentage when gold bar starts
        percentScale.value = withDelay(
          goldBarDelay,
          withSequence(
            withTiming(1.15, {
              duration: 80,
              easing: Easing.out(Easing.back(2)),
            }),
            withTiming(1, {
              duration: 150,
              easing: Easing.out(Easing.quad),
            })
          )
        );
      }
    } else if (!revealState?.active) {
      // Snap to current progress when not animating (still with subtle punch)
      meterProgress.value = withSequence(
        withTiming(Math.min(targetProgress * 1.02, 1), {
          duration: 200,
          easing: Easing.out(Easing.back(1.1)),
        }),
        withTiming(targetProgress, {
          duration: 100,
          easing: Easing.inOut(Easing.quad),
        })
      );
      if (isOvershoot) {
        const finalPercent = Math.round(overshootAmount * 100);
        // Stagger: wait for cyan to finish (200 + 100 = 300ms)
        overshootRibbon.value = withDelay(
          300,
          withSequence(
            withTiming(Math.min(overshootAmount * 1.04, 1), {
              duration: 180,
              easing: Easing.out(Easing.back(1.3)),
            }),
            withTiming(Math.min(overshootAmount, 1), {
              duration: 100,
              easing: Easing.inOut(Easing.quad),
            })
          )
        );
        // Animate percentage counter in sync with punch
        overshootPercent.value = withDelay(
          280,
          withTiming(finalPercent, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
          })
        );
        percentScale.value = withDelay(
          300,
          withSequence(
            withTiming(1.12, {
              duration: 80,
              easing: Easing.out(Easing.back(2)),
            }),
            withTiming(1, {
              duration: 140,
              easing: Easing.out(Easing.quad),
            })
          )
        );
      }
    }
  }, [
    revealState?.active,
    revealState?.animationPhase,
    revealState?.displayTotal,
    targetProgress,
  ]);

  // Animated style for percentage punch
  const percentScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: percentScale.value }],
  }));

  // Animated styles for Goal Meter
  const meterFillStyle = useAnimatedStyle(() => ({
    width: `${meterProgress.value * 100}%`,
  }));

  const plaqueAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plaqueScale.value }],
  }));

  // Removed shadow glow - plaque is now a flat welded plate
  const plaqueGlowStyle = useAnimatedStyle(() => ({}));

  const seamFlashStyle = useAnimatedStyle(() => ({
    opacity: seamFlash.value,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    left: `${sweepPosition.value * 100}%`,
    opacity: sweepPosition.value > 0 && sweepPosition.value < 1 ? 1 : 0,
  }));

  const overshootRibbonStyle = useAnimatedStyle(() => ({
    width: `${overshootRibbon.value * 100}%`,
    opacity: overshootRibbon.value > 0 ? 1 : 0,
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    left: `${ambientSheen.value * 120 - 20}%`,
    opacity: ambientSheen.value > 0 && ambientSheen.value < 1 ? 0.15 : 0,
  }));

  return (
    <View style={styles.outerContainer}>
      {/* Row 1: Hand Info + TOTAL + Delta */}
      <View style={styles.row1}>
        {/* Left: Hand name or SCORE label */}
        <View style={styles.leftSection}>
          {selectedHandId ? (
            <>
              <Text style={styles.handName} numberOfLines={1}>
                {handName}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>LV {handLevel}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.scoreLabel}>Punkte</Text>
          )}
        </View>

        {/* Right: Score display */}
        <View style={styles.rightSection}>
          {!selectedHandId ? (
            // Idle: Show level score
            <Text style={styles.scoreNumber}>{levelScore}</Text>
          ) : revealState?.active && revealState.animationPhase === "total" ? (
            // Total phase: Show animated total (gold fading to white)
            <Animated.Text
              style={[styles.scoreNumber, totalScoreAnimatedStyle]}
            >
              {displayTotal}
            </Animated.Text>
          ) : revealState?.active && revealState.animationPhase === "final" ? (
            // Final phase: Show hand score
            <Animated.Text style={[styles.handScore, finalScoreAnimatedStyle]}>
              {revealState.breakdown?.finalScore}
            </Animated.Text>
          ) : (
            // Scoring: Show formula (points × mult)
            <View style={styles.scoreFormula}>
              <Animated.Text style={[styles.pointsText, pointsAnimatedStyle]}>
                {currentPoints}
              </Animated.Text>
              <Text style={styles.multSymbol}> × </Text>
              <Text style={styles.multText}>{mult}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Row 2: Goal Meter Rail */}
      <View style={styles.goalMeterContainer}>
        {/* Meter Track */}
        <View style={styles.meterTrack}>
          {/* Track background with inner shadow effect */}
          <View style={styles.meterTrackInner}>
            {/* Cyan meter fill (progress to 100%) */}
            <Animated.View style={[styles.meterFill, meterFillStyle]}>
              <LinearGradient
                colors={[COLORS.cyan + "CC", COLORS.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Leading edge highlight */}
              <View style={styles.meterLeadingEdge} />
            </Animated.View>

            {/* Gold overshoot fill (fills on top of cyan when exceeding goal) */}
            <Animated.View style={[styles.overshootFill, overshootRibbonStyle]}>
              <LinearGradient
                colors={[COLORS.gold + "DD", COLORS.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Leading edge highlight for overshoot */}
              <View style={styles.overshootLeadingEdge} />
            </Animated.View>

            {/* Ambient sheen (idle state) */}
            <Animated.View style={[styles.ambientSheen, sheenStyle]} />

            {/* Traveling sweep (goal celebration) */}
            <Animated.View style={[styles.travelingSweep, sweepStyle]} />
          </View>
        </View>

        {/* Seam line between track and plaque */}
        <View style={styles.seamLine}>
          <Animated.View style={[styles.seamFlash, seamFlashStyle]} />
        </View>

        {/* Goal Endcap Plaque - Silver metal plate */}
        <Animated.View style={[styles.goalPlaque, plaqueGlowStyle]}>
          {/* Plaque content - animate icon+text only */}
          <Animated.View style={[styles.plaqueContent, plaqueAnimatedStyle]}>
            {displayPercent > 0 || overshootAmount >= 0.25 ? (
              // Show animated +XX% with scale punch as gold bar fills
              <Animated.Text
                style={[styles.overshootPercent, percentScaleStyle]}
              >
                +
                {formatCompactNumber(
                  displayPercent || Math.round(overshootAmount * 100)
                )}
                %
              </Animated.Text>
            ) : (
              // Normal: icon left, stacked GOAL label + number right
              <>
                <Image
                  source={require("../../assets/icons/target.png")}
                  style={styles.goalIcon}
                />
                <View style={styles.goalTextStack}>
                  <Text style={styles.goalLabel}>GOAL</Text>
                  <Text style={styles.goalNumber}>
                    {formatCompactNumber(levelGoal)}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>

          {/* Specular highlight */}
          <View style={styles.plaqueHighlight} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ─────────────────────────────────────────────────────────────────────────────
  // Unified Score Rail Container
  // ─────────────────────────────────────────────────────────────────────────────
  outerContainer: {
    backgroundColor: COLORS.surface2, // Match TileButton background
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 8,
    // 3D bevel effect like TileButton
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0, 0, 0, 0.3)",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Row 1: Hand Info + TOTAL + Delta
  // ─────────────────────────────────────────────────────────────────────────────
  row1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 10,
    minHeight: 48,
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
    gap: 12,
  },
  scoreLabel: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
    letterSpacing: 0.5,
  },
  handName: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
    letterSpacing: 0.5,
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
    fontFamily: "M6x11-Regular",
    letterSpacing: 0.5,
  },

  // Delta formula (shown during scoring)
  deltaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(77, 238, 234, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  deltaPlus: {
    color: COLORS.cyan,
    fontSize: 14,
    fontFamily: "M6x11-Regular",
  },
  deltaPoints: {
    color: COLORS.cyan,
    fontSize: 10,
    fontFamily: "M6x11-Regular",
  },
  deltaMult: {
    color: COLORS.cyan,
    fontSize: 14,
    fontFamily: "M6x11-Regular",
    opacity: 0.8,
  },

  // TOTAL display (always visible)
  totalContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  totalLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "M6x11-Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalNumber: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
    fontVariant: ["tabular-nums"],
  },

  // Score number (main display)
  scoreNumber: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
    fontVariant: ["tabular-nums"],
  },

  // Score formula (points × mult)
  scoreFormula: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsText: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
  },
  multSymbol: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontFamily: "M6x11-Regular",
  },
  multText: {
    color: COLORS.cyan,
    fontSize: 24,
    fontFamily: "M6x11-Regular",
  },

  // Legacy (keep for Animated.Text compatibility)
  totalScore: {
    fontSize: 24,
    fontFamily: "M6x11-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Row 2: Goal Meter Rail
  // ─────────────────────────────────────────────────────────────────────────────
  goalMeterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingTop: 0,
    paddingBottom: 10,
    height: 40,
  },
  meterTrack: {
    flex: 1,
    height: 28, // Same height as plaque
    backgroundColor: COLORS.bg, // Darker for recessed slot look
    borderRadius: 8, // Match plaque rounding for unified look
    borderTopRightRadius: 0, // No right rounding (flush with seam)
    borderBottomRightRadius: 0,
    overflow: "hidden",
    // Recessed slot effect - inner shadow via dark border top/bottom
    borderWidth: 1,
    borderTopWidth: 2,
    borderTopColor: "rgba(0, 0, 0, 0.5)", // Dark top for inset look
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)", // Subtle bottom highlight
    borderRightWidth: 0, // Flush with seam
  },
  meterTrackInner: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  meterFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6, // Rounded left edges that complement the plaque
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  meterLeadingEdge: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  // Gold overshoot fill (fills bar when exceeding goal)
  overshootFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6, // Match cyan bar's left rounding
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    // Note: width is set by animation (overshootRibbonStyle)
    overflow: "hidden",
  },
  overshootLeadingEdge: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  ambientSheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  travelingSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  // Seam between bar and plaque - subtle weld groove
  seamLine: {
    width: 1, // Subtle seam for welded effect
    height: 28,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    position: "relative",
    overflow: "visible",
    // Subtle highlight on left side (bar edge)
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.08)",
  },
  seamFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  // Goal Plaque - welded endcap plate at end of progress bar
  goalPlaque: {
    width: 70,
    height: 28,
    backgroundColor: COLORS.surface2,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    // Inset bevel for plate look (not button)
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.25)", // Darker top = recessed
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)", // Lighter bottom = raised edge
    borderLeftWidth: 0, // Flush with seam
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    overflow: "hidden",
  },
  overshootRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.gold,
    borderTopRightRadius: 6,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  plaqueContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 6,
  },
  goalIcon: {
    width: 16, // Smaller to fit stacked layout
    height: 16,
  },
  goalTextStack: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  goalLabel: {
    fontSize: 7,
    fontFamily: "M6x11-Regular",
    color: COLORS.textMuted,
    letterSpacing: 0.3,
    lineHeight: 8,
  },
  // Overshoot percentage text (shown when bar is fully filled)
  overshootPercent: {
    fontSize: 14,
    fontFamily: "M6x11-Regular",
    color: COLORS.gold,
    textShadowColor: "rgba(255, 200, 87, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  goalNumber: {
    fontSize: 14,
    fontFamily: "M6x11-Regular",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
    lineHeight: 14,
    // Shadow for scanline contrast
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  plaqueHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)", // Subtle for theme
    borderTopRightRadius: 6,
  },

  // Legacy styles (unused but kept for backwards compat)
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    minHeight: 56,
  },
  placeholder: {
    color: COLORS.textMuted,
    opacity: 0.5,
  },
  finalScore: {
    color: COLORS.gold,
    fontSize: 14,
    fontFamily: "M6x11-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  handScore: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "M6x11-Regular",
  },
  standScore: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "M6x11-Regular",
  },
  tickContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tick: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
