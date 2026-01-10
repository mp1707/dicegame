import { View, StyleSheet, Pressable, Image, ViewStyle } from "react-native";
import { COLORS, SPACING, DIMENSIONS } from "../../constants/theme";
import { GlassPanel } from "../ui-kit";
import { GameText } from "../shared";
import { useGameStore } from "../../store/gameStore";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { getShopItemById } from "../../items";

// Maximum number of slots
const MAX_ITEM_SLOTS = 5;
const MAX_CONSUMABLE_SLOTS = 2;

// Icon mapping for items
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/skull.png"),
  // Add other item icons here if needed
};

interface ItemRowProps {
  style?: ViewStyle;
}

/**
 * ItemRow - Displays the player's inventory items and consumables
 *
 * Layout: [■][■][■][■][■] 0/5 │ [○][○] 0/2
 * - 5 item slots with X/5 counter
 * - 2 consumable placeholder slots with 0/2 counter
 */
export const ItemRow: React.FC<ItemRowProps> = ({ style }) => {
  const ownedItems = useGameStore((s) => s.ownedItems);
  const openItemModal = useGameStore((s) => s.openItemModal);

  // Handle item tap
  const handleItemPress = (itemId: string) => {
    triggerSelectionHaptic();
    openItemModal(itemId, false);
  };

  // Create array of item slots
  const itemSlots: (string | null)[] = Array.from(
    { length: MAX_ITEM_SLOTS },
    (_, i) => (i < ownedItems.length ? ownedItems[i] : null)
  );

  // Consumable slots (placeholder only - no store support yet)
  const consumableSlots: null[] = Array.from(
    { length: MAX_CONSUMABLE_SLOTS },
    () => null
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {/* Items Section */}
        <View style={styles.slotsSection}>
          {itemSlots.map((itemId, index) => {
            const isEmpty = !itemId;

            return (
              <View key={itemId || `item-${index}`} style={styles.slot}>
                {isEmpty ? (
                  <GlassPanel style={styles.slotInset} />
                ) : (
                  <Pressable
                    onPress={() => handleItemPress(itemId)}
                    style={styles.slotPressable}
                  >
                    <GlassPanel style={styles.slotInset}>
                      <Image
                        source={ITEM_ICONS[itemId] || ITEM_ICONS.fokus}
                        style={styles.slotIcon}
                      />
                    </GlassPanel>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Items Counter */}
        <GameText variant="labelSmall" color={COLORS.textMuted}>
          {ownedItems.length}/{MAX_ITEM_SLOTS}
        </GameText>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Consumables Section (Placeholder) */}
        <View style={styles.slotsSection}>
          {consumableSlots.map((_, index) => (
            <View key={`consumable-${index}`} style={styles.slot}>
              <GlassPanel style={styles.slotInset} />
            </View>
          ))}
        </View>

        {/* Consumables Counter */}
        <GameText variant="labelSmall" color={COLORS.textMuted}>
          0/{MAX_CONSUMABLE_SLOTS}
        </GameText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  slotsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
  },
  slot: {
    alignItems: "center",
  },
  slotPressable: {
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  slotInset: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  slotIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.overlays.whiteMild,
    marginHorizontal: SPACING.xs,
  },
});
