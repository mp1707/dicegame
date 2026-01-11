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
import { PixelSurface } from "../ui-kit";
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
 * Combines HUDHeader and ScorePanel into a single compact strip.
 * Uses new Surface variants: strip, elevated, stripInset
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ ┌────────────────────────┐   ┌────────────────────────────┐ │
 * │ │ [LEVEL] [$Money]       │   │       ERREICHE              │ │
 * │ │ [Punkte/Hand   X × Y]  │   │         50                  │ │
 * │ │ [Hände X]  [Würfe Y]   │   │       PUNKTE                │ │
 * │ └────────────────────────┘   └────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────┘
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
  const totalScoreScale = useSharedValue(1);
  const totalColorProgress = useSharedValue(0);
  const animationInProgress = useRef(false);

  const snapTiming = { duration: 100, easing: Easing.out(Easing.cubic) };
  const returnTiming = { duration: 80, easing: Easing.inOut(Easing.quad) };

  // Get hand info
  const handInfo = selectedHandId
    ? CATEGORIES.find((c) => c.id === selectedHandId)
    : null;
  const handName = handInfo?.labelShort ?? "—";
  const handLevel = selectedHandId ? handLevels[selectedHandId] : 1;
  const basePoints = selectedHandId
    ? getBasePoints(selectedHandId, handLevel)
    : 0;
  const baseMult = selectedHandId ? HAND_BASE_CONFIG[selectedHandId].mult : 1;

  // Enhancement bonuses
  const bonusPoints = revealState?.breakdown?.bonusPoints ?? 0;
  const bonusMult = revealState?.breakdown?.bonusMult ?? 0;

  // Score reveal animation (from ScorePanel)
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
                displayTotal: useGameStore.getState().levelScore + finalScore,
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
      totalScoreScale.value = 1;
      totalColorProgress.value = 0;
      animationInProgress.current = false;
    }
  }, [revealState?.active]);

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
      [COLORS.gold, COLORS.mint]
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

  const totalScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScoreScale.value }],
    color: interpolateColor(
      totalColorProgress.value,
      [0, 1],
      [COLORS.gold, COLORS.text]
    ),
  }));

  // Calculate display values
  const currentPoints =
    revealState?.active && revealState.breakdown
      ? revealState.breakdown.basePoints +
        revealState.accumulatedPips +
        bonusPoints
      : basePoints;

  const displayMult = baseMult + bonusMult;
  const displayTotal =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal
      : levelScore;

  // === Render Score Content ===
  const renderScoreContent = () => {
    if (!selectedHandId) {
      // No hand selected - show "Punkte X"
      return (
        <View style={styles.scoreContentRow}>
          <GameText variant="label" color={COLORS.textMuted}>
            Punkte
          </GameText>
          <GameText variant="scoreboardMedium" color={COLORS.text}>
            {levelScore}
          </GameText>
        </View>
      );
    }

    // Hand selected - show formula or animation states
    if (revealState?.active && revealState.animationPhase === "total") {
      return (
        <View style={styles.scoreContentRow}>
          <GameText variant="label" color={COLORS.textMuted}>
            Punkte
          </GameText>
          <Animated.View style={totalScoreAnimatedStyle}>
            <GameText variant="scoreboardMedium" color={COLORS.gold}>
              {displayTotal}
            </GameText>
          </Animated.View>
        </View>
      );
    }

    if (revealState?.active && revealState.animationPhase === "final") {
      return (
        <View style={styles.scoreContentRow}>
          <GameText variant="label" color={COLORS.textMuted}>
            {handName}
          </GameText>
          <Animated.View style={finalScoreAnimatedStyle}>
            <GameText variant="scoreboardMedium" color={COLORS.text}>
              {revealState.breakdown?.finalScore}
            </GameText>
          </Animated.View>
        </View>
      );
    }

    // Show formula: HandName  X × Y
    return (
      <View style={styles.scoreContentRow}>
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
        <View style={styles.formulaContainer}>
          <Animated.View style={pointsAnimatedStyle}>
            <View style={styles.formulaPart}>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                {currentPoints}
              </GameText>
              {bonusPoints > 0 && revealState?.active && (
                <GameText variant="labelSmall" color={COLORS.upgradePoints}>
                  (+{bonusPoints})
                </GameText>
              )}
            </View>
          </Animated.View>
          <GameText variant="label" color={COLORS.textMuted}>
            ×
          </GameText>
          <Animated.View style={multAnimatedStyle}>
            <View style={styles.formulaPart}>
              <GameText
                variant="scoreboardSmall"
                color={bonusMult > 0 ? COLORS.upgradeMult : COLORS.cyan}
              >
                {displayMult}
              </GameText>
              {bonusMult > 0 && revealState?.active && (
                <GameText variant="labelSmall" color={COLORS.upgradeMult}>
                  (+{bonusMult})
                </GameText>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    );
  };

  // === Render Goal Content ===
  const renderGoalContent = () => {
    if (phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE") {
      return (
        <GameText variant="displayLarge" color={COLORS.text}>
          SHOP
        </GameText>
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
          ERREICHE
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
        <GameText variant="labelSmall" color={COLORS.textMuted}>
          PUNKTE
        </GameText>
      </View>
    );
  };

  // Check if we should show the progress bar
  const showProgressBar =
    phase !== "SHOP_MAIN" &&
    phase !== "SHOP_PICK_UPGRADE" &&
    phase !== "DICE_EDITOR_DIE" &&
    phase !== "DICE_EDITOR_FACE";

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Left Panel: Info */}
        <PixelSurface
          tintColor={COLORS.surface2}
          padding="none"
          style={styles.leftPanel}
          contentStyle={styles.leftPanelContent}
        >
          {/* Row 1: Level + Money */}
          <View style={styles.topRow}>
            <PixelSurface
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
            </PixelSurface>
            <PixelSurface
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
            </PixelSurface>
          </View>

          {/* Row 2: Score Display */}
          <PixelSurface
            tintColor={COLORS.surface}
            padding="none"
            style={styles.scoreSlot}
            contentStyle={styles.scoreSlotContent}
          >
            {renderScoreContent()}
          </PixelSurface>
        </PixelSurface>

        {/* Right Panel: Goal */}
        <PixelSurface
          tintColor={COLORS.surface2}
          padding="none"
          style={styles.rightPanel}
          contentStyle={styles.rightPanelContent}
        >
          <PixelSurface
            tintColor={COLORS.surface}
            padding="none"
            style={styles.goalInset}
            contentStyle={styles.goalInsetContent}
          >
            {renderGoalContent()}
          </PixelSurface>

          {/* Progress Bar */}
          {false && (
            <Animated.View style={[styles.progressBarTrack, barTrackStyle]}>
              <Animated.View style={[styles.progressBarFill, progressStyle]}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { width: "40%" },
                    shineStyle,
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "transparent",
                      COLORS.overlays.whiteStrong,
                      "transparent",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

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
        </PixelSurface>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
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
    justifyContent: "space-between",
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
  scoreSlot: {
    flex: 1,
  },
  scoreSlotContent: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  scoreContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  handNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  levelChip: {
    backgroundColor: COLORS.overlays.cyanSubtle,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  formulaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  formulaPart: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  goalInset: {
    flex: 1,
    margin: SPACING.stripInsetGap,
  },
  goalInsetContent: {
    flex: 1,
  },
  goalContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diceEditorGoal: {
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
  progressBarTrack: {
    width: "100%",
    height: 2,
    backgroundColor: COLORS.overlays.blackMild,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.gold,
    overflow: "hidden",
  },
  iconSm: {
    width: DIMENSIONS.iconSize.xs,
    height: DIMENSIONS.iconSize.xs,
    resizeMode: "contain",
  },
});
