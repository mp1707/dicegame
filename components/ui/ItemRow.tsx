import { View, StyleSheet, Pressable, Image, ViewStyle } from "react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { Surface } from "../pixel-ui-kit/Surface";
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
        {/* Items Section with Counter Below */}
        <View style={styles.slotGroup}>
          <View style={styles.slotsSection}>
            {itemSlots.map((itemId, index) => {
              const isEmpty = !itemId;

              return (
                <View key={itemId || `item-${index}`} style={styles.slot}>
                  {isEmpty ? (
                    <Surface
                      tintColor="#000000"
                      opacity={0.3}
                      padding={0}
                      style={styles.slotInset}
                    />
                  ) : (
                    <Pressable
                      onPress={() => handleItemPress(itemId)}
                      style={styles.slotPressable}
                    >
                      <Surface
                        tintColor="#000000"
                        opacity={0.3}
                        padding={0}
                        style={styles.slotInset}
                      >
                        <Image
                          source={ITEM_ICONS[itemId] || ITEM_ICONS.fokus}
                          style={styles.slotIcon}
                        />
                      </Surface>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
          {/* Items Counter - Below and Right-Aligned */}
          <GameText
            variant="labelSmall"
            color={COLORS.textMuted}
            style={styles.counter}
          >
            {ownedItems.length}/{MAX_ITEM_SLOTS}
          </GameText>
        </View>

        {/* Consumables Section with Counter Below */}
        <View style={styles.slotGroup}>
          <View style={styles.slotsSection}>
            {consumableSlots.map((_, index) => (
              <View key={`consumable-${index}`} style={styles.slot}>
                <Surface
                  tintColor="#000000"
                  opacity={0.3}
                  padding={0}
                  style={styles.slotInset}
                />
              </View>
            ))}
          </View>
          {/* Consumables Counter - Below and Right-Aligned */}
          <GameText
            variant="labelSmall"
            color={COLORS.textMuted}
            style={styles.counter}
          >
            0/{MAX_CONSUMABLE_SLOTS}
          </GameText>
        </View>
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
    alignItems: "flex-start",
    justifyContent: "center",
    gap: SPACING.xl * 2, // Gap between items and consumables groups
  },
  slotGroup: {
    alignItems: "flex-end", // Counter right-aligned below slots
  },
  slotsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md, // Increased gap between slots
  },
  slot: {
    alignItems: "center",
  },
  slotPressable: {
    // borderRadius removed as Surface handles corners
  },
  slotInset: {
    width: 40, // Increased from 28
    height: 40, // Increased from 28
    alignItems: "center",
    justifyContent: "center",
  },
  slotIcon: {
    width: 28, // Increased from 14
    height: 28, // Increased from 14
    resizeMode: "contain",
  },
  counter: {
    marginTop: SPACING.xs, // Space between slots and counter
  },
});
