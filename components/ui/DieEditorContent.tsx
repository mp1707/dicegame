import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { TileButton, TileButtonState } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { hasDieAnyEnhanceableFace } from "../../utils/gameCore";

/**
 * DieEditorContent - Bottom panel content for die selection (DICE_EDITOR_DIE phase)
 *
 * Features:
 * - Header with upgrade type indicator
 * - Single row of 5 TileButtons for die selection
 * - Icons: die.png for all
 * - Labels: "Würfel 1", "Würfel 2", etc.
 * - States: selected (current die), invalid (maxed), active (available)
 * - Staggered entrance animations
 */
export const DieEditorContent: React.FC = () => {
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  const pendingUpgradeType = useGameStore((s) => s.pendingUpgradeType);
  const selectEditorDie = useGameStore((s) => s.selectEditorDie);

  // Header animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(6);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 200 });
    headerTranslateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  // Get state for a die tile
  const getDieState = (index: number): TileButtonState => {
    if (selectedEditorDie === index) return "selected";
    if (!hasDieAnyEnhanceableFace(index, diceEnhancements)) return "invalid";
    return "active";
  };

  // Upgrade type display
  const upgradeLabel =
    pendingUpgradeType === "points" ? "+10 Punkte/Pip" : "+1 Mult/Pip";
  const upgradeColor =
    pendingUpgradeType === "points" ? COLORS.upgradePoints : COLORS.upgradeMult;

  return (
    <View style={styles.container}>
      {/* Upgrade type chip */}
      <Animated.View style={[styles.chipContainer, headerAnimStyle]}>
        <Chip
          label={upgradeLabel}
          color={pendingUpgradeType === "points" ? "cyan" : "coral"}
          size="sm"
        />
      </Animated.View>

      {/* Single row of 5 dice */}
      <View style={styles.diceRow}>
        {[0, 1, 2, 3, 4].map((index) => (
          <AnimatedDieTile
            key={index}
            index={index}
            state={getDieState(index)}
            onPress={() => selectEditorDie(index)}
            delay={
              ANIMATION.shop.headerDelay + index * ANIMATION.shop.gridStagger
            }
          />
        ))}
      </View>
    </View>
  );
};

// Animated die tile wrapper
interface AnimatedDieTileProps {
  index: number;
  state: TileButtonState;
  onPress: () => void;
  delay: number;
}

const AnimatedDieTile: React.FC<AnimatedDieTileProps> = ({
  index,
  state,
  onPress,
  delay,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

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

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrapper, animStyle]}>
      <TileButton
        iconSource={require("../../assets/icons/die.png")}
        labelLine1="Würfel"
        labelLine2={`${index + 1}`}
        level={1}
        state={state}
        onPress={onPress}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  chipContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  diceRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  tileWrapper: {
    flex: 1,
    maxWidth: 72,
  },
  tile: {
    height: 80,
  },
});
