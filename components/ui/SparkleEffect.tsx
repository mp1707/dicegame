import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ANIMATION, COLORS } from "../../constants/theme";

interface SparkleEffectProps {
  /** Whether the sparkle animation is active */
  active: boolean;
  /** Number of particles (default: 4) */
  count?: number;
  /** Color of the sparkles */
  color?: string;
  /** Called when all sparkles have finished */
  onComplete?: () => void;
}

interface Particle {
  id: number;
  offsetX: number;
  delay: number;
}

/**
 * SparkleEffect - Renders tiny spark particles that drift upward and fade out.
 * Used for celebratory micro-animations (payout, purchase feedback).
 */
export const SparkleEffect: React.FC<SparkleEffectProps> = ({
  active,
  count = ANIMATION.cashout.sparkleCount,
  color = COLORS.gold,
  onComplete,
}) => {
  // Generate particle configs on mount
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      offsetX: (Math.random() - 0.5) * 40, // -20 to +20 px
      delay: i * 60, // Staggered start
    }));
  }, [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <SparkleParticle
          key={particle.id}
          active={active}
          offsetX={particle.offsetX}
          delay={particle.delay}
          color={color}
          isLast={index === particles.length - 1}
          onComplete={onComplete}
        />
      ))}
    </View>
  );
};

interface SparkleParticleProps {
  active: boolean;
  offsetX: number;
  delay: number;
  color: string;
  isLast: boolean;
  onComplete?: () => void;
}

const SparkleParticle: React.FC<SparkleParticleProps> = ({
  active,
  offsetX,
  delay,
  color,
  isLast,
  onComplete,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      const drift = ANIMATION.cashout.sparkleDrift;
      const duration = ANIMATION.cashout.sparkleDuration;

      // Fade in quickly, then fade out
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.2 }, () => {
          opacity.value = withTiming(0, { duration: duration * 0.6 });
        })
      );

      // Drift upward
      translateY.value = withDelay(
        delay,
        withTiming(-drift, {
          duration: duration,
          easing: Easing.out(Easing.quad),
        })
      );

      // Scale up then down
      scale.value = withDelay(
        delay,
        withTiming(1.2, { duration: duration * 0.3 }, () => {
          scale.value = withTiming(0.3, { duration: duration * 0.7 }, () => {
            if (isLast && onComplete) {
              runOnJS(onComplete)();
            }
          });
        })
      );
    } else {
      // Reset
      opacity.value = 0;
      translateY.value = 0;
      scale.value = 0.5;
    }
  }, [active, delay, isLast, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: offsetX },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <View style={[styles.sparkle, { backgroundColor: color }]} />
      <View
        style={[
          styles.sparkleGlow,
          { backgroundColor: color, shadowColor: color },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  particle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sparkleGlow: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
