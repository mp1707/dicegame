import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ArrowUp, ShoppingBag } from "lucide-react-native";
import { GameText } from "../shared";
import { ShopItemCard } from "./ShopItemCard";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";

/**
 * ShopContent - Redesigned shop for bottom panel slot
 *
 * Features:
 * - Header with title (money shown permanently in game header)
 * - Subtitle instruction
 * - 2x2 grid with ShopItemCard components
 * - Staggered entrance animations
 */
export const ShopContent: React.FC = () => {
  const selectUpgradeItem = useGameStore((s) => s.selectUpgradeItem);

  // Header animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(6);

  useEffect(() => {
    // Title fade + drop
    headerOpacity.value = withTiming(1, { duration: 200 });
    headerTranslateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const handleUpgrade = () => {
    selectUpgradeItem();
  };

  // Calculate stagger delays for grid items
  const getItemDelay = (row: number, col: number) => {
    const baseDelay = ANIMATION.shop.headerDelay + 60;
    const index = row * 2 + col;
    return baseDelay + index * ANIMATION.shop.gridStagger;
  };

  return (
    <View style={styles.container}>
      {/* Header with Title */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
        <ShoppingBag size={DIMENSIONS.iconSize.md} color={COLORS.cyan} />
        <GameText variant="displaySmall" color={COLORS.text}>
          SHOP
        </GameText>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={headerAnimStyle}>
        <GameText variant="bodySmall" color={COLORS.textMuted} style={styles.subtitle}>
          Wähle ein Upgrade
        </GameText>
      </Animated.View>

      {/* Shop Grid - 2x2 */}
      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {/* Upgrade Hand - Active */}
          <ShopItemCard
            icon={
              <ArrowUp
                size={DIMENSIONS.iconSize.md}
                color={COLORS.mint}
                strokeWidth={3}
              />
            }
            name="UPGRADE"
            effect="+5 Base"
            tags={["BOOST"]}
            price={7}
            state="affordable"
            onPress={handleUpgrade}
            animationDelay={getItemDelay(0, 0)}
          />

          {/* Jokers - Soon */}
          <ShopItemCard
            icon={null}
            name="JOKERS"
            state="soon"
            animationDelay={getItemDelay(0, 1)}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {/* Dice - Soon */}
          <ShopItemCard
            icon={null}
            name="DICE"
            state="soon"
            animationDelay={getItemDelay(1, 0)}
          />

          {/* Powers - Soon */}
          <ShopItemCard
            icon={null}
            name="POWERS"
            state="soon"
            animationDelay={getItemDelay(1, 1)}
          />
        </View>
      </View>
    </View>
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
  subtitle: {
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  gridContainer: {
    flex: 1,
    gap: SPACING.sm,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
  },
});
