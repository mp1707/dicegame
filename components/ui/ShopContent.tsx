import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { ArrowUp, Lock } from "lucide-react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { useGameStore, ShopOfferType } from "../../store/gameStore";
import { getDiceUpgradeCost, getUpgradeCost } from "../../utils/gameCore";
import { getShopItemById } from "../../items";
import { GameText, TileButtonState } from "../shared";
import { Surface } from "../pixel-ui-kit";
import Animated, { FadeInDown } from "react-native-reanimated";
import { triggerSelectionHaptic } from "../../utils/haptics";
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
        <Surface
          tintColor={isSelected ? COLORS.surfaceHighlight : COLORS.surface2}
          padding="sm"
          style={containerStyle}
          contentStyle={styles.cardContentStyle}
        >
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
          <Surface
            tintColor={COLORS.overlays.blackMild}
            padding="sm"
            style={styles.iconInset}
            contentStyle={styles.iconInsetContent}
          >
            {icon}
          </Surface>

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
  const shopPointsUpgradeAvailable = useGameStore(
    (s) => s.shopPointsUpgradeAvailable
  );
  const shopMultUpgradeAvailable = useGameStore(
    (s) => s.shopMultUpgradeAvailable
  );
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

  // Dice upgrade configuration (POINTS)
  const pointsPrice = getDiceUpgradeCost("points");
  const canAffordPoints = money >= pointsPrice;
  const pointsState: TileButtonState = !shopPointsUpgradeAvailable
    ? "used"
    : selectedShopOffer === "dice_points"
    ? "selected"
    : canAffordPoints
    ? "active"
    : "invalid";

  // Dice upgrade configuration (MULT)
  const multPrice = getDiceUpgradeCost("mult");
  const canAffordMult = money >= multPrice;
  const multState: TileButtonState = !shopMultUpgradeAvailable
    ? "used"
    : selectedShopOffer === "dice_mult"
    ? "selected"
    : canAffordMult
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
      <View style={styles.panelContent}>
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

          {/* 2. Dice Upgrade (Points) */}
          <ShopCard
            icon={
              <Image
                source={require("../../assets/icons/die.png")}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: COLORS.upgradePoints,
                }}
                resizeMode="contain"
              />
            }
            title="WÜRFEL +"
            subtitle="PUNKTE"
            price={pointsPrice}
            state={pointsState}
            onPress={() => handleSelectOffer("dice_points")}
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
            subtitle="RELIKT"
            price={itemPrice}
            state={itemState}
            onPress={() => handleSelectOffer("item")}
            delay={220}
          />

          {/* 4. Dice Upgrade (Mult) */}
          <ShopCard
            icon={
              <Image
                source={require("../../assets/icons/die.png")}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: COLORS.upgradeMult,
                }}
                resizeMode="contain"
              />
            }
            title="WÜRFEL ×"
            subtitle="MULT"
            price={multPrice}
            state={multState}
            onPress={() => handleSelectOffer("dice_mult")}
            delay={280}
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
    aspectRatio: 2.2, // Wide cards (width:height ratio)
  },
  pressableArea: {
    flex: 1,
  },
  cardContentStyle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cardContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  cardSelected: {
    // Surface tintColor handles highlight state
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconInset: {
    width: 48,
    height: 48,
    marginRight: SPACING.md,
  },
  iconInsetContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
