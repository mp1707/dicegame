/**
 * Item Effects System - Effect application and types for roguelike items
 *
 * This module defines:
 * - Effect categories (what an item is allowed to do)
 * - Effect applicators (how effects modify game state)
 * - Common effect factories (reusable effect builders)
 */

import type {
  EffectContext,
  TriggerContext,
  TriggerHandler,
} from "./itemTriggers";

// ─────────────────────────────────────────────────────────────────────────────
// Effect Categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effect category types - constrained set of what items can do
 * Maps cleanly to the scoring formula: (basePoints + pips + bonusPoints) × (mult + bonusMult)
 */
export type EffectCategory =
  // Scoring math
  | "ADD_POINTS" // +Punkte (adds to bonusPoints)
  | "ADD_PIPS" // +Pips (virtual pip count)
  | "ADD_BONUS_POINTS" // +BonusPunkte (same as enhancement bonuses)
  | "ADD_BONUS_MULT" // +BonusMult (same as enhancement bonuses)
  | "ADD_MULT" // +Mult (pre-multiplication)
  | "MULTIPLY_MULT" // ×Mult (multiplicative modifier)
  // Roll manipulation
  | "EXTRA_ROLL" // Grant additional roll
  | "REFUND_ROLL" // Don't consume the roll
  | "SET_DIE_VALUE" // Set a die to specific value
  | "BUMP_DIE_VALUE" // +1 to a die (max 6)
  | "REROLL_DICE" // Force reroll of specific dice
  // Lock manipulation
  | "LOCK_DIE" // Lock a die
  | "UNLOCK_DIE" // Unlock a die
  | "FREE_LOCK" // Lock without costing a roll
  // Economy
  | "ADD_MONEY" // +Geld
  | "DISCOUNT" // Reduce shop price
  | "INTEREST" // Gain money based on current money
  | "CASHBACK" // Refund percentage of purchase
  // Meta progression
  | "UPGRADE_HAND" // Increase hand level
  | "ADD_ENHANCEMENT"; // Add pip enhancement to a die face

// ─────────────────────────────────────────────────────────────────────────────
// Effect Factories - Reusable effect builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a handler that adds bonus points
 */
export function addBonusPoints(amount: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.bonusPoints += amount;
  };
}

/**
 * Create a handler that adds bonus mult
 */
export function addBonusMult(amount: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.bonusMult += amount;
  };
}

/**
 * Create a handler that multiplies the mult
 */
export function multiplyMult(factor: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.multMultiplier *= factor;
  };
}

/**
 * Create a handler that grants extra rolls
 */
export function grantExtraRolls(count: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.extraRolls += count;
  };
}

/**
 * Create a handler that refunds the current roll
 */
export function refundRoll(): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.refundRoll = true;
  };
}

/**
 * Create a handler that adds/removes money
 */
export function addMoney(amount: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.moneyChange += amount;
  };
}

/**
 * Create a handler that upgrades a hand level
 */
export function upgradeHandLevel(
  handId: string,
  amount: number = 1
): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.handLevelChanges.push({ handId, change: amount });
  };
}

/**
 * Create a handler that applies a shop discount
 */
export function applyDiscount(itemId: string, amount: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.discounts.push({ itemId, amount });
  };
}

/**
 * Create a handler that bumps a die value
 */
export function bumpDie(dieIndex: number, amount: number = 1): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.diceModifications.push({ index: dieIndex, bump: amount });
  };
}

/**
 * Create a handler that sets a die to a specific value
 */
export function setDieValue(dieIndex: number, value: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.diceModifications.push({ index: dieIndex, newValue: value });
  };
}

/**
 * Create a handler that locks a die
 */
export function lockDie(dieIndex: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.lockChanges.push({ index: dieIndex, shouldLock: true });
  };
}

/**
 * Create a handler that unlocks a die
 */
export function unlockDie(dieIndex: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    effects.lockChanges.push({ index: dieIndex, shouldLock: false });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scaling Effect Factories - Effects that scale with context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add bonus points per locked die
 */
export function addPointsPerLockedDie(pointsPerDie: number): TriggerHandler {
  return (context: TriggerContext, effects: EffectContext) => {
    const lockedCount = context.lockedMask.filter((l) => l).length;
    effects.bonusPoints += pointsPerDie * lockedCount;
  };
}

/**
 * Add bonus mult per die with value X
 */
export function addMultPerDieValue(
  targetValue: number,
  multPerDie: number
): TriggerHandler {
  return (context: TriggerContext, effects: EffectContext) => {
    const count = context.diceValues.filter((v) => v === targetValue).length;
    effects.bonusMult += multPerDie * count;
  };
}

/**
 * Add bonus points per die with value X
 */
export function addPointsPerDieValue(
  targetValue: number,
  pointsPerDie: number
): TriggerHandler {
  return (context: TriggerContext, effects: EffectContext) => {
    const count = context.diceValues.filter((v) => v === targetValue).length;
    effects.bonusPoints += pointsPerDie * count;
  };
}

/**
 * Add bonus mult per hand level of selected hand
 */
export function addMultPerHandLevel(multPerLevel: number): TriggerHandler {
  return (_context: TriggerContext, effects: EffectContext) => {
    // Note: This would need handLevels in context to work properly
    // For now, just a placeholder - will be enhanced when we have full integration
    effects.bonusMult += multPerLevel; // Per level logic TBD
  };
}

/**
 * Add interest (money based on current money)
 */
export function addInterest(rate: number, cap: number = 25): TriggerHandler {
  return (context: TriggerContext, effects: EffectContext) => {
    const interest = Math.min(Math.floor(context.money * rate), cap);
    effects.moneyChange += interest;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Effect Applicator - Applies accumulated effects to game state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of applying effects to game state
 * Used by gameStore to update state
 */
export interface AppliedEffects {
  // Scoring adjustments
  additionalBonusPoints: number;
  additionalBonusMult: number;
  multMultiplier: number;

  // Roll adjustments
  rollsToAdd: number;
  shouldRefundRoll: boolean;

  // Dice state changes
  newDiceValues?: number[];
  newLockedMask?: boolean[];

  // Money change
  moneyDelta: number;

  // Hand level changes
  handLevelDeltas: Record<string, number>;

  // Shop discounts
  activeDiscounts: Record<string, number>;

  // Action control
  shouldCancelAction: boolean;
}

/**
 * Apply effect context to produce concrete state changes
 */
export function applyEffects(
  effects: EffectContext,
  currentDiceValues: number[],
  currentLockedMask: boolean[]
): AppliedEffects {
  // Start with current state
  const newDiceValues = [...currentDiceValues];
  const newLockedMask = [...currentLockedMask];

  // Apply dice modifications
  for (const mod of effects.diceModifications) {
    if (mod.newValue !== undefined) {
      newDiceValues[mod.index] = Math.max(1, Math.min(6, mod.newValue));
    }
    if (mod.bump !== undefined) {
      newDiceValues[mod.index] = Math.max(
        1,
        Math.min(6, newDiceValues[mod.index] + mod.bump)
      );
    }
  }

  // Apply lock changes
  for (const change of effects.lockChanges) {
    newLockedMask[change.index] = change.shouldLock;
  }

  // Aggregate hand level changes
  const handLevelDeltas: Record<string, number> = {};
  for (const change of effects.handLevelChanges) {
    handLevelDeltas[change.handId] =
      (handLevelDeltas[change.handId] ?? 0) + change.change;
  }

  // Aggregate discounts
  const activeDiscounts: Record<string, number> = {};
  for (const discount of effects.discounts) {
    activeDiscounts[discount.itemId] =
      (activeDiscounts[discount.itemId] ?? 0) + discount.amount;
  }

  return {
    additionalBonusPoints: effects.bonusPoints,
    additionalBonusMult: effects.bonusMult,
    multMultiplier: effects.multMultiplier,
    rollsToAdd: effects.extraRolls,
    shouldRefundRoll: effects.refundRoll,
    newDiceValues:
      effects.diceModifications.length > 0 ? newDiceValues : undefined,
    newLockedMask: effects.lockChanges.length > 0 ? newLockedMask : undefined,
    moneyDelta: effects.moneyChange,
    handLevelDeltas,
    activeDiscounts,
    shouldCancelAction: effects.cancelAction,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Display Helpers - Format effects for UI copy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a bonus points effect as German text
 */
export function formatPointsEffect(amount: number): string {
  return amount > 0 ? `+${amount} Punkte` : `${amount} Punkte`;
}

/**
 * Format a bonus mult effect as German text
 */
export function formatMultEffect(amount: number): string {
  return amount > 0 ? `+${amount} Mult` : `${amount} Mult`;
}

/**
 * Format a money effect as German text
 */
export function formatMoneyEffect(amount: number): string {
  return amount > 0 ? `+${amount}$` : `${amount}$`;
}

/**
 * Format a mult multiplier as German text
 */
export function formatMultMultiplier(factor: number): string {
  return `×${factor} Mult`;
}
