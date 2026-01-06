/**
 * Items Registry - All purchasable items available in the game
 *
 * This module:
 * - Exports all item definitions
 * - Provides helper functions for item management
 * - Maintains the shop item catalog
 */

import type { ItemDefinition } from "../utils/itemDefinitions";
import { FOKUS_ITEM } from "./fokus";

/**
 * All purchasable items in the game
 */
export const SHOP_ITEMS: ItemDefinition[] = [FOKUS_ITEM];

/**
 * Get an item definition by ID
 */
export function getShopItemById(id: string): ItemDefinition | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

/**
 * Get all items available for purchase in the shop at a given level
 */
export function getAvailableShopItems(levelIndex: number): ItemDefinition[] {
  return SHOP_ITEMS.filter((item) => {
    // Legendary items only after level 3
    if (item.rarity === "legendary" && levelIndex < 3) return false;
    return true;
  });
}

// Re-export individual items for convenience
export { FOKUS_ITEM } from "./fokus";
