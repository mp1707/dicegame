/**
 * SpecialSection - Displays owned items/relics in the scoring grid
 *
 * Features:
 * - Shows purchased items in InsetSlot containers
 * - Tapping an item opens global ItemDetailModal with description
 * - Shows placeholder when no items owned
 *
 * Note: ItemDetailModal is rendered globally in App.tsx
 */

import React from "react";
import {
  StyleProp,
  StyleSheet,
  ViewStyle,
  View,
  Image,
  Pressable,
} from "react-native";
import { GameText } from "../shared";
import { Surface, InsetSlot } from "../ui-kit";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { useGameStore } from "../../store/gameStore";
import { getShopItemById } from "../../items";
import { triggerSelectionHaptic } from "../../utils/haptics";

// Icon mapping for items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
};

interface SpecialSectionProps {
  style?: StyleProp<ViewStyle>;
}

export const SpecialSection = ({ style }: SpecialSectionProps) => {
  const ownedItems = useGameStore((s) => s.ownedItems);
  const openItemModal = useGameStore((s) => s.openItemModal);

  const handleItemPress = (itemId: string) => {
    triggerSelectionHaptic();
    openItemModal(itemId, false); // false = no purchase CTA (already owned)
  };

  // No items owned - show placeholder
  if (ownedItems.length === 0) {
    return (
      <Surface variant="panel" style={[styles.container, style]}>
        <GameText variant="bodyMedium" color={COLORS.textMuted}>
          Keine Items
        </GameText>
      </Surface>
    );
  }

  return (
    <Surface variant="panel" style={[styles.container, style]}>
      <View style={styles.itemsRow}>
        {ownedItems.map((itemId) => {
          const itemDef = getShopItemById(itemId);
          if (!itemDef) return null;

          return (
            <Pressable
              key={itemId}
              onPress={() => handleItemPress(itemId)}
              style={styles.itemPressable}
            >
              <InsetSlot padding="sm" style={styles.itemSlot}>
                <Image
                  source={ITEM_ICONS[itemId] || ITEM_ICONS.fokus}
                  style={styles.itemIcon}
                />
              </InsetSlot>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  itemsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  itemPressable: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  itemSlot: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
});
