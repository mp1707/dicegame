import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { COLORS, ANIMATION } from "../constants/theme";
import { GameText } from "./shared";

type FloatPhase = "points" | "mult" | "idle";

interface FloatingScoreProps {
  /** Points value to display */
  pointsValue: number | null;
  /** Mult value to display */
  multValue: number | null;
  /** Which floating phase is currently active */
  floatPhase: FloatPhase;
  /** Current die index being counted (-1 = none) */
  currentDieIndex: number;
  /** Callback when a float animation completes */
  onFloatComplete?: (phase: FloatPhase) => void;
}

const { floatingScore: FLOAT_CONFIG } = ANIMATION;

// Total animation duration for a single number
const TOTAL_DURATION =
  FLOAT_CONFIG.popInDuration +
  FLOAT_CONFIG.holdDuration +
  FLOAT_CONFIG.fadeDuration;

// Float starts after pop-in and continues through hold and fade
const FLOAT_START_DELAY = FLOAT_CONFIG.popInDuration;
const FLOAT_DURATION = FLOAT_CONFIG.holdDuration + FLOAT_CONFIG.fadeDuration;

interface SpawnedNumber {
  id: number;
  value: number;
  label: string;
  color: string;
  arcDirection: "none" | "left" | "right";
  phase: FloatPhase;
}

/**
 * FloatingNumber - A single spawned number that animates independently
 */
const FloatingNumber = ({
  value,
  label,
  color,
  arcDirection,
  onAnimationEnd,
}: {
  value: number;
  label: string;
  color: string;
  arcDirection: "none" | "left" | "right";
  onAnimationEnd: () => void;
}) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const hasTriggeredEnd = useRef(false);

  useEffect(() => {
    // Immediately start the animation when mounted
    const xDirection =
      arcDirection === "left" ? -1 : arcDirection === "right" ? 1 : 0;

    // Scale: pop in then stay at 1
    scale.value = withSequence(
      withTiming(FLOAT_CONFIG.popInScale, {
        duration: FLOAT_CONFIG.popInDuration * 0.6,
        easing: Easing.out(Easing.back(2)),
      }),
      withTiming(1, {
        duration: FLOAT_CONFIG.popInDuration * 0.4,
        easing: Easing.out(Easing.quad),
      })
    );

    // Opacity: fade in, hold at 1, then fade out
    opacity.value = withSequence(
      withTiming(1, { duration: FLOAT_CONFIG.popInDuration }),
      withDelay(
        FLOAT_CONFIG.holdDuration,
        withTiming(
          0,
          {
            duration: FLOAT_CONFIG.fadeDuration,
            easing: Easing.in(Easing.quad),
          },
          (finished) => {
            if (finished && !hasTriggeredEnd.current) {
              hasTriggeredEnd.current = true;
              runOnJS(onAnimationEnd)();
            }
          }
        )
      )
    );

    // Float up: starts after pop, continues through hold and fade
    translateY.value = withDelay(
      FLOAT_START_DELAY,
      withTiming(-FLOAT_CONFIG.floatDistance, {
        duration: FLOAT_DURATION,
        easing: Easing.out(Easing.quad),
      })
    );

    // Arc motion: horizontal drift
    translateX.value = withDelay(
      FLOAT_START_DELAY,
      withTiming(
        FLOAT_CONFIG.floatDistance * FLOAT_CONFIG.arcCurve * xDirection,
        {
          duration: FLOAT_DURATION,
          easing: Easing.out(Easing.cubic),
        }
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.numberContainer, animatedStyle]}>
      <GameText variant="scoreboardLarge" color={color}>
        {value} {label}
      </GameText>
    </Animated.View>
  );
};

/**
 * FloatingScoreOverlay - Number spawner for level-up style floating scores
 *
 * Each number spawns at the same center point and animates independently.
 * Points float up-left, mult floats up-right.
 */
export const FloatingScoreOverlay = ({
  pointsValue,
  multValue,
  floatPhase,
  currentDieIndex,
  onFloatComplete,
}: FloatingScoreProps) => {
  const [spawnedNumbers, setSpawnedNumbers] = useState<SpawnedNumber[]>([]);
  const nextIdRef = useRef(0);
  const prevPhaseRef = useRef<FloatPhase>("idle");
  const prevDieIndexRef = useRef<number>(-1);

  // Spawn a new number when floatPhase changes OR when die index changes while counting
  useEffect(() => {
    const phaseChangedToPoints =
      floatPhase === "points" && prevPhaseRef.current !== "points";
    const dieChanged =
      currentDieIndex !== prevDieIndexRef.current && currentDieIndex >= 0;

    // Spawn points: phase just changed to "points" OR die changed while in "points" phase
    if (floatPhase === "points" && (phaseChangedToPoints || dieChanged)) {
      if (pointsValue !== null && pointsValue > 0) {
        const newNumber: SpawnedNumber = {
          id: nextIdRef.current++,
          value: pointsValue,
          label: "Punkte",
          color: "#FFFFFF",
          arcDirection: "none",
          phase: "points",
        };
        setSpawnedNumbers((prev) => [...prev, newNumber]);
      }
    }

    // Spawn mult: phase just changed to "mult" (mult always follows its die's points)
    if (floatPhase === "mult" && prevPhaseRef.current !== "mult") {
      if (multValue !== null && multValue > 0) {
        const newNumber: SpawnedNumber = {
          id: nextIdRef.current++,
          value: multValue,
          label: "Mult",
          color: COLORS.upgradeMult,
          arcDirection: "right",
          phase: "mult",
        };
        setSpawnedNumbers((prev) => [...prev, newNumber]);
      }
    }

    prevPhaseRef.current = floatPhase;
    prevDieIndexRef.current = currentDieIndex;
  }, [floatPhase, pointsValue, multValue, currentDieIndex]);

  const handleAnimationEnd = (id: number, phase: FloatPhase) => {
    // Remove the completed number from state
    setSpawnedNumbers((prev) => prev.filter((n) => n.id !== id));
    // Notify parent that this phase completed
    onFloatComplete?.(phase);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {spawnedNumbers.map((num) => (
        <FloatingNumber
          key={num.id}
          value={num.value}
          label={num.label}
          color={num.color}
          arcDirection={num.arcDirection}
          onAnimationEnd={() => handleAnimationEnd(num.id, num.phase)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "40%", // Position at roughly the middle of the dice tray area
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // Above everything
  },
  numberContainer: {
    position: "absolute",
    // Numbers spawn at the same centered spot
  },
});
