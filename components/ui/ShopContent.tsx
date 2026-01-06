import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ArrowUp } from "lucide-react-native";
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { getDiceUpgradeCost } from "../../utils/gameCore";
import { getShopItemById } from "../../items";
import { GameText, TileButton, TileButtonState } from "../shared";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";

// Icon mapping for shop items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
};

/**
 * ShopContent - Shop grid for bottom panel slot (SHOP_MAIN phase)
 *
 * Features:
 * - 2x2 grid with TileButton components
 * - Matches UpgradeContent visual style (price below tile)
 * - Dice enhancement card (dynamic based on spawn type)
 * - Purchasable item slot (e.g., Fokus)
 * - Staggered entrance animations
 *
 * Note: Title and subtitle are now displayed in ShopTrayOverlay instead.
 * Note: ItemDetailModal is rendered globally in App.tsx
 */
export const ShopContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const selectUpgradeItem = useGameStore((s) => s.selectUpgradeItem);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const shopItemId = useGameStore((s) => s.shopItemId);
  const openDiceEditor = useGameStore((s) => s.openDiceEditor);
  const openItemModal = useGameStore((s) => s.openItemModal);

  const handleUpgrade = () => {
    triggerImpactMedium();
    selectUpgradeItem();
  };

  const handleDiceUpgrade = () => {
    if (shopDiceUpgradeType) {
      triggerImpactMedium();
      openDiceEditor(shopDiceUpgradeType);
    }
  };

  const handleItemPress = () => {
    if (shopItemId) {
      triggerSelectionHaptic();
      openItemModal(shopItemId, true); // true = show purchase CTA
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
        label: shopDiceUpgradeType === "points" ? "PUNKTE" : "MULT",
        price: getDiceUpgradeCost(shopDiceUpgradeType),
        color:
          shopDiceUpgradeType === "points"
            ? COLORS.upgradePoints
            : COLORS.upgradeMult,
      }
    : null;

  // Upgrade Item (Hardcoded for now as per previous implementation)
  const upgradePrice = 7;
  const canAffordUpgrade = money >= upgradePrice;
  const upgradeState: TileButtonState = canAffordUpgrade ? "active" : "invalid";

  // Dice Upgrade Item
  const dicePrice = diceUpgradeConfig?.price ?? 0;
  const canAffordDice = diceUpgradeConfig ? money >= dicePrice : false;
  const diceState: TileButtonState = !diceUpgradeConfig
    ? "used" // "soon" / unavailable
    : canAffordDice
    ? "active"
    : "invalid";

  // Purchasable Item (e.g., Fokus)
  const shopItem = shopItemId ? getShopItemById(shopItemId) : null;
  const itemPrice = shopItem?.cost ?? 0;
  const canAffordItem = shopItem ? money >= itemPrice : false;
  const itemState: TileButtonState = !shopItem
    ? "invalid" // No item available / already purchased
    : canAffordItem
    ? "active"
    : "invalid";

  const renderCostPill = (price: number, canAfford: boolean) => (
    <View style={[styles.costPill, !canAfford && styles.costPillMuted]}>
      <Image
        source={require("../../assets/icons/coin.png")}
        style={[styles.coinIcon, !canAfford && { opacity: 0.5 }]}
      />
      <GameText
        variant="bodySmall"
        color={canAfford ? COLORS.gold : COLORS.textMuted}
      >
        {price}
      </GameText>
    </View>
  );

  const renderSoonPill = () => (
    <View style={[styles.costPill, styles.costPillMuted]}>
      <GameText variant="bodySmall" color={COLORS.textMuted}>
        BALD
      </GameText>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Shop Grid - 2x2 */}
      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {/* Upgrade Hand */}
          <ShopTileWrapper delay={getItemDelay(0, 0)}>
            <TileButton
              icon={
                <ArrowUp
                  size={32}
                  color={canAffordUpgrade ? COLORS.mint : COLORS.textMuted}
                  strokeWidth={3}
                />
              }
              labelLine1="UPGRADE"
              labelLine2="+5 BASE"
              state={upgradeState}
              onPress={handleUpgrade}
              style={styles.tile}
              showLevelBadge={false}
            />
            {renderCostPill(upgradePrice, canAffordUpgrade)}
          </ShopTileWrapper>

          {/* Dice Enhancement */}
          <ShopTileWrapper delay={getItemDelay(0, 1)}>
            {diceUpgradeConfig ? (
              <>
                <TileButton
                  iconSource={require("../../assets/icons/die.png")}
                  labelLine1={diceUpgradeConfig.name}
                  labelLine2={diceUpgradeConfig.label}
                  state={diceState}
                  onPress={handleDiceUpgrade}
                  style={styles.tile}
                  showLevelBadge={false}
                />
                {renderCostPill(dicePrice, canAffordDice)}
              </>
            ) : (
              // Fallback / Placeholder if no upgrade (should be covered by logic)
              <TileButton
                iconSource={require("../../assets/icons/die.png")}
                labelLine1="WÜRFEL"
                state="invalid" // dimmed
                onPress={() => {}}
                style={styles.tile}
                showLevelBadge={false}
              />
            )}
          </ShopTileWrapper>
        </View>

        {/* Row 2 - Fokus Item + Placeholder */}
        <View style={styles.row}>
          {/* Fokus Item (or placeholder if already owned) */}
          <ShopTileWrapper delay={getItemDelay(1, 0)}>
            {shopItem ? (
              <>
                <TileButton
                  iconSource={ITEM_ICONS[shopItem.id] || ITEM_ICONS.fokus}
                  labelLine1={shopItem.name.toUpperCase()}
                  state={itemState}
                  onPress={handleItemPress}
                  style={styles.tile}
                  showLevelBadge={false}
                />
                {renderCostPill(itemPrice, canAffordItem)}
              </>
            ) : (
              <>
                <TileButton
                  iconSource={undefined}
                  labelLine1="ITEMS"
                  state="invalid"
                  onPress={() => {}}
                  style={styles.tile}
                  showLevelBadge={false}
                />
                {renderSoonPill()}
              </>
            )}
          </ShopTileWrapper>

          {/* Powers - Soon */}
          <ShopTileWrapper delay={getItemDelay(1, 1)}>
            <TileButton
              iconSource={undefined}
              labelLine1="POWERS"
              state="invalid" // dimmed
              onPress={() => {}}
              style={styles.tile}
              showLevelBadge={false}
            />
            {renderSoonPill()}
          </ShopTileWrapper>
        </View>
      </View>
    </View>
  );
};

const ShopTileWrapper: React.FC<{
  children: React.ReactNode;
  delay: number;
}> = ({ children, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(400).springify()}
    style={styles.tileWrapper}
  >
    {children}
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: "center",
  },
  gridContainer: {
    flex: 1,
    gap: SPACING.sm, // Reduced gap (matches UpgradeContent effectively)
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
  },
  tileWrapper: {
    flex: 1,
    alignItems: "center",
    maxWidth: 100, // Limit width
  },
  tile: {
    width: "100%",
    aspectRatio: 1,
  },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.overlays.blackSubtle,
  },
  costPillMuted: {
    opacity: 0.6,
  },
  coinIcon: {
    width: 12,
    height: 12,
    resizeMode: "contain",
  },
});
