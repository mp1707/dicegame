import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SquareTileButton } from "../shared";
import { SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { hasDieAnyEnhanceableFace } from "../../utils/gameCore";

// Die icon
const dieIcon = require("../../assets/icons/die.png");

/**
 * DieEditorContent - Bottom panel content for die selection (DICE_EDITOR_DIE phase)
 *
 * Features:
 * - Single row of 5 pixel-style buttons for die selection
 * - Icons: die.png for all
 * - Labels: "Würfel 1", "Würfel 2", etc.
 * - States: selected (cyan), active (purple), invalid/disabled (muted)
 * - Enhancement pills showing accumulated points/mult
 * - Staggered entrance animations
 */
export const DieEditorContent: React.FC = () => {
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const selectEditorDie = useGameStore((s) => s.selectEditorDie);

  // Check if die is enhanceable (not maxed out)
  const isDieEnhanceable = (index: number): boolean => {
    return hasDieAnyEnhanceableFace(index, diceEnhancements);
  };

  // Get enhancement sums for a die (across all 6 faces)
  const getDieEnhanceSums = (dieIndex: number) => {
    const die = diceEnhancements[dieIndex];
    if (!die) return { points: 0, mult: 0 };

    let points = 0;
    let mult = 0;
    die.faces.forEach((face) => {
      face.forEach((pip) => {
        if (pip === "points") points++;
        else if (pip === "mult") mult++;
      });
    });
    return { points, mult };
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowsContainer}>
        {/* Row 1: Dice 1-3 */}
        <View style={styles.diceRow}>
          {[0, 1, 2].map((index) => {
            const sums = getDieEnhanceSums(index);
            const isEnhanceable = isDieEnhanceable(index);
            return (
              <AnimatedDieTile
                key={index}
                index={index}
                isSelected={selectedEditorDie === index}
                isDisabled={!isEnhanceable}
                onPress={() => selectEditorDie(index)}
                delay={
                  ANIMATION.shop.headerDelay +
                  index * ANIMATION.shop.gridStagger
                }
                enhancePoints={sums.points}
                enhanceMult={sums.mult}
              />
            );
          })}
        </View>

        {/* Row 2: Dice 4-5 */}
        <View style={styles.diceRow}>
          {[3, 4].map((index) => {
            const sums = getDieEnhanceSums(index);
            const isEnhanceable = isDieEnhanceable(index);
            return (
              <AnimatedDieTile
                key={index}
                index={index}
                isSelected={selectedEditorDie === index}
                isDisabled={!isEnhanceable}
                onPress={() => selectEditorDie(index)}
                delay={
                  ANIMATION.shop.headerDelay +
                  index * ANIMATION.shop.gridStagger
                }
                enhancePoints={sums.points}
                enhanceMult={sums.mult}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Animated die tile wrapper
interface AnimatedDieTileProps {
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
  delay: number;
  enhancePoints?: number;
  enhanceMult?: number;
}

const AnimatedDieTile: React.FC<AnimatedDieTileProps> = ({
  index,
  isSelected,
  isDisabled,
  onPress,
  delay,
  enhancePoints,
  enhanceMult,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  // Entrance animation
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: ANIMATION.shop.itemAnimDuration })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: ANIMATION.shop.itemAnimDuration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, []);

  // Selection pulse animation is now built into Button component

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrapper, animStyle]}>
      <SquareTileButton
        iconSource={dieIcon}
        label="Würfel"
        sublabel={`${index + 1}`}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onPress={onPress}
        enhancePoints={enhancePoints}
        enhanceMult={enhanceMult}
        style={styles.tile}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  rowsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.lg,
    paddingTop: SPACING.md,
  },
  diceRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  tileWrapper: {
    flex: 1,
    maxWidth: 80,
  },
  tile: {
    aspectRatio: 1, // Ensure square tiles
  },
});
