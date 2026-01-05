import React from "react";
import { View, StyleSheet } from "react-native";
import { ArrowUp, Sparkles } from "lucide-react-native";
import { ShopItemCard } from "./ShopItemCard";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { getDiceUpgradeCost } from "../../utils/gameCore";

/**
 * ShopContent - Shop grid for bottom panel slot (SHOP_MAIN phase)
 *
 * Features:
 * - 2x2 grid with ShopItemCard components
 * - Dice enhancement card (dynamic based on spawn type)
 * - Staggered entrance animations
 *
 * Note: Title and subtitle are now displayed in ShopTrayOverlay instead.
 */
export const ShopContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const selectUpgradeItem = useGameStore((s) => s.selectUpgradeItem);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const openDiceEditor = useGameStore((s) => s.openDiceEditor);

  const handleUpgrade = () => {
    selectUpgradeItem();
  };

  const handleDiceUpgrade = () => {
    if (shopDiceUpgradeType) {
      openDiceEditor(shopDiceUpgradeType);
    }
  };

  // Calculate stagger delays for grid items
  const getItemDelay = (row: number, col: number) => {
    const baseDelay = ANIMATION.shop.headerDelay + 60;
    const index = row * 2 + col;
    return baseDelay + index * ANIMATION.shop.gridStagger;
  };

  // Dice upgrade card configuration
  const diceUpgradeConfig = shopDiceUpgradeType
    ? {
        name: shopDiceUpgradeType === "points" ? "WÜRFEL +" : "WÜRFEL ×",
        effect:
          shopDiceUpgradeType === "points" ? "+10 Punkte/Pip" : "+1 Mult/Pip",
        price: getDiceUpgradeCost(shopDiceUpgradeType),
        color:
          shopDiceUpgradeType === "points"
            ? COLORS.upgradePoints
            : COLORS.upgradeMult,
        tag: shopDiceUpgradeType === "points" ? "PUNKTE" : "MULT",
      }
    : null;

  return (
    <View style={styles.container}>
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

          {/* Dice Enhancement - Dynamic or Soon */}
          {diceUpgradeConfig ? (
            <ShopItemCard
              icon={
                <Sparkles
                  size={DIMENSIONS.iconSize.md}
                  color={diceUpgradeConfig.color}
                  strokeWidth={2.5}
                />
              }
              name={diceUpgradeConfig.name}
              effect={diceUpgradeConfig.effect}
              tags={[diceUpgradeConfig.tag]}
              price={diceUpgradeConfig.price}
              state={
                money >= diceUpgradeConfig.price ? "affordable" : "unaffordable"
              }
              onPress={handleDiceUpgrade}
              animationDelay={getItemDelay(0, 1)}
            />
          ) : (
            <ShopItemCard
              icon={null}
              name="WÜRFEL"
              state="soon"
              animationDelay={getItemDelay(0, 1)}
            />
          )}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {/* Jokers - Soon */}
          <ShopItemCard
            icon={null}
            name="JOKERS"
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
