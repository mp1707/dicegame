/**
 * Item Definitions - Central registry for all game items/relics
 *
 * This module defines:
 * - Item configuration types
 * - Item catalog (all available items)
 * - Item factory functions
 *
 * Each item follows the semantic grammar:
 * WANN (Trigger) → WENN (Condition) → WAS (Effect) → WIE OFT (Limit)
 */

import type {
  TriggerType,
  TriggerCondition,
  TriggerHandler,
  ItemLimiter,
  RegisteredItem,
  ItemTriggerSubscription,
} from "./itemTriggers";
import {
  hasDiceValue,
  countDiceValue,
  countLockedDice,
  isFirstRoll,
  isLastRoll,
} from "./itemTriggers";
import {
  addBonusPoints,
  addBonusMult,
  multiplyMult,
  addMoney,
  addPointsPerLockedDie,
  addMultPerDieValue,
  addInterest,
  grantExtraRolls,
} from "./itemEffects";

// ─────────────────────────────────────────────────────────────────────────────
// Item Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Item rarity tiers
 */
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

/**
 * Item definition - blueprint for creating RegisteredItems
 */
export interface ItemDefinition {
  id: string;
  name: string;
  /** German description following the trigger grammar */
  description: string;
  rarity: ItemRarity;
  /** Shop cost (0 = free/given at start) */
  cost: number;
  /** Icon asset name (from assets/items/) */
  icon: string;
  /** Trigger subscriptions for this item */
  triggers: Array<{
    triggerId: TriggerType;
    condition?: TriggerCondition;
    handler: TriggerHandler;
    priority?: number;
  }>;
  /** Usage limits */
  limiter?: ItemLimiter;
  /** Initial charges (if limiter is charges-based) */
  initialCharges?: number;
}

/**
 * Item catalog entry with additional metadata
 */
export interface CatalogItem extends ItemDefinition {
  /** Whether this item can appear in shops */
  shopSpawnable: boolean;
  /** Weight for shop spawning (higher = more common) */
  spawnWeight: number;
  /** Tags for filtering/synergy detection */
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a RegisteredItem from an ItemDefinition
 */
export function createRegisteredItem(
  definition: ItemDefinition
): RegisteredItem {
  const subscriptions: ItemTriggerSubscription[] = definition.triggers.map(
    (trigger) => ({
      triggerId: trigger.triggerId,
      condition: trigger.condition,
      handler: trigger.handler,
      priority: trigger.priority,
    })
  );

  return {
    id: definition.id,
    name: definition.name,
    subscriptions,
    usageThisHand: 0,
    usageThisLevel: 0,
    usageThisShop: 0,
    chargesRemaining: definition.initialCharges ?? 0,
    cooldownHandsRemaining: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Example Item Definitions (Templates)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example items demonstrating the trigger system.
 * These serve as templates for implementing real items.
 */
export const EXAMPLE_ITEMS: ItemDefinition[] = [
  // ─────────────────────────────────────────────────────────────────
  // Scoring Items
  // ─────────────────────────────────────────────────────────────────
  {
    id: "lucky_six",
    name: "Glückliche Sechs",
    description: "Beim Zählen pro Würfel: Jeder 6er gibt +5 Punkte.",
    rarity: "common",
    cost: 5,
    icon: "dice_six_gold.png",
    triggers: [
      {
        triggerId: "SCORE_PER_DIE",
        condition: (ctx) => ctx.currentDieValue === 6,
        handler: addBonusPoints(5),
      },
    ],
  },
  {
    id: "snake_eyes",
    name: "Schlangenaugen",
    description: "Nach der Wertung: Wenn genau 2 Einsen geworfen, +1 Mult.",
    rarity: "uncommon",
    cost: 7,
    icon: "snake.png",
    triggers: [
      {
        triggerId: "SCORE_APPLIED",
        condition: (ctx) => countDiceValue(ctx, 1) === 2,
        handler: addBonusMult(1),
      },
    ],
  },
  {
    id: "full_lock",
    name: "Volle Sperre",
    description: "Vor der Wertung: +10 Punkte pro gesperrtem Würfel.",
    rarity: "uncommon",
    cost: 8,
    icon: "padlock.png",
    triggers: [
      {
        triggerId: "SCORE_PRECALC",
        handler: addPointsPerLockedDie(10),
      },
    ],
  },
  {
    id: "six_shooter",
    name: "Sechserschütze",
    description: "Vor der Wertung: +2 Mult pro 6er in der Hand.",
    rarity: "rare",
    cost: 12,
    icon: "revolver.png",
    triggers: [
      {
        triggerId: "SCORE_PRECALC",
        handler: addMultPerDieValue(6, 2),
      },
    ],
  },
  {
    id: "double_down",
    name: "Double Down",
    description: "Vor der Wertung: Wenn Full House, Mult ×2.",
    rarity: "rare",
    cost: 15,
    icon: "cards_double.png",
    triggers: [
      {
        triggerId: "SCORE_PRECALC",
        condition: (ctx) => ctx.selectedHandId === "fullHouse",
        handler: multiplyMult(2),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Roll Manipulation Items
  // ─────────────────────────────────────────────────────────────────
  {
    id: "first_timer",
    name: "Erstlingsglück",
    description: "Beim ersten Wurf jeder Hand: +1 Mult. (1× pro Hand)",
    rarity: "common",
    cost: 4,
    icon: "star_first.png",
    triggers: [
      {
        triggerId: "ROLL_SETTLED",
        condition: isFirstRoll,
        handler: addBonusMult(1),
      },
    ],
    limiter: { type: "perHand", count: 1 },
  },
  {
    id: "last_chance",
    name: "Letzte Chance",
    description: "Beim letzten Wurf jeder Hand: +20 Punkte.",
    rarity: "common",
    cost: 5,
    icon: "hourglass.png",
    triggers: [
      {
        triggerId: "ROLL_SETTLED",
        condition: isLastRoll,
        handler: addBonusPoints(20),
      },
    ],
  },
  {
    id: "extra_spin",
    name: "Extradrehung",
    description: "Beim Start eines Levels: +1 Wurf pro Hand.",
    rarity: "rare",
    cost: 20,
    icon: "arrows_rotate.png",
    triggers: [
      {
        triggerId: "LEVEL_START",
        handler: grantExtraRolls(1),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Economy Items
  // ─────────────────────────────────────────────────────────────────
  {
    id: "piggy_bank",
    name: "Sparschwein",
    description: "Beim Betreten des Shops: +2$ pro 5$ (max 10$).",
    rarity: "uncommon",
    cost: 8,
    icon: "piggy.png",
    triggers: [
      {
        triggerId: "SHOP_ENTER",
        handler: addInterest(0.4, 10),
      },
    ],
  },
  {
    id: "tip_jar",
    name: "Trinkgeldglas",
    description: "Nach jeder gewerteten Hand: +1$.",
    rarity: "common",
    cost: 6,
    icon: "jar_coins.png",
    triggers: [
      {
        triggerId: "HAND_SCORED",
        handler: addMoney(1),
      },
    ],
  },
  {
    id: "winning_streak",
    name: "Siegesserie",
    description: "Beim Erreichen des Ziels: +5$.",
    rarity: "uncommon",
    cost: 10,
    icon: "trophy_gold.png",
    triggers: [
      {
        triggerId: "LEVEL_WON",
        handler: addMoney(5),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Run-defining Items
  // ─────────────────────────────────────────────────────────────────
  {
    id: "sixes_build",
    name: "Sechser-Baum",
    description: "Beim Start eines Runs: Jeder 6er zählt als zwei.",
    rarity: "legendary",
    cost: 30,
    icon: "tree_six.png",
    triggers: [
      {
        triggerId: "RUN_START",
        // This would need special handling in scoring - marked for future implementation
        handler: (_ctx, _effects) => {
          // Mark a flag for special 6er handling in scoring
          console.log("[Item] Sechser-Baum active - 6ers count double");
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Item Catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full item catalog with spawn metadata
 */
export const ITEM_CATALOG: Map<string, CatalogItem> = new Map(
  EXAMPLE_ITEMS.map((item) => [
    item.id,
    {
      ...item,
      shopSpawnable: item.cost > 0,
      spawnWeight: getSpawnWeightForRarity(item.rarity),
      tags: getTagsForItem(item),
    },
  ])
);

/**
 * Get spawn weight based on rarity
 */
function getSpawnWeightForRarity(rarity: ItemRarity): number {
  switch (rarity) {
    case "common":
      return 100;
    case "uncommon":
      return 50;
    case "rare":
      return 20;
    case "legendary":
      return 5;
    default:
      return 0;
  }
}

/**
 * Auto-generate tags from item definition
 */
function getTagsForItem(item: ItemDefinition): string[] {
  const tags: string[] = [];

  // Tag by trigger family
  for (const trigger of item.triggers) {
    if (trigger.triggerId.includes("SCORE")) tags.push("scoring");
    if (trigger.triggerId.includes("ROLL")) tags.push("roll");
    if (
      trigger.triggerId.includes("SHOP") ||
      trigger.triggerId.includes("MONEY")
    )
      tags.push("economy");
    if (trigger.triggerId.includes("LEVEL")) tags.push("level");
    if (trigger.triggerId.includes("HAND")) tags.push("hand");
    if (trigger.triggerId.includes("RUN")) tags.push("run");
  }

  // Tag by rarity
  tags.push(item.rarity);

  // Deduplicate using filter
  return tags.filter((tag, index) => tags.indexOf(tag) === index);
}

/**
 * Get all items that can spawn in shops for a given level
 */
export function getShopSpawnableItems(levelIndex: number): CatalogItem[] {
  const items: CatalogItem[] = [];

  Array.from(ITEM_CATALOG.values()).forEach((item) => {
    if (!item.shopSpawnable) return;

    // Legendary items only spawn after level 3
    if (item.rarity === "legendary" && levelIndex < 3) return;

    items.push(item);
  });

  return items;
}

/**
 * Get a random item from the catalog based on spawn weights
 */
export function getRandomShopItem(levelIndex: number): CatalogItem | null {
  const spawnableItems = getShopSpawnableItems(levelIndex);
  if (spawnableItems.length === 0) return null;

  const totalWeight = spawnableItems.reduce(
    (sum, item) => sum + item.spawnWeight,
    0
  );
  let roll = Math.random() * totalWeight;

  for (const item of spawnableItems) {
    roll -= item.spawnWeight;
    if (roll <= 0) return item;
  }

  return spawnableItems[spawnableItems.length - 1];
}

/**
 * Get item definition by ID
 */
export function getItemById(id: string): CatalogItem | undefined {
  return ITEM_CATALOG.get(id);
}
