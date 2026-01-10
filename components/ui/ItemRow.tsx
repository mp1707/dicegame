import { View, StyleSheet, Pressable, Image, ViewStyle } from "react-native";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { GlassPanel } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { getShopItemById } from "../../items";

// Maximum number of item slots
const MAX_ITEM_SLOTS = 5;

// Icon mapping for items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
  // Add other item icons here if needed, or rely on dynamic loading if implemented
};

interface ItemRowProps {
  style?: ViewStyle;
}

/**
 * ItemRow - Displays the player's inventory items
 *
 * Extracted from ScorePanel.
 * Row: "Inventar" label + 5 item slots.
 */
export const ItemRow: React.FC<ItemRowProps> = ({ style }) => {
  const ownedItems = useGameStore((s) => s.ownedItems);
  const openItemModal = useGameStore((s) => s.openItemModal);

  // Handle item tap
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
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {/* Left: Label */}
        <View style={styles.leftSection}>
          <GameText variant="displaySmall" color={COLORS.text}>
            Inventar
          </GameText>
        </View>

        {/* Right: 5 Item Slots */}
        <View style={styles.itemSlotsContainer}>
          {slots.map((itemId, index) => {
            const itemDef = itemId ? getShopItemById(itemId) : null;
            const isEmpty = !itemId;

            return (
              <View key={itemId || `empty-${index}`} style={styles.itemSlot}>
                {isEmpty ? (
                  <GlassPanel style={styles.itemSlotInset}>
                    {/* Empty slot placeholder */}
                  </GlassPanel>
                ) : (
                  <Pressable
                    onPress={() => handleItemPress(itemId)}
                    style={styles.itemPressable}
                  >
                    <GlassPanel style={styles.itemSlotInset}>
                      <Image
                        source={ITEM_ICONS[itemId] || ITEM_ICONS.fokus}
                        style={styles.itemIcon}
                      />
                    </GlassPanel>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Fill allocated height from parent
    overflow: "hidden", // Prevent content overflow
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "45%", // Fixed percentage ensures consistent alignment
  },
  itemSlotsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemSlot: {
    alignItems: "center",
    gap: 2,
  },
  itemPressable: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  itemSlotInset: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  itemLabel: {
    textAlign: "center",
    maxWidth: 36,
  },
});
