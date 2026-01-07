import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { GameText, TileButton, TileButtonState } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import {
  isArtifactFaceEnhanceable,
  isArtifactFaceEnhanced,
} from "../../utils/gameCore";

/**
 * ArtifactEditorContent - Bottom panel content for artifact face selection (ARTIFACT_EDITOR phase)
 *
 * Features:
 * - Four rows of 5 TileButtons each (20 faces for D20)
 * - Labels: Numbers 1-20
 * - States: selected (current face), used (already enhanced), active (enhanceable)
 * - Enhanced faces show +1 mult badge
 * - Staggered entrance animations
 */
export const ArtifactEditorContent: React.FC = () => {
  const selectedArtifactFace = useGameStore((s) => s.selectedArtifactFace);
  const selectArtifactFace = useGameStore((s) => s.selectArtifactFace);
  const artifactEnhancement = useGameStore((s) => s.artifactEnhancement);

  // Get state for a face tile
  const getFaceState = (face: number): TileButtonState => {
    if (selectedArtifactFace === face) return "selected";
    // Already enhanced = "used" state
    if (isArtifactFaceEnhanced(face, artifactEnhancement)) {
      return "used";
    }
    return "active";
  };

  // Check if face is enhanced
  const isFaceEnhanced = (face: number) => {
    return isArtifactFaceEnhanced(face, artifactEnhancement);
  };

  // Calculate delays for grid items (4 rows x 5 cols)
  const getItemDelay = (row: number, col: number) => {
    const baseDelay = ANIMATION.shop.headerDelay + 40;
    const index = row * 5 + col;
    return baseDelay + index * (ANIMATION.shop.gridStagger * 0.5); // Faster stagger for more items
  };

  // Generate faces for each row
  const rows = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
  ];

  return (
    <View style={styles.container}>
      {/* Face grid - 4 rows x 5 cols */}
      <View style={styles.gridContainer}>
        {rows.map((rowFaces, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowFaces.map((face, col) => (
              <AnimatedArtifactTile
                key={face}
                face={face}
                state={getFaceState(face)}
                onPress={() => selectArtifactFace(face)}
                delay={getItemDelay(rowIndex, col)}
                isEnhanced={isFaceEnhanced(face)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

// Animated artifact face tile wrapper
interface AnimatedArtifactTileProps {
  face: number;
  state: TileButtonState;
  onPress: () => void;
  delay: number;
  isEnhanced?: boolean;
}

const AnimatedArtifactTile: React.FC<AnimatedArtifactTileProps> = ({
  face,
  state,
  onPress,
  delay,
  isEnhanced,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const scale = useSharedValue(1);
  const prevStateRef = React.useRef(state);

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

  // Selection pulse animation
  useEffect(() => {
    if (state === "selected" && prevStateRef.current !== "selected") {
      // Quick scale pulse on selection
      scale.value = withSequence(
        withTiming(1.08, { duration: 80 }),
        withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
      );
    }
    prevStateRef.current = state;
  }, [state]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrapper, animStyle]}>
      <TileButton
        labelLine1={`${face}`}
        state={state}
        onPress={onPress}
        style={styles.tile}
        showLevelBadge={false}
      />
      {/* Show +1 mult badge for enhanced faces */}
      {isEnhanced && (
        <View style={styles.enhancedBadge}>
          <Chip label="+1" color="coral" size="sm" />
        </View>
      )}
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
    gap: SPACING.xs,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  tileWrapper: {
    flex: 1,
    maxWidth: 60,
    position: "relative",
  },
  tile: {
    height: 56,
    paddingHorizontal: SPACING.xs,
  },
  enhancedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 1,
  },
});
