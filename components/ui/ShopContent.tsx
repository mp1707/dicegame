import React, { useMemo } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { ArrowUp, Lock, Sparkles } from "lucide-react-native";
import { COLORS, SPACING, ANIMATION, DIMENSIONS } from "../../constants/theme";
import { useGameStore, ShopOfferType } from "../../store/gameStore";
import { getDiceUpgradeCost, getUpgradeCost } from "../../utils/gameCore";
import { getShopItemById } from "../../items";
import { GameText, TileButtonState } from "../shared";
import { Surface, InsetSlot } from "../ui-kit";
import Animated, {
  FadeInRight,
  ZoomIn,
  FadeInDown,
} from "react-native-reanimated";
import {
  triggerSelectionHaptic,
  triggerImpactMedium,
} from "../../utils/haptics";
import { ShopHeader } from "./ShopHeader";

// Icon mapping for shop items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
};

interface ShopCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  price?: number;
  state: TileButtonState;
  onPress: () => void;
  delay: number;
}

const ShopCard: React.FC<ShopCardProps> = ({
  icon,
  title,
  subtitle,
  price,
  state,
  onPress,
  delay,
}) => {
  const isSelected = state === "selected";
  const isActive = state === "active";
  const isUsed = state === "used";
  const isInvalid = state === "invalid";

  const handlePress = () => {
    if (isInvalid || isUsed) return;
    triggerSelectionHaptic();
    onPress();
  };

  const containerStyle = [
    styles.cardContainer,
    isSelected && styles.cardSelected,
    (isInvalid || isUsed) && styles.cardDisabled,
  ];

  const borderStyle = isSelected
    ? { borderColor: COLORS.cyan, borderWidth: 2 }
    : { borderColor: COLORS.overlays.whiteMild, borderWidth: 1 };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.cardWrapper}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pressableArea,
          pressed && isActive && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Surface variant="panel" style={[containerStyle, borderStyle]}>
          {/* Top Right: Price Badge */}
          {!isUsed && !isInvalid && price !== undefined && (
            <View style={styles.priceBadge}>
              <Image
                source={require("../../assets/icons/coin.png")}
                style={[
                  styles.coinIcon,
                  { opacity: isActive || isSelected ? 1 : 0.5 },
                ]}
              />
              <GameText
                variant="scoreboardSmall" // Smaller font as requested
                color={isActive || isSelected ? COLORS.gold : COLORS.textMuted}
              >
                {price}
              </GameText>
            </View>
          )}

          {/* Left: Icon in Inset */}
          <InsetSlot style={styles.iconInset} padding="sm">
            {icon}
          </InsetSlot>

          {/* Right: Info Column */}
          <View style={styles.cardInfoColumn}>
            {/* Title Group */}
            <View>
              <GameText
                variant="labelSmall"
                color={isSelected ? COLORS.cyan : COLORS.textMuted}
                style={styles.cardSubtitle}
              >
                {subtitle}
              </GameText>
              <GameText
                variant="displaySmall"
                color={isSelected ? COLORS.text : COLORS.text}
                style={styles.cardTitle}
                numberOfLines={1}
              >
                {title}
              </GameText>
            </View>

            {/* Status Footer (only for sold/locked) */}
            {(isUsed || (isInvalid && !price)) && (
              <View style={styles.cardFooter}>
                {isUsed ? (
                  <GameText variant="bodySmall" color={COLORS.textMuted}>
                    SOLD
                  </GameText>
                ) : (
                  <Lock size={16} color={COLORS.textMuted} />
                )}
              </View>
            )}
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
};

export const ShopContent: React.FC = () => {
  const money = useGameStore((s) => s.money);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const shopItemId = useGameStore((s) => s.shopItemId);
  const selectedShopOffer = useGameStore((s) => s.selectedShopOffer);
  const selectShopOffer = useGameStore((s) => s.selectShopOffer);
  const handLevels = useGameStore((s) => s.handLevels);

  // Handle offer selection
  const handleSelectOffer = (offer: ShopOfferType) => {
    if (selectedShopOffer === offer) {
      selectShopOffer(null);
    } else {
      selectShopOffer(offer);
    }
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
        <ShopHeader />

        {/* 2x2 Grid Layout */}
        <View style={styles.gridContainer}>
          {/* 1. Hand Upgrade */}
          <ShopCard
            icon={<ArrowUp size={28} color={COLORS.mint} strokeWidth={2.5} />}
            title="LEVEL UP"
            subtitle="HAND"
            price={upgradePrice}
            state={upgradeState}
            onPress={() => handleSelectOffer("upgrade")}
            delay={100}
          />

          {/* 2. Dice Upgrade */}
          <ShopCard
            icon={
              <Image
                source={require("../../assets/icons/die.png")}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: diceUpgradeConfig?.color,
                }}
                resizeMode="contain"
              />
            }
            title={diceUpgradeConfig?.name || "WÜRFEL"}
            subtitle={diceUpgradeConfig?.label || "UPGRADE"}
            price={dicePrice}
            state={diceState}
            onPress={() => handleSelectOffer("dice")}
            delay={160}
          />

          {/* 3. Item */}
          <ShopCard
            icon={
              <Image
                source={
                  shopItem
                    ? ITEM_ICONS[shopItem.id] || ITEM_ICONS.fokus
                    : require("../../assets/items/skull.png")
                }
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            }
            title={shopItem?.name.toUpperCase() || "ITEMS"}
            subtitle="CONSUMABLE"
            price={itemPrice}
            state={itemState}
            onPress={() => handleSelectOffer("item")}
            delay={220}
          />

          {/* 4. Powers - Locked */}
          <ShopCard
            icon={<Lock size={24} color={COLORS.textMuted} />}
            title="POWERS"
            subtitle="BALD"
            state="invalid"
            onPress={() => {}}
            delay={280}
          />
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  panelContent: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm, // reduced gap inside panel
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  cardWrapper: {
    width: "48%", // Allow gap
    height: "47%", // Fit 2 rows
    flexGrow: 1,
  },
  pressableArea: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    flexDirection: "row", // Horizontal layout
    alignItems: "center",
    justifyContent: "flex-start",
    padding: SPACING.sm,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: COLORS.surface2,
    position: "relative", // For badge positioning
  },
  cardSelected: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconInset: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  cardInfoColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  cardSubtitle: {
    letterSpacing: 1,
    opacity: 0.8,
  },
  cardTitle: {
    textAlign: "left",
  },
  cardFooter: {
    marginTop: 4,
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coinIcon: {
    width: 12, // Smaller icon for badge
    height: 12,
  },
});
