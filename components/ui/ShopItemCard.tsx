import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Check } from "lucide-react-native";
import { GameText } from "../shared";
import { Chip } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { triggerSelectionHaptic, triggerImpactMedium } from "../../utils/haptics";
import { SparkleEffect } from "./SparkleEffect";

export type ShopItemState = "affordable" | "unaffordable" | "purchased" | "soon";

interface ShopItemCardProps {
  /** Item icon */
  icon: React.ReactNode;
  /** Item name (bold) */
  name: string;
  /** Effect description (muted) */
  effect?: string;
  /** Tag labels */
  tags?: string[];
  /** Price in dollars (not shown for "soon" items) */
  price?: number;
  /** Current item state */
  state: ShopItemState;
  /** Called when item is pressed (affordable only) */
  onPress?: () => void;
  /** Animation delay for stagger effect */
  animationDelay?: number;
  /** Whether to show purchase feedback */
  showPurchaseFeedback?: boolean;
}

/**
 * ShopItemCard - Shop item with proper anatomy and states.
 *
 * States:
 * - affordable: Mint price capsule, subtle mint glow
 * - unaffordable: Muted capsule, lock icon, "NICHT GENUG" label
 * - purchased: Gold check + "GEKAUFT" (future)
 * - soon: 55% dimmed, "BALD" chip, animated shimmer
 */
export const ShopItemCard: React.FC<ShopItemCardProps> = ({
  icon,
  name,
  effect,
  tags = [],
  price,
  state,
  onPress,
  animationDelay = 0,
  showPurchaseFeedback = false,
}) => {
  // Entrance animation
  const translateY = useSharedValue(10);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  // Shimmer animation for "soon" items
  const shimmerPosition = useSharedValue(-1);

  // Purchase feedback
  const flashOpacity = useSharedValue(0);
  const [showSparkles, setShowSparkles] = React.useState(false);

  // Entrance animation
  useEffect(() => {
    const delay = animationDelay;
    const duration = ANIMATION.shop.itemAnimDuration;

    translateY.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.back(1.2)),
    });
    opacity.value = withTiming(1, { duration });
  }, [animationDelay]);

  // Shimmer animation for "soon" state
  useEffect(() => {
    if (state === "soon") {
      const interval = ANIMATION.shop.shimmerInterval;
      const duration = ANIMATION.shop.shimmerDuration;

      // Start shimmer loop
      shimmerPosition.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: interval - duration }),
          withTiming(2, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        false
      );
    } else {
      cancelAnimation(shimmerPosition);
    }

    return () => cancelAnimation(shimmerPosition);
  }, [state]);

  // Purchase feedback
  useEffect(() => {
    if (showPurchaseFeedback) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: ANIMATION.shop.purchaseFlashDuration })
      );
      setShowSparkles(true);
      triggerImpactMedium();
    }
  }, [showPurchaseFeedback]);

  const handlePress = () => {
    if (state !== "affordable") return;

    triggerSelectionHaptic();

    // Press animation
    scale.value = withSequence(
      withTiming(0.97, { duration: 60 }),
      withSpring(1, ANIMATION.springs.button)
    );

    onPress?.();
  };

  // Animated styles
  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const shimmerAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerPosition.value, [-1, 2], [-100, 200]) },
    ],
    opacity: state === "soon" ? 0.15 : 0,
  }));

  const flashAnimStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const isSoon = state === "soon";
  const isAffordable = state === "affordable";
  const isUnaffordable = state === "unaffordable";
  const isPurchased = state === "purchased";

  return (
    <Animated.View style={[styles.container, containerAnimStyle]}>
      <Pressable
        onPress={handlePress}
        disabled={!isAffordable}
        style={[
          styles.card,
          isSoon && styles.cardSoon,
          isAffordable && styles.cardAffordable,
          isUnaffordable && styles.cardUnaffordable,
          isPurchased && styles.cardPurchased,
        ]}
      >
        {/* Shimmer overlay for "soon" items */}
        {isSoon && (
          <Animated.View style={[styles.shimmerContainer, shimmerAnimStyle]}>
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.3)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        )}

        {/* Purchase flash overlay */}
        <Animated.View style={[styles.flashOverlay, flashAnimStyle]} />

        {/* Card content */}
        <View style={[styles.content, isSoon && styles.contentSoon]}>
          {/* Top: Icon */}
          <View style={styles.iconContainer}>
            {isSoon ? (
              <Lock size={DIMENSIONS.iconSize.md} color={COLORS.textMuted} />
            ) : isPurchased ? (
              <Check size={DIMENSIONS.iconSize.md} color={COLORS.gold} />
            ) : (
              icon
            )}
          </View>

          {/* Name */}
          <GameText
            variant="bodyMedium"
            color={isSoon ? COLORS.textMuted : COLORS.text}
            style={styles.name}
          >
            {name}
          </GameText>

          {/* Effect line */}
          {effect && !isSoon && (
            <GameText variant="bodySmall" color={COLORS.textMuted} style={styles.effect}>
              {effect}
            </GameText>
          )}

          {/* Tags and Price row */}
          <View style={styles.bottomRow}>
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {isSoon ? (
                <Chip label="BALD" color="muted" size="sm" />
              ) : isPurchased ? (
                <Chip label="GEKAUFT" color="gold" size="sm" />
              ) : (
                tags.map((tag, i) => (
                  <Chip key={i} label={tag} color="cyan" size="sm" />
                ))
              )}
            </View>

            {/* Price capsule with coin icon */}
            {!isSoon && !isPurchased && price !== undefined && (
              <View style={[styles.priceCapsule, isUnaffordable && styles.priceCapsuleMuted]}>
                <Image
                  source={require("../../assets/icons/coin.png")}
                  style={[styles.coinIcon, isUnaffordable && styles.coinIconMuted]}
                />
                <GameText
                  variant="bodySmall"
                  color={isAffordable ? COLORS.gold : COLORS.textMuted}
                >
                  {price}
                </GameText>
              </View>
            )}
          </View>

          {/* "Not enough" label for unaffordable */}
          {isUnaffordable && (
            <GameText variant="caption" color={COLORS.coral} style={styles.notEnough}>
              NICHT GENUG
            </GameText>
          )}
        </View>

        {/* Sparkles for purchase feedback */}
        {showSparkles && (
          <View style={styles.sparkleContainer}>
            <SparkleEffect
              active={showSparkles}
              color={COLORS.mint}
              count={3}
              onComplete={() => setShowSparkles(false)}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    backgroundColor: COLORS.surface,
    borderWidth: DIMENSIONS.borderWidthThin,
    borderColor: COLORS.border,
    borderTopColor: COLORS.overlays.whiteMild,
    borderBottomWidth: DIMENSIONS.borderWidthThick,
    borderBottomColor: COLORS.overlays.blackMedium,
    overflow: "hidden",
  },
  cardSoon: {
    opacity: 0.55,
  },
  cardAffordable: {
    borderColor: COLORS.overlays.mintMild,
    shadowColor: COLORS.mint,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardUnaffordable: {
    opacity: 0.7,
  },
  cardPurchased: {
    borderColor: COLORS.gold,
    opacity: 0.8,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmerGradient: {
    width: 100,
    height: "100%",
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlays.mintGlow,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
  },
  contentSoon: {
    opacity: 0.7,
  },
  iconContainer: {
    marginBottom: SPACING.xxs,
  },
  name: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  effect: {
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: SPACING.xxs,
  },
  priceCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
  },
  priceCapsuleMuted: {
    opacity: 0.6,
  },
  coinIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  coinIconMuted: {
    opacity: 0.5,
  },
  notEnough: {
    marginTop: SPACING.xxs,
  },
  sparkleContainer: {
    position: "absolute",
    bottom: SPACING.sm,
    right: SPACING.sm,
  },
});
