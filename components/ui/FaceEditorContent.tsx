import React, { useEffect } from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { GameText, TileButton, TileButtonState } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { isFaceEnhanceable } from "../../utils/gameCore";

// Face icons mapping
const FACE_ICONS: Record<number, ImageSourcePropType> = {
  1: require("../../assets/icons/1die.png"),
  2: require("../../assets/icons/2die.png"),
  3: require("../../assets/icons/3die.png"),
  4: require("../../assets/icons/4die.png"),
  5: require("../../assets/icons/5die.png"),
  6: require("../../assets/icons/6die.png"),
};

/**
 * FaceEditorContent - Bottom panel content for face selection (DICE_EDITOR_FACE phase)
 *
 * Features:
 * - Header showing which die is selected
 * - Two rows of 3 TileButtons each (6 faces)
 * - Icons: 1die.png through 6die.png
 * - Labels: "Seite 1" through "Seite 6"
 * - States: selected (current face), invalid (maxed), active (enhanceable)
 * - Face buttons sync with 3D die rotation
 * - Staggered entrance animations
 */
export const FaceEditorContent: React.FC = () => {
  const selectedEditorDie = useGameStore((s) => s.selectedEditorDie);
  const selectedEditorFace = useGameStore((s) => s.selectedEditorFace);
  const selectEditorFace = useGameStore((s) => s.selectEditorFace);
  const diceEnhancements = useGameStore((s) => s.diceEnhancements);
  // Get state for a face tile
  const getFaceState = (face: number): TileButtonState => {
    if (selectedEditorFace === face) return "selected";
    if (
      selectedEditorDie === null ||
      !isFaceEnhanceable(selectedEditorDie, face, diceEnhancements)
    ) {
      return "invalid";
    }
    return "active";
  };

  // Calculate delays for grid items (2 rows x 3 cols)
  const getItemDelay = (row: number, col: number) => {
    const baseDelay = ANIMATION.shop.headerDelay + 60;
    const index = row * 3 + col;
    return baseDelay + index * ANIMATION.shop.gridStagger;
  };

  return (
    <View style={styles.container}>
      {/* Face grid - 2 rows x 3 cols */}
      <View style={styles.gridContainer}>
        {/* Row 1: Faces 1-3 */}
        <View style={styles.row}>
          {[1, 2, 3].map((face, col) => (
            <AnimatedFaceTile
              key={face}
              face={face}
              state={getFaceState(face)}
              onPress={() => selectEditorFace(face)}
              delay={getItemDelay(0, col)}
            />
          ))}
        </View>

        {/* Row 2: Faces 4-6 */}
        <View style={styles.row}>
          {[4, 5, 6].map((face, col) => (
            <AnimatedFaceTile
              key={face}
              face={face}
              state={getFaceState(face)}
              onPress={() => selectEditorFace(face)}
              delay={getItemDelay(1, col)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Animated face tile wrapper
interface AnimatedFaceTileProps {
  face: number;
  state: TileButtonState;
  onPress: () => void;
  delay: number;
}

const AnimatedFaceTile: React.FC<AnimatedFaceTileProps> = ({
  face,
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
        iconSource={FACE_ICONS[face]}
        labelLine1="Seite"
        labelLine2={`${face}`}
        level={1}
        state={state}
        onPress={onPress}
        style={styles.tile}
        showLevelBadge={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  gridContainer: {
    flex: 1,
    gap: SPACING.sm,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  tileWrapper: {
    flex: 1,
    maxWidth: 90,
  },
  tile: {
    height: 80,
  },
});
