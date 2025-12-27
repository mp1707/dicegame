import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { CATEGORIES } from "../../utils/yahtzeeScoring";
import { HAND_BASE_CONFIG, getBasePoints } from "../../utils/gameCore";

export const ScoreRow = () => {
  const selectedHandId = useGameStore((s) => s.selectedHandId);
  const handLevels = useGameStore((s) => s.handLevels);
  const revealState = useGameStore((s) => s.revealState);
  const finalizeHand = useGameStore((s) => s.finalizeHand);

  // Animation values
  const scale = useSharedValue(1);
  const animatedPips = useSharedValue(0);
  const showFinalScore = useSharedValue(false);

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

  // Run reveal animation when revealState becomes active
  useEffect(() => {
    if (revealState?.active && revealState.breakdown && !animationInProgress.current) {
      animationInProgress.current = true;
      const { pips, finalScore } = revealState.breakdown;

      // Animate pips counting up
      animatedPips.value = 0;
      showFinalScore.value = false;

      // Simple counting animation over 800ms
      const duration = 800;
      const startTime = Date.now();
      const countUp = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        animatedPips.value = Math.round(pips * progress);

        if (progress < 1) {
          requestAnimationFrame(countUp);
        } else {
          // Counting complete - show final score with bounce
          showFinalScore.value = true;
          scale.value = withSequence(
            withSpring(1.15, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
          );

          // Hold for 2 seconds then finalize
          setTimeout(() => {
            animationInProgress.current = false;
            finalizeHand();
          }, 2000);
        }
      };

      // Start animation after a short delay
      setTimeout(countUp, 200);
    }
  }, [revealState?.active]);

  // Reset animation when reveal ends
  useEffect(() => {
    if (!revealState?.active) {
      animatedPips.value = 0;
      showFinalScore.value = false;
      scale.value = 1;
      animationInProgress.current = false;
    }
  }, [revealState?.active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Determine what to show
  const renderRightContent = () => {
    if (!selectedHandId) {
      return <Text style={styles.placeholder}>—</Text>;
    }

    if (revealState?.active && revealState.breakdown) {
      const { finalScore } = revealState.breakdown;

      // During animation or after showing final
      if (showFinalScore.value) {
        return (
          <Animated.Text style={[styles.finalScore, animatedStyle]}>
            {finalScore}
          </Animated.Text>
        );
      }

      // Show formula with animated pips
      return (
        <Text style={styles.formula}>
          ({basePoints} + {Math.round(animatedPips.value)}) × {mult}
        </Text>
      );
    }

    // Selected but not accepted yet - show formula with "pips" text
    return (
      <Text style={styles.formula}>
        ({basePoints} + pips) × {mult}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left: Hand name */}
      <View style={styles.leftSection}>
        <Text
          style={[styles.handName, !selectedHandId && styles.placeholder]}
          numberOfLines={1}
        >
          {handName}
        </Text>
        {selectedHandId && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LV {handLevel}</Text>
          </View>
        )}
      </View>

      {/* Right: Formula or score */}
      <View style={styles.rightSection}>{renderRightContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPaddingHorizontal,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    minHeight: 48,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  handName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Bungee-Regular",
    letterSpacing: 0.5,
  },
  placeholder: {
    color: COLORS.textMuted,
    opacity: 0.5,
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
    fontFamily: "Inter-Bold",
    letterSpacing: 0.5,
  },
  formula: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 0.5,
  },
  finalScore: {
    color: COLORS.gold,
    fontSize: 28,
    fontFamily: "Bungee-Regular",
    textShadowColor: "rgba(255, 200, 87, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
