import React, { useMemo } from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";
import { Check, ArrowUp } from "lucide-react-native";
import { GameText } from "../shared";
import { Surface, InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore, ShopOfferType } from "../../store/gameStore";
import { getDiceUpgradeCost, getUpgradeCost } from "../../utils/gameCore";
import { getShopItemById } from "../../items";

// Icon mapping for shop items
const ITEM_ICONS: Record<string, ImageSourcePropType> = {
  fokus: require("../../assets/items/skull.png"),
};

// Icons for upgrade types
const dieIcon = require("../../assets/icons/die.png");
const coinIcon = require("../../assets/icons/coin.png");

interface OfferInfo {
  icon: React.ReactNode;
  label: string;
  description: string;
  price: number;
  canAfford: boolean;
  isPurchased: boolean;
}

/**
 * ShopItemPreviewOverlay - Tray overlay showing selected shop offer preview
 *
 * States:
 * - Default (no selection): "Tippe ein Angebot" centered
 * - Selected: Icon + label + description + price in Surface card
 * - Purchased: "Gekauft!" with check icon
 */
export const ShopItemPreviewOverlay: React.FC = () => {
  const selectedShopOffer = useGameStore((s) => s.selectedShopOffer);
  const shopDiceUpgradeType = useGameStore((s) => s.shopDiceUpgradeType);
  const shopItemId = useGameStore((s) => s.shopItemId);
  const money = useGameStore((s) => s.money);
  const handLevels = useGameStore((s) => s.handLevels);
  const ownedItems = useGameStore((s) => s.ownedItems);

  // Calculate offer info based on selection
  const offerInfo = useMemo((): OfferInfo | null => {
    if (!selectedShopOffer) return null;

    switch (selectedShopOffer) {
      case "upgrade": {
        // Hand upgrade - get average hand level for cost calculation
        const avgLevel = Math.floor(
          Object.values(handLevels).reduce((a, b) => a + b, 0) /
            Object.keys(handLevels).length
        );
        const price = getUpgradeCost(avgLevel);
        return {
          icon: <ArrowUp size={32} color={COLORS.mint} strokeWidth={3} />,
          label: "HAND UPGRADE",
          description: "Wähle eine Hand und erhöhe ihre Basispunkte um +5.",
          price,
          canAfford: money >= price,
          isPurchased: false,
        };
      }
      case "dice": {
        if (!shopDiceUpgradeType) return null;
        const price = getDiceUpgradeCost(shopDiceUpgradeType);
        const isPoints = shopDiceUpgradeType === "points";
        return {
          icon: (
            <Image
              source={dieIcon}
              style={styles.iconImage}
              resizeMode="contain"
            />
          ),
          label: isPoints ? "WÜRFEL +PUNKTE" : "WÜRFEL +MULT",
          description: isPoints
            ? "Wähle eine Würfelseite und füge +10 Punkte hinzu."
            : "Wähle eine Würfelseite und füge +1 Mult hinzu.",
          price,
          canAfford: money >= price,
          isPurchased: false,
        };
      }
      case "item": {
        if (!shopItemId) return null;
        const itemDef = getShopItemById(shopItemId);
        if (!itemDef) return null;
        const isPurchased = ownedItems.includes(shopItemId);
        return {
          icon: (
            <Image
              source={ITEM_ICONS[itemDef.id] || ITEM_ICONS.fokus}
              style={styles.iconImage}
              resizeMode="contain"
            />
          ),
          label: itemDef.name.toUpperCase(),
          description: itemDef.description,
          price: itemDef.cost,
          canAfford: money >= itemDef.cost,
          isPurchased,
        };
      }
      default:
        return null;
    }
  }, [
    selectedShopOffer,
    shopDiceUpgradeType,
    shopItemId,
    money,
    handLevels,
    ownedItems,
  ]);

  // Default state - no selection
  if (!selectedShopOffer) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.emptyState}
        >
          <GameText
            variant="bodyLarge"
            color={COLORS.textMuted}
            style={styles.emptyText}
          >
            Tippe ein Angebot
          </GameText>
        </Animated.View>
      </View>
    );
  }

  // Offer not available (e.g., dice upgrade sold out)
  if (!offerInfo) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.emptyState}
        >
          <GameText variant="body" color={COLORS.textMuted}>
            Nicht verfügbar
          </GameText>
        </Animated.View>
      </View>
    );
  }

  // Purchased state
  if (offerInfo.isPurchased) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeInUp.duration(200).springify()}
          exiting={FadeOutDown.duration(150)}
          style={styles.purchasedState}
        >
          <Check size={32} color={COLORS.mint} strokeWidth={3} />
          <GameText variant="displaySmall" color={COLORS.mint}>
            Gekauft!
          </GameText>
        </Animated.View>
      </View>
    );
  }

  // Selected offer preview
  return (
    <View style={styles.container}>
      <Animated.View
        key={selectedShopOffer}
        entering={FadeInUp.duration(200).springify()}
        exiting={FadeOutDown.duration(150)}
        style={styles.cardWrapper}
      >
        <Surface variant="panel" padding="md">
          <View style={styles.contentRow}>
            {/* Icon column */}
            <View style={styles.iconColumn}>
              <InsetSlot padding="sm" style={styles.iconSlot}>
                {offerInfo.icon}
              </InsetSlot>
            </View>

            {/* Info column */}
            <View style={styles.infoColumn}>
              {/* Label */}
              <GameText
                variant="label"
                color={COLORS.text}
                style={styles.label}
              >
                {offerInfo.label}
              </GameText>

              {/* Description */}
              <GameText
                variant="bodySmall"
                color={COLORS.textMuted}
                style={styles.description}
                numberOfLines={3}
              >
                {offerInfo.description}
              </GameText>

              {/* Price row */}
              <View
                style={[
                  styles.priceRow,
                  !offerInfo.canAfford && styles.priceRowMuted,
                ]}
              >
                <Image
                  source={coinIcon}
                  style={styles.coinIcon}
                  resizeMode="contain"
                />
                <GameText
                  variant="body"
                  color={offerInfo.canAfford ? COLORS.gold : COLORS.textMuted}
                >
                  {offerInfo.price}
                </GameText>
              </View>

              {/* Unaffordable hint */}
              {!offerInfo.canAfford && (
                <GameText
                  variant="caption"
                  color={COLORS.coral}
                  style={styles.unaffordableHint}
                >
                  Nicht genug Münzen.
                </GameText>
              )}
            </View>
          </View>
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    maxWidth: "75%",
    alignSelf: "center",
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyText: {
    textShadowColor: COLORS.shadows.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  purchasedState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: SPACING.sm,
  },
  cardWrapper: {
    alignSelf: "stretch",
  },
  contentRow: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "center",
  },
  iconColumn: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoColumn: {
    flex: 1,
    justifyContent: "center",
  },
  iconSlot: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 48,
    height: 48,
  },
  label: {
    textAlign: "left",
    marginBottom: SPACING.xs,
  },
  description: {
    textAlign: "left",
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: SPACING.xs,
  },
  priceRowMuted: {
    opacity: 0.5,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  unaffordableHint: {
    textAlign: "left",
    marginTop: SPACING.xs,
  },
});
