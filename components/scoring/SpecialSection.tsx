/**
 * SpecialSection - Displays 5 dedicated item slots in the scoring grid
 *
 * Features:
 * - Always shows 5 InsetSlot containers (inventory capacity)
 * - Empty slots display "leer" label
 * - Filled slots show item icon and name
 * - Tapping an item opens global ItemDetailModal with description
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

// Maximum number of item slots
const MAX_ITEM_SLOTS = 5;

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

  // Create array of 5 slots, filled with owned items or null for empty
  const slots: (string | null)[] = Array.from(
    { length: MAX_ITEM_SLOTS },
    (_, i) => (i < ownedItems.length ? ownedItems[i] : null)
  );

  return (
    <Surface variant="panel" style={[styles.container, style]}>
      <View style={styles.itemsRow}>
        {slots.map((itemId, index) => {
          const itemDef = itemId ? getShopItemById(itemId) : null;
          const isEmpty = !itemId;

          return (
            <View key={itemId || `empty-${index}`} style={styles.slotContainer}>
              {isEmpty ? (
                <InsetSlot padding="sm" style={styles.itemSlot}>
                  {/* Empty slot */}
                </InsetSlot>
              ) : (
                <Pressable
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
              )}
              <GameText
                variant="labelSmall"
                color={isEmpty ? COLORS.textMuted : COLORS.text}
                style={styles.slotLabel}
              >
                {isEmpty ? "leer" : itemDef?.name || itemId}
              </GameText>
            </View>
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
    alignItems: "flex-start",
    justifyContent: "space-evenly",
    width: "100%",
  },
  slotContainer: {
    alignItems: "center",
    gap: SPACING.xs,
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
  slotLabel: {
    textAlign: "center",
    maxWidth: 50,
  },
});
