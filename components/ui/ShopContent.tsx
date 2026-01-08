import React from "react";
import { View, StyleSheet } from "react-native";
import { ArrowUp, Lock } from "lucide-react-native";
import { COLORS, SPACING, ANIMATION } from "../../constants/theme";
import { useGameStore, ShopOfferType } from "../../store/gameStore";
import { getDiceUpgradeCost, getUpgradeCost } from "../../utils/gameCore";
import { getShopItemById } from "../../items";
import { TileButton, TileButtonState } from "../shared";
import { Surface } from "../ui-kit";
import Animated, { FadeInDown } from "react-native-reanimated";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { ShopHeader } from "./ShopHeader";

// Icon mapping for shop items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
};

/**
 * ShopContent - Unified 2×2 offer shop with selection-based interaction
 *
 * Structure:
 * - ShopHeader: Title + currency capsule
 * - OfferGrid: 2×2 grid of TileButtons
 *
 * Interaction:
 * - Tap to select → updates tray preview
 * - Purchase via footer CTA
 */
export const ShopContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const shopItemId = useGameStore((s) => s.shopItemId);
  const selectedShopOffer = useGameStore((s) => s.selectedShopOffer);
  const selectShopOffer = useGameStore((s) => s.selectShopOffer);
  const handLevels = useGameStore((s) => s.handLevels);

  // Handle offer selection
  const handleSelectOffer = (offer: ShopOfferType) => {
    triggerSelectionHaptic();
    // Toggle selection if already selected
    if (selectedShopOffer === offer) {
      selectShopOffer(null);
    } else {
      selectShopOffer(offer);
    }
  };

  // Calculate stagger delays for grid items
  const getItemDelay = (row: number, col: number) => {
    const baseDelay = ANIMATION.shop.headerDelay + 60;
    const index = row * 2 + col;
    return baseDelay + index * ANIMATION.shop.gridStagger;
  };

  // Hand upgrade configuration
  const avgHandLevel = Math.floor(
    Object.values(handLevels).reduce((a, b) => a + b, 0) /
      Object.keys(handLevels).length
  );
  const upgradePrice = getUpgradeCost(avgHandLevel);
  const canAffordUpgrade = money >= upgradePrice;
  const upgradeState: TileButtonState =
    selectedShopOffer === "upgrade"
      ? "selected"
      : canAffordUpgrade
      ? "active"
      : "invalid";

  // Dice upgrade configuration
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

  const dicePrice = diceUpgradeConfig?.price ?? 0;
  const canAffordDice = diceUpgradeConfig ? money >= dicePrice : false;
  const diceState: TileButtonState = !diceUpgradeConfig
    ? "used" // Sold out / unavailable
    : selectedShopOffer === "dice"
    ? "selected"
    : canAffordDice
    ? "active"
    : "invalid";

  // Item configuration
  const shopItem = shopItemId ? getShopItemById(shopItemId) : null;
  const itemPrice = shopItem?.cost ?? 0;
  const canAffordItem = shopItem ? money >= itemPrice : false;
  const itemState: TileButtonState = !shopItem
    ? "invalid" // No item available / already purchased
    : selectedShopOffer === "item"
    ? "selected"
    : canAffordItem
    ? "active"
    : "invalid";

  return (
    <View style={styles.container}>
      <Surface variant="panel" style={styles.panelContent}>
        {/* Header with title and currency */}
        <ShopHeader />

        {/* Shop Grid - 2×2 */}
        <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {/* Upgrade Hand */}
          <ShopTileWrapper delay={getItemDelay(0, 0)}>
            <TileButton
              icon={
                <ArrowUp
                  size={32}
                  color={
                    selectedShopOffer === "upgrade" || canAffordUpgrade
                      ? COLORS.mint
                      : COLORS.textMuted
                  }
                  strokeWidth={3}
                />
              }
              labelLine1="UPGRADE"
              labelLine2="+5 BASE"
              state={upgradeState}
              onPress={() => handleSelectOffer("upgrade")}
              style={styles.tile}
              showLevelBadge={false}
              priceValue={upgradePrice}
              priceAffordable={canAffordUpgrade}
            />
          </ShopTileWrapper>

          {/* Dice Enhancement */}
          <ShopTileWrapper delay={getItemDelay(0, 1)}>
            {diceUpgradeConfig ? (
              <TileButton
                iconSource={require("../../assets/icons/die.png")}
                labelLine1={diceUpgradeConfig.name}
                labelLine2={diceUpgradeConfig.label}
                state={diceState}
                onPress={() => handleSelectOffer("dice")}
                style={styles.tile}
                showLevelBadge={false}
                priceValue={dicePrice}
                priceAffordable={canAffordDice}
              />
            ) : (
              <TileButton
                iconSource={require("../../assets/icons/die.png")}
                labelLine1="WÜRFEL"
                labelLine2="AUSVERKAUFT"
                state="used"
                onPress={() => {}}
                style={styles.tile}
                showLevelBadge={false}
                pricePurchased={true}
              />
            )}
          </ShopTileWrapper>
        </View>

        {/* Row 2 - Item + Placeholder */}
        <View style={styles.row}>
          {/* Purchasable Item */}
          <ShopTileWrapper delay={getItemDelay(1, 0)}>
            {shopItem ? (
              <TileButton
                iconSource={ITEM_ICONS[shopItem.id] || ITEM_ICONS.fokus}
                labelLine1={shopItem.name.toUpperCase()}
                state={itemState}
                onPress={() => handleSelectOffer("item")}
                style={styles.tile}
                showLevelBadge={false}
                priceValue={itemPrice}
                priceAffordable={canAffordItem}
              />
            ) : (
              <TileButton
                icon={
                  <Lock size={24} color={COLORS.textMuted} strokeWidth={2} />
                }
                labelLine1="ITEMS"
                state="invalid"
                onPress={() => {}}
                style={styles.tile}
                showLevelBadge={false}
              />
            )}
          </ShopTileWrapper>

          {/* Powers - Coming Soon */}
          <ShopTileWrapper delay={getItemDelay(1, 1)}>
            <TileButton
              icon={
                <Lock size={24} color={COLORS.textMuted} strokeWidth={2} />
              }
              labelLine1="POWERS"
              labelLine2="BALD"
              state="invalid"
              onPress={() => {}}
              style={styles.tile}
              showLevelBadge={false}
            />
          </ShopTileWrapper>
        </View>
        </View>
      </Surface>
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
  },
  panelContent: {
    flex: 1,
    padding: SPACING.md,
  },
  gridContainer: {
    flex: 1,
    gap: SPACING.sm,
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
    maxWidth: 100,
  },
  tile: {
    width: "100%",
    aspectRatio: 1,
  },
});
