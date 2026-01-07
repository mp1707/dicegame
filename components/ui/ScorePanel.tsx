import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { InsetSlot, Chip } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { HAND_BASE_CONFIG, getBasePoints } from "../../utils/gameCore";
import {
  triggerSelectionHaptic,
  triggerLightImpact,
} from "../../utils/haptics";
import { getShopItemById } from "../../items";

// Maximum number of item slots
const MAX_ITEM_SLOTS = 5;

// Icon mapping for items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
};

/**
 * ScorePanel - Integrated score and items display
 *
 * Used inside PlayConsole as the bottom section.
 * Row 1: Hand name + level, and score/formula in fixed-width display.
 * Row 2: "Gegenstände" label + 5 item slots.
 *
 * No outer panel wrapper - that's provided by PlayConsole.
 */
export const ScorePanel = () => {
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const handLevels = useGameStore((s) => s.handLevels);
  const revealState = useGameStore((s) => s.revealState);
  const finalizeHand = useGameStore((s) => s.finalizeHand);
  const updateRevealAnimation = useGameStore((s) => s.updateRevealAnimation);
  const ownedItems = useGameStore((s) => s.ownedItems);
  const openItemModal = useGameStore((s) => s.openItemModal);

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

  // Total mult includes bonus mult
  const displayMult = baseMult + bonusMult;

  // Get display total
  const displayTotal =
    revealState?.active && revealState.animationPhase === "total"
      ? revealState.displayTotal
      : levelScore;

  // Handle item tap
  const handleItemPress = (itemId: string) => {
    triggerSelectionHaptic();
    openItemModal(itemId, false); // false = no purchase CTA (already owned)
  };

  // Create array of 5 slots, filled with owned items or null for empty
  const slots: (string | null)[] = Array.from(
    { length: MAX_ITEM_SLOTS },
    (_, i) => (i < ownedItems.length ? ownedItems[i] : null)
  );

  return (
    <View style={styles.container}>
      {/* Row 1: Score Row */}
      <View style={styles.row}>
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
                    color={bonusMult > 0 ? COLORS.upgradeMult : COLORS.cyan}
                  >
                    {displayMult}
                  </GameText>
                  {bonusMult > 0 && revealState?.active && (
                    <GameText variant="bodySmall" color={COLORS.upgradeMult}>
                      (+{bonusMult})
                    </GameText>
                  )}
                </View>
              </Animated.View>
            </View>
          )}
        </InsetSlot>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* Row 2: Items Row */}
      <View style={styles.row}>
        {/* Left: Label */}
        <View style={styles.leftSection}>
          <GameText variant="displaySmall" color={COLORS.text}>
            Inventar
          </GameText>
        </View>

        {/* Right: 5 Item Slots */}
        <View style={styles.itemSlotsContainer}>
          {slots.map((itemId, index) => {
            const itemDef = itemId ? getShopItemById(itemId) : null;
            const isEmpty = !itemId;

            return (
              <View key={itemId || `empty-${index}`} style={styles.itemSlot}>
                {isEmpty ? (
                  <InsetSlot padding="none" style={styles.itemSlotInset}>
                    {/* Empty slot placeholder */}
                  </InsetSlot>
                ) : (
                  <Pressable
                    onPress={() => handleItemPress(itemId)}
                    style={styles.itemPressable}
                  >
                    <InsetSlot padding="none" style={styles.itemSlotInset}>
                      <Image
                        source={ITEM_ICONS[itemId] || ITEM_ICONS.fokus}
                        style={styles.itemIcon}
                      />
                    </InsetSlot>
                  </Pressable>
                )}
                <GameText
                  variant="labelSmall"
                  color={isEmpty ? COLORS.textMuted : COLORS.text}
                  style={styles.itemLabel}
                  numberOfLines={1}
                >
                  {isEmpty ? "leer" : itemDef?.name || itemId}
                </GameText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Vertical layout for two rows
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "45%", // Fixed percentage ensures consistent width across both rows
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
  divider: {
    height: 1,
    backgroundColor: COLORS.overlays.whiteSubtle,
    marginVertical: SPACING.xs,
    width: "40%",
  },
  itemSlotsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemSlot: {
    alignItems: "center",
    gap: 2,
  },
  itemPressable: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  itemSlotInset: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  itemLabel: {
    textAlign: "center",
    maxWidth: 36,
  },
});
