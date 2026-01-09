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
import { Surface, InsetSlot } from "../ui-kit";
import { Sparks } from "../ui-kit/Sparks";
import { useGameStore } from "../../store/gameStore";
import { useShallow } from "zustand/react/shallow";
import { formatNumber } from "../../utils/yahtzeeScoring";
import { formatCompactNumber } from "../../utils/formatting";
import {
  triggerNotificationSuccess,
  triggerLightImpact,
} from "../../utils/haptics";
import { useLayout } from "../../utils/LayoutContext";

interface HUDHeaderProps {
  style?: ViewStyle;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({ style }) => {
  const layout = useLayout();

  // Selectors
  const {
    currentLevelIndex,
    money,
    levelGoal,
    levelScore,
    levelWon,
    isWinAnimating,
    phase,
    pendingUpgradeType,
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
    }))
  );
  const setIsWinAnimating = useGameStore((s) => s.setIsWinAnimating);

  const levelNumber = currentLevelIndex + 1;

  // Money count-up animation state
  const [displayedMoney, setDisplayedMoney] = useState(money);
  const prevMoneyRef = useRef(money);
  const countUpIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Money count-up animation
  const animateMoneyCountUp = useCallback((from: number, to: number) => {
    if (countUpIntervalRef.current) {
      clearInterval(countUpIntervalRef.current);
    }

    const duration = ANIMATION.cashout.countUpDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const diff = to - from;

    triggerLightImpact(); // Start haptic

    let currentStep = 0;
    countUpIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
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

  // Detect money changes and trigger count-up
  useEffect(() => {
    const prevMoney = prevMoneyRef.current;
    prevMoneyRef.current = money;

    // Only animate if money increased (rewards being applied)
    if (money > prevMoney && phase === "SHOP_MAIN") {
      animateMoneyCountUp(prevMoney, money);
    } else if (money !== displayedMoney && phase !== "SHOP_MAIN") {
      // Instant update for other cases (new run, etc.)
      setDisplayedMoney(money);
    }

    return () => {
      if (countUpIntervalRef.current) {
        clearInterval(countUpIntervalRef.current);
      }
    };
  }, [money, phase, animateMoneyCountUp]);

  // Animation values
  const progress = useSharedValue(0);
  const goalScale = useSharedValue(1);
  const goalColorAnim = useSharedValue(0); // 0 = gold, 1 = mint
  const barHeightPulse = useSharedValue(0); // 0 = normal, 1 = +1px
  const shineProgress = useSharedValue(-1); // -1 = off, 0-1 = sweep

  // Track previous score to detect fills
  const prevScore = React.useRef(levelScore);

  useEffect(() => {
    const targetProgress = Math.min(Math.max(levelScore / levelGoal, 0), 1);

    // Normal fill animation
    progress.value = withTiming(targetProgress, {
      duration: isWinAnimating ? 220 : 500, // Faster on win
      easing: Easing.out(Easing.cubic),
    });

    // Detect score increase for pulse
    if (levelScore > prevScore.current) {
      // Pulse height: Up 70ms, Down 120ms
      barHeightPulse.value = withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(0, { duration: 120 })
      );
    }
    prevScore.current = levelScore;
  }, [levelScore, levelGoal]);

  // Win Moment Triggers
  useEffect(() => {
    if (levelWon && isWinAnimating) {
      // Trigger Haptics
      runOnJS(triggerNotificationSuccess)();

      // 1. Goal Number Color & Pop
      goalColorAnim.value = withTiming(1, {
        duration: ANIMATION.duration.winGoalColor,
        easing: Easing.out(Easing.cubic),
      });

      goalScale.value = withSequence(
        withTiming(1.08, { duration: ANIMATION.duration.winGoalPopUp }),
        withTiming(1, { duration: ANIMATION.duration.winGoalPopSettle })
      );

      // 2. Progress Bar Shine (starts after ~120ms)
      shineProgress.value = withDelay(
        120,
        withTiming(1, { duration: 260, easing: Easing.linear }, (finished) => {
          if (finished) {
            runOnJS(setIsWinAnimating)(false); // End interaction lock after shine (plus buffer)
          }
        })
      );
    } else if (!levelWon) {
      // Reset specific values when level resets
      goalColorAnim.value = withTiming(0, { duration: 0 });
      goalScale.value = withTiming(1, { duration: 0 });
    }
  }, [levelWon, isWinAnimating]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barTrackStyle = useAnimatedStyle(() => ({
    height: 2 + barHeightPulse.value, // 2px -> 3px
    marginTop: -barHeightPulse.value, // Grow upward to keep baseline? Or simply grow.
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
    left: `${shineProgress.value * 150 - 50}%`, // Sweep from -50% to 100%
    opacity: shineProgress.value < 0 ? 0 : 0.8,
  }));

  // NEW: Calculate dynamic height based on layout (if needed, or rely on container)
  // But HUDHeader is now a fixed visual block. We'll use Surface variant="panel" same as PlayConsole used to.

  return (
    <Surface variant="panel" padding="none" style={[styles.container, style]}>
      <View style={styles.hudHeader}>
        {/* 2-column header layout */}
        <View style={styles.headerRow}>
          {/* Left Column: Level and Money */}
          <View style={styles.leftColumn}>
            {/* Level */}
            <InsetSlot style={styles.statSlot}>
              <GameText variant="scoreboardSmall" color={COLORS.text}>
                LEVEL {levelNumber}
              </GameText>
            </InsetSlot>

            {/* Money */}
            <InsetSlot style={styles.statSlot}>
              <Image
                source={require("../../assets/icons/coin.png")}
                style={styles.iconSm}
              />
              <GameText variant="scoreboardSmall" color={COLORS.gold}>
                {formatNumber(displayedMoney)}
              </GameText>
            </InsetSlot>
          </View>

          {/* Center Column: Goal */}
          <View style={styles.centerColumn}>
            <InsetSlot padding="none" style={styles.goalSlot}>
              <View style={styles.goalTextContainer}>
                {/* Phase-aware content */}
                {phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE" ? (
                  <GameText variant="displayLarge" color={COLORS.text}>
                    SHOP
                  </GameText>
                ) : phase === "DICE_EDITOR_DIE" ||
                  phase === "DICE_EDITOR_FACE" ? (
                  <View style={styles.diceEditorGoal}>
                    <GameText variant="label" color={COLORS.text}>
                      WÜRFEL VERBESSERN
                    </GameText>
                    <View style={styles.upgradePillContainer}>
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
                        <GameText variant="label" color={COLORS.text}>
                          {pendingUpgradeType === "points"
                            ? "+10 Punkte"
                            : "+1 Mult"}
                        </GameText>
                      </View>
                    </View>
                  </View>
                ) : levelWon ? (
                  <View style={styles.winTextWrapper}>
                    <GameText
                      variant="label"
                      color={COLORS.mint}
                      style={styles.winLabel}
                    >
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
                    <View style={{ height: 10 }} />
                  </View>
                ) : (
                  <>
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
                  </>
                )}
              </View>

              {/* Progress Bar */}
              {phase !== "SHOP_MAIN" &&
                phase !== "SHOP_PICK_UPGRADE" &&
                phase !== "DICE_EDITOR_DIE" &&
                phase !== "DICE_EDITOR_FACE" && (
                  <Animated.View
                    style={[styles.progressBarTrack, barTrackStyle]}
                  >
                    <Animated.View
                      style={[styles.progressBarFill, progressStyle]}
                    >
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
            </InsetSlot>
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
          </View>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Fill allocated height from parent
    overflow: "hidden", // Prevent content overflow
  },
  hudHeader: {
    flex: 1, // Fill container
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs, // Reduced from sm
    gap: SPACING.xs,
  },
  headerRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "stretch",
  },
  leftColumn: {
    flex: 1,
    maxWidth: "30%",
    gap: SPACING.xs,
    alignItems: "stretch",
  },
  centerColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    justifyContent: "center",
  },
  iconSm: {
    width: DIMENSIONS.iconSize.sm,
    height: DIMENSIONS.iconSize.sm,
    resizeMode: "contain",
  },
  goalSlot: {
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 0,
    width: "100%",
    flex: 1,
    overflow: "hidden",
  },
  goalTextContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  winTextWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  diceEditorGoal: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  upgradePillContainer: {
    alignItems: "center",
    marginTop: 2,
  },
  upgradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.overlays.whiteSubtle,
  },
  winLabel: {
    marginBottom: -2,
  },
});
