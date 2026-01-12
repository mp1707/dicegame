import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  DIMENSIONS,
  TYPOGRAPHY,
  ANIMATION,
} from "../../constants/theme";
import { GameText } from "../shared";
import { Surface } from "../pixel-ui-kit";
import { Sparks } from "../ui-kit/Sparks";
import { useGameStore } from "../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { formatCompactNumber } from "../../utils/formatting";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { HAND_BASE_CONFIG, getBasePoints } from "../../utils/gameCore";
import {
  triggerNotificationSuccess,
  triggerLightImpact,
  triggerSelectionHaptic,
} from "../../utils/haptics";
import { useLayout } from "../../utils/LayoutContext";

interface TopMenuStripProps {
  style?: ViewStyle;
}

/**
 * TopMenuStrip - Balatro-style top status strip
 *
 * Layout (updated per concept sketch):
 * ┌──────────────────────────────────────────────────────────────┐
 * │ ┌────────────────────────┐   ┌────────────────────────────┐ │
 * │ │ [LEVEL] [$Money]       │   │       ZIEL                  │ │
 * │ │ [🧤Hände X] [🎲Würfe Y] │   │         50                  │ │
 * │ │ [Hand Name + Lvl]      │   ├────────────────────────────┤ │
 * │ │ [🔵20] × [🔴3]          │   │       Punkte                │ │
 * │ └────────────────────────┘   │         0                   │ │
 * │                              └────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Animation Flow:
 * 1. Counting phase: Points accumulate in blue Surface with scale animation
 * 2. Final phase: Shows hand's final score centered where formula was
 * 3. Total phase: Punkte section counts up from current to new total
 *                 while Selected Hand Section keeps showing hand's final score
 */
export const TopMenuStrip: React.FC<TopMenuStripProps> = ({ style }) => {
  const layout = useLayout();

  // === Store Selectors ===
  const {
    currentLevelIndex,
    money,
    levelGoal,
    levelScore,
    levelWon,
    isWinAnimating,
    phase,
    pendingUpgradeType,
    selectedHandId,
    handLevels,
    revealState,
    handsRemaining,
    rollsRemaining,
  } = useGameStore(
    useShallow((s) => ({
      currentLevelIndex: s.currentLevelIndex,
      money: s.money,
      levelGoal: s.levelGoal,
      levelScore: s.levelScore,
      levelWon: s.levelWon,
      isWinAnimating: s.isWinAnimating,
      phase: s.phase,
      pendingUpgradeType: s.pendingUpgradeType,
      selectedHandId: s.selectedHandId,
      handLevels: s.handLevels,
      revealState: s.revealState,
      handsRemaining: s.handsRemaining,
      rollsRemaining: s.rollsRemaining,
    }))
  );

  const setIsWinAnimating = useGameStore((s) => s.setIsWinAnimating);
  const finalizeHand = useGameStore((s) => s.finalizeHand);
  const updateRevealAnimation = useGameStore((s) => s.updateRevealAnimation);

  const levelNumber = currentLevelIndex + 1;

  // === Money Count-Up Animation (from HUDHeader) ===
  const [displayedMoney, setDisplayedMoney] = useState(money);
  const prevMoneyRef = useRef(money);
  const countUpIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === Punkte Count-Up Animation ===
  const [displayedPunkte, setDisplayedPunkte] = useState(levelScore);
  const punkteCountUpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const punkteScale = useSharedValue(1);

  const animateMoneyCountUp = useCallback((from: number, to: number) => {
    if (countUpIntervalRef.current) {
      clearInterval(countUpIntervalRef.current);
    }

    const duration = ANIMATION.cashout.countUpDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const diff = to - from;

    triggerLightImpact();

    let currentStep = 0;
    countUpIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayedMoney(Math.round(from + diff * easedProgress));

      if (currentStep >= steps) {
        if (countUpIntervalRef.current) {
          clearInterval(countUpIntervalRef.current);
          countUpIntervalRef.current = null;
        }
        setDisplayedMoney(to);
      }
    }, stepDuration);
  }, []);

  // Punkte count-up animation function
  const animatePunkteCountUp = useCallback(
    (from: number, to: number, onComplete: () => void) => {
      if (punkteCountUpIntervalRef.current) {
        clearInterval(punkteCountUpIntervalRef.current);
      }

      const duration = 800; // Count-up duration
      const steps = 25;
      const stepDuration = duration / steps;
      const diff = to - from;

      triggerLightImpact();

      // Start with a pop animation
      punkteScale.value = withSequence(
        withTiming(1.12, { duration: 100, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) })
      );

      let currentStep = 0;
      punkteCountUpIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        // Ease out cubic for satisfying deceleration
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayedPunkte(Math.round(from + diff * easedProgress));

        // Light haptic on certain steps for tactile feedback
        if (currentStep % 5 === 0) {
          triggerSelectionHaptic();
        }

        if (currentStep >= steps) {
          if (punkteCountUpIntervalRef.current) {
            clearInterval(punkteCountUpIntervalRef.current);
            punkteCountUpIntervalRef.current = null;
          }
          setDisplayedPunkte(to);

          // Final pop
          punkteScale.value = withSequence(
            withTiming(1.08, {
              duration: 80,
              easing: Easing.out(Easing.back(1.5)),
            }),
            withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
          );

          onComplete();
        }
      }, stepDuration);
    },
    []
  );

  useEffect(() => {
    const prevMoney = prevMoneyRef.current;
    prevMoneyRef.current = money;

    if (money > prevMoney && phase === "SHOP_MAIN") {
      animateMoneyCountUp(prevMoney, money);
    } else if (money !== displayedMoney && phase !== "SHOP_MAIN") {
      setDisplayedMoney(money);
    }

    return () => {
      if (countUpIntervalRef.current) {
        clearInterval(countUpIntervalRef.current);
      }
    };
  }, [money, phase, animateMoneyCountUp]);

  // Keep displayedPunkte in sync when not animating
  useEffect(() => {
    if (!revealState?.active) {
      setDisplayedPunkte(levelScore);
    }
  }, [levelScore, revealState?.active]);

  // === Win Animation Values (from HUDHeader) ===
  const progress = useSharedValue(0);
  const goalScale = useSharedValue(1);
  const goalColorAnim = useSharedValue(0);
  const barHeightPulse = useSharedValue(0);
  const shineProgress = useSharedValue(-1);
  const prevScore = useRef(levelScore);

  useEffect(() => {
    const targetProgress = Math.min(Math.max(levelScore / levelGoal, 0), 1);

    progress.value = withTiming(targetProgress, {
      duration: isWinAnimating ? 220 : 500,
      easing: Easing.out(Easing.cubic),
    });

    if (levelScore > prevScore.current) {
      barHeightPulse.value = withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(0, { duration: 120 })
      );
    }
    prevScore.current = levelScore;
  }, [levelScore, levelGoal]);

  useEffect(() => {
    if (levelWon && isWinAnimating) {
      runOnJS(triggerNotificationSuccess)();

      goalColorAnim.value = withTiming(1, {
        duration: ANIMATION.duration.winGoalColor,
        easing: Easing.out(Easing.cubic),
      });

      goalScale.value = withSequence(
        withTiming(1.08, { duration: ANIMATION.duration.winGoalPopUp }),
        withTiming(1, { duration: ANIMATION.duration.winGoalPopSettle })
      );

      shineProgress.value = withDelay(
        120,
        withTiming(1, { duration: 260, easing: Easing.linear }, (finished) => {
          if (finished) {
            runOnJS(setIsWinAnimating)(false);
          }
        })
      );
    } else if (!levelWon) {
      goalColorAnim.value = withTiming(0, { duration: 0 });
      goalScale.value = withTiming(1, { duration: 0 });
    }
  }, [levelWon, isWinAnimating]);

  // === Score Animation Values (from ScorePanel) ===
  const pointsScale = useSharedValue(1);
  const multScale = useSharedValue(1);
  const finalScoreScale = useSharedValue(1);
  const animationInProgress = useRef(false);

  const snapTiming = { duration: 100, easing: Easing.out(Easing.cubic) };
  const returnTiming = { duration: 80, easing: Easing.inOut(Easing.quad) };

  // Get hand info
  const handInfo = selectedHandId
    ? CATEGORIES.find((c) => c.id === selectedHandId)
    : null;
  const handName = handInfo?.labelDe ?? "—";
  const handLevel = selectedHandId ? handLevels[selectedHandId] : 1;
  const basePoints = selectedHandId
    ? getBasePoints(selectedHandId, handLevel)
    : 0;
  const baseMult = selectedHandId ? HAND_BASE_CONFIG[selectedHandId].mult : 1;

  // Enhancement bonuses
  const bonusPoints = revealState?.breakdown?.bonusPoints ?? 0;
  const bonusMult = revealState?.breakdown?.bonusMult ?? 0;

  // Score reveal animation
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

    let accumulatedPips = 0;
    let dieIdx = 0;

    const animateNextDie = () => {
      if (dieIdx >= contributingIndices.length) {
        if (totalBonusMult > 0) {
          multScale.value = withSequence(
            withTiming(1.15, {
              duration: 100,
              easing: Easing.out(Easing.back(2)),
            }),
            withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) })
          );
          triggerSelectionHaptic();
        }

        setTimeout(
          () => {
            // Phase: FINAL - Show hand's final score in Selected Hand Section
            updateRevealAnimation({
              animationPhase: "final",
              currentDieIndex: -1,
            });
            triggerSelectionHaptic();

            finalScoreScale.value = withSequence(
              withTiming(1.12, {
                duration: 100,
                easing: Easing.out(Easing.back(2)),
              }),
              withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) })
            );

            // After showing final score, start the Punkte count-up
            setTimeout(() => {
              // Phase: TOTAL - Count up the Punkte section
              updateRevealAnimation({
                animationPhase: "total",
                displayTotal: useGameStore.getState().levelScore + finalScore,
              });

              const currentScore = useGameStore.getState().levelScore;
              const newTotal = currentScore + finalScore;

              // Animate the Punkte section count-up
              animatePunkteCountUp(currentScore, newTotal, () => {
                // Animation complete, wait a bit then finalize
                setTimeout(() => {
                  animationInProgress.current = false;
                  finalizeHand();
                }, 400);
              });
            }, 560);
          },
          totalBonusMult > 0 ? 350 : 0
        );
        return;
      }

      const actualDieIndex = contributingIndices[dieIdx];
      const currentDiceValues = useGameStore.getState().diceValues;
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

  // Reset score animation
  useEffect(() => {
    if (!revealState?.active) {
      pointsScale.value = 1;
      multScale.value = 1;
      finalScoreScale.value = 1;
      punkteScale.value = 1;
      animationInProgress.current = false;
    }
  }, [revealState?.active]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (punkteCountUpIntervalRef.current) {
        clearInterval(punkteCountUpIntervalRef.current);
      }
    };
  }, []);

  // === Animated Styles ===
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barTrackStyle = useAnimatedStyle(() => ({
    height: 2 + barHeightPulse.value,
    marginTop: -barHeightPulse.value,
  }));

  const goalNumberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goalScale.value }],
    color: interpolateColor(
      goalColorAnim.value,
      [0, 1],
      [COLORS.coral, COLORS.mint]
    ),
  }));

  const shineStyle = useAnimatedStyle(() => ({
    left: `${shineProgress.value * 150 - 50}%`,
    opacity: shineProgress.value < 0 ? 0 : 0.8,
  }));

  const pointsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsScale.value }],
  }));

  const multAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multScale.value }],
  }));

  const finalScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: finalScoreScale.value }],
  }));

  const punkteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: punkteScale.value }],
  }));

  // Calculate display values for the formula
  const currentPoints =
    revealState?.active && revealState.breakdown
      ? revealState.breakdown.basePoints +
        revealState.accumulatedPips +
        bonusPoints
      : basePoints;

  const displayMult = baseMult + bonusMult;

  // Determine what to show in the Selected Hand Section
  const isFinalPhase =
    revealState?.active && revealState.animationPhase === "final";
  const isTotalPhase =
    revealState?.active && revealState.animationPhase === "total";

  const displayPointsValue = isFinalPhase
    ? revealState.breakdown?.finalScore ?? currentPoints
    : currentPoints;

  // === Render Goal Content ===
  const renderGoalContent = () => {
    if (phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE") {
      return (
        <View style={styles.goalContent}>
          <GameText variant="displayLarge" color={COLORS.text}>
            SHOP
          </GameText>
        </View>
      );
    }

    if (phase === "DICE_EDITOR_DIE" || phase === "DICE_EDITOR_FACE") {
      return (
        <View style={styles.diceEditorGoal}>
          <GameText variant="label" color={COLORS.text}>
            WÜRFEL VERBESSERN
          </GameText>
          <View
            style={[
              styles.upgradePill,
              {
                backgroundColor:
                  pendingUpgradeType === "points"
                    ? COLORS.upgradePoints
                    : COLORS.upgradeMult,
              },
            ]}
          >
            <GameText variant="labelSmall" color={COLORS.text}>
              {pendingUpgradeType === "points" ? "+10 Punkte" : "+1 Mult"}
            </GameText>
          </View>
        </View>
      );
    }

    if (levelWon) {
      return (
        <View style={styles.goalContent}>
          <GameText variant="labelSmall" color={COLORS.mint}>
            ZIEL ERREICHT!
          </GameText>
          <Animated.Text
            style={[
              TYPOGRAPHY.displayMedium,
              { fontFamily: "M6x11-Regular" },
              goalNumberStyle,
            ]}
          >
            {formatCompactNumber(levelGoal)}
          </Animated.Text>
        </View>
      );
    }

    return (
      <View style={styles.goalContent}>
        <GameText variant="labelSmall" color={COLORS.textMuted}>
          ZIEL
        </GameText>
        <Animated.Text
          style={[
            TYPOGRAPHY.scoreboardLarge,
            { fontFamily: "M6x11-Regular" },
            goalNumberStyle,
          ]}
        >
          {formatCompactNumber(levelGoal)}
        </Animated.Text>
      </View>
    );
  };

  // === Render Selected Hand Section ===
  const renderSelectedHandSection = () => {
    // No hand selected - show placeholder
    if (!selectedHandId) {
      return (
        <Surface
          tintColor={COLORS.surface}
          padding="xs"
          style={styles.selectedHandSlot}
          contentStyle={styles.selectedHandPlaceholderContent}
        >
          <GameText variant="label" color={COLORS.textMuted}>
            Wähle eine Hand
          </GameText>
        </Surface>
      );
    }

    // During final or total phase - show hand's final score in a Surface
    if (isFinalPhase || isTotalPhase) {
      return (
        <Surface
          tintColor={COLORS.surface}
          padding="xs"
          style={styles.selectedHandSlot}
          contentStyle={styles.selectedHandSlotContent}
        >
          <View style={styles.handNameRow}>
            <GameText variant="label" color={COLORS.text} numberOfLines={1}>
              {handName}
            </GameText>
            <View style={styles.levelChip}>
              <GameText variant="labelSmall" color={COLORS.cyan}>
                LV{handLevel}
              </GameText>
            </View>
          </View>
          {/* Final score in a Surface spanning the same width as blue x red */}
          <View style={styles.formulaSurfaces}>
            <Animated.View style={finalScoreAnimatedStyle}>
              <Surface
                tintColor={COLORS.surface}
                padding="xs"
                style={styles.finalScoreSurface}
                contentStyle={styles.finalScoreSurfaceContent}
              >
                <GameText variant="scoreboardMedium" color={COLORS.text}>
                  {revealState?.breakdown?.finalScore}
                </GameText>
              </Surface>
            </Animated.View>
          </View>
        </Surface>
      );
    }

    // Normal state or during counting - show formula with blue/red Surfaces
    return (
      <Surface
        tintColor={COLORS.surface}
        padding="xs"
        style={styles.selectedHandSlot}
        contentStyle={styles.selectedHandSlotContent}
      >
        <View style={styles.handNameRow}>
          <GameText variant="label" color={COLORS.text} numberOfLines={1}>
            {handName}
          </GameText>
          <View style={styles.levelChip}>
            <GameText variant="labelSmall" color={COLORS.cyan}>
              LV{handLevel}
            </GameText>
          </View>
        </View>
        <View style={styles.formulaSurfaces}>
          <Animated.View style={pointsAnimatedStyle}>
            <Surface
              tintColor={COLORS.upgradePoints}
              padding="xs"
              style={styles.formulaSurface}
              contentStyle={styles.formulaSurfaceContent}
            >
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {displayPointsValue}
              </GameText>
            </Surface>
          </Animated.View>
          <GameText variant="label" color={COLORS.textMuted}>
            x
          </GameText>
          <Animated.View style={multAnimatedStyle}>
            <Surface
              tintColor={COLORS.upgradeMult}
              padding="xs"
              style={styles.formulaSurface}
              contentStyle={styles.formulaSurfaceContent}
            >
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {displayMult}
              </GameText>
            </Surface>
          </Animated.View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Left Panel: Info */}
        <Surface
          tintColor={COLORS.surface2}
          padding="none"
          style={styles.leftPanel}
          contentStyle={styles.leftPanelContent}
        >
          {/* Row 1: Level + Money */}
          <View style={styles.topRow}>
            <Surface
              tintColor={COLORS.surface}
              padding="lg"
              style={styles.labelValueSlot}
              contentStyle={styles.labelValueSlotContent}
            >
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                LEVEL
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {levelNumber}
              </GameText>
            </Surface>
            <Surface
              tintColor={COLORS.surface}
              padding="none"
              style={styles.moneySlot}
              contentStyle={styles.moneySlotContent}
            >
              <Image
                source={require("../../assets/icons/coin.png")}
                style={styles.iconSm}
              />
              <GameText variant="scoreboardSmall" color={COLORS.gold}>
                {formatNumber(displayedMoney)}
              </GameText>
            </Surface>
          </View>

          {/* Row 2: Hände + Würfe (always visible in all phases) */}
          <View style={styles.statsRow}>
            <Surface
              tintColor={COLORS.surface}
              padding="xs"
              style={styles.statSlot}
              contentStyle={styles.statSlotContent}
            >
              <Image
                source={require("../../assets/icons/Glove.png")}
                style={styles.iconSm}
              />
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                Hände
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {handsRemaining}
              </GameText>
            </Surface>
            <Surface
              tintColor={COLORS.surface}
              padding="xs"
              style={styles.statSlot}
              contentStyle={styles.statSlotContent}
            >
              <Image
                source={require("../../assets/icons/die.png")}
                style={styles.iconSm}
              />
              <GameText variant="labelSmall" color={COLORS.textMuted}>
                Würfe
              </GameText>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {rollsRemaining}
              </GameText>
            </Surface>
          </View>

          {/* Row 3: Selected Hand Section (always visible, handles counting animation) */}
          {renderSelectedHandSection()}
        </Surface>

        {/* Right Panel: Goal + Punkte */}
        <Surface
          tintColor={COLORS.surface2}
          padding="none"
          style={styles.rightPanel}
          contentStyle={styles.rightPanelContent}
        >
          {/* Goal Section */}
          <Surface
            tintColor={COLORS.surface}
            padding="none"
            style={styles.goalInset}
            contentStyle={styles.goalInsetContent}
          >
            {renderGoalContent()}
          </Surface>

          {/* Punkte Section (always visible, with count-up animation) */}
          <Surface
            tintColor={COLORS.surface}
            padding="none"
            style={styles.punkteInset}
            contentStyle={styles.punkteContent}
          >
            <GameText variant="labelSmall" color={COLORS.textMuted}>
              Punkte
            </GameText>
            <Animated.View style={punkteAnimatedStyle}>
              <GameText variant="scoreboardMedium" color={COLORS.text}>
                {displayedPunkte}
              </GameText>
            </Animated.View>
          </Surface>

          {/* Win Sparks */}
          {isWinAnimating && (
            <Sparks
              count={12}
              style={{
                position: "absolute",
                bottom: -10,
                alignSelf: "center",
                zIndex: 10,
              }}
            />
          )}
        </Surface>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: SPACING.stripPaddingH,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: SPACING.stripPaddingV,
    paddingHorizontal: SPACING.stripPaddingH,
    gap: SPACING.stripElevatedGap,
  },
  leftPanel: {
    flex: 1,
  },
  leftPanelContent: {
    flex: 1,
    gap: SPACING.stripInsetGap,
    padding: SPACING.stripInsetGap,
  },
  rightPanel: {
    width: "35%",
    overflow: "hidden",
  },
  rightPanelContent: {
    flex: 1,
    gap: SPACING.stripInsetGap,
    padding: SPACING.stripInsetGap,
  },
  topRow: {
    flexDirection: "row",
    gap: SPACING.stripInsetGap,
  },
  labelValueSlot: {
    flex: 1,
  },
  labelValueSlotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  moneySlot: {
    flex: 1,
  },
  moneySlotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.stripInsetGap,
  },
  statSlot: {
    flex: 1,
  },
  statSlotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  selectedHandSlot: {
    flex: 1,
  },
  selectedHandSlotContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  selectedHandPlaceholderContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  handNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  levelChip: {
    backgroundColor: COLORS.overlays.cyanSubtle,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  formulaSurfaces: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  formulaSurface: {
    minWidth: 40,
  },
  formulaSurfaceContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  finalScoreSurface: {
    // Width to match blue + x + red (approximately 40 + gap + text + gap + 40)
    minWidth: 100,
  },
  finalScoreSurfaceContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.md,
  },
  goalInset: {
    flex: 1,
  },
  goalInsetContent: {
    flex: 1,
  },
  goalContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  punkteInset: {
    flex: 1,
  },
  punkteContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diceEditorGoal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  upgradePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    borderWidth: 1,
    borderColor: COLORS.overlays.whiteSubtle,
  },
  iconSm: {
    width: DIMENSIONS.iconSize.xs,
    height: DIMENSIONS.iconSize.xs,
    resizeMode: "contain",
  },
});
