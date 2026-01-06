/**
 * Item System - Barrel exports for the item/relic trigger system
 *
 * Usage:
 * ```typescript
 * import {
 *   // Trigger system
 *   TriggerType,
 *   emitTrigger,
 *   registerItem,
 *   buildTriggerContext,
 *
 *   // Effects
 *   addBonusPoints,
 *   addBonusMult,
 *   applyEffects,
 *
 *   // Item definitions
 *   ITEM_CATALOG,
 *   createRegisteredItem,
 * } from '../utils/itemSystem';
 * ```
 */

// Trigger system
export {
  // Types
  type TriggerType,
  type RunTrigger,
  type LevelTrigger,
  type HandTrigger,
  type RollTrigger,
  type ScoringTrigger,
  type EconomyTrigger,
  type TriggerContext,
  type EffectContext,
  type TriggerHandler,
  type TriggerCondition,
  type ItemTriggerSubscription,
  type RegisteredItem,
  type DiceSelector,
  type HandSelector,
  type ItemLimiter,
  type GameStateSnapshot,
  // Constants
  TRIGGER_FAMILIES,
  // Functions
  emitTrigger,
  registerItem,
  unregisterItem,
  clearAllItems,
  getRegisteredItems,
  resetHandUsage,
  resetLevelUsage,
  resetShopUsage,
  tickCooldowns,
  buildTriggerContext,
  createEffectContext,
  // Condition helpers
  hasDiceValue,
  countDiceValue,
  countLockedDice,
  isFirstRoll,
  isLastRoll,
  isHandSelected,
  isUpperHandSelected,
  isLowerHandSelected,
} from "./itemTriggers";

// Effect system
export {
  // Types
  type EffectCategory,
  type AppliedEffects,
  // Effect factories
  addBonusPoints,
  addBonusMult,
  multiplyMult,
  grantExtraRolls,
  refundRoll,
  addMoney,
  upgradeHandLevel,
  applyDiscount,
  bumpDie,
  setDieValue,
  lockDie,
  unlockDie,
  // Scaling effects
  addPointsPerLockedDie,
  addMultPerDieValue,
  addPointsPerDieValue,
  addMultPerHandLevel,
  addInterest,
  // Effect application
  applyEffects,
  // Display helpers
  formatPointsEffect,
  formatMultEffect,
  formatMoneyEffect,
  formatMultMultiplier,
} from "./itemEffects";

// Item definitions
export {
  // Types
  type ItemRarity,
  type ItemDefinition,
  type CatalogItem,
  // Factory
  createRegisteredItem,
  // Catalog
  ITEM_CATALOG,
  EXAMPLE_ITEMS,
  getShopSpawnableItems,
  getRandomShopItem,
  getItemById,
} from "./itemDefinitions";
