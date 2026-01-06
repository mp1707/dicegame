/**
 * Item Trigger System - Event-driven triggers for roguelike items/relics
 *
 * Based on the Balatro-style item grammar:
 * WANN (Trigger) → WENN (Condition) → WAS (Effect) → WIE OFT (Limit)
 *
 * This module defines:
 * - Trigger event IDs and families
 * - Event context (payload) structure
 * - Event emitter for dispatching triggers
 * - Subscriber registration for items
 */

import type { ScoringBreakdown, DieEnhancement } from "./gameCore";
import type { GamePhase } from "../store/gameStore";

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Event IDs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run triggers (meta-level)
 * Beim Start/Ende eines Runs, Item Gain/Loss
 */
export type RunTrigger =
  | "RUN_START" // Beim Start eines Runs
  | "RUN_END" // Beim Ende eines Runs (Win/Lose)
  | "ITEM_GAINED" // Beim Erhalten eines Relikts
  | "ITEM_REMOVED"; // Beim Verlieren/Entfernen eines Relikts

/**
 * Level triggers (between rounds)
 * Aligned with level lifecycle
 */
export type LevelTrigger =
  | "LEVEL_START" // Beim Start eines Levels
  | "LEVEL_WON" // Beim Erreichen des Ziels (moment win is detected)
  | "LEVEL_RESULT_ENTER" // Beim Wechsel zur Belohnung (enter result phase)
  | "SHOP_ENTER" // Beim Betreten des Shops
  | "SHOP_EXIT"; // Beim Verlassen des Shops / Nächstes Level

/**
 * Hand triggers (hand attempt inside level)
 * Tied to rollsRemaining, hasRolledThisHand
 */
export type HandTrigger =
  | "HAND_START" // Beim Start einer Hand (before any roll)
  | "HAND_FIRST_ROLL_START" // Beim ersten Wurf einer Hand
  | "HAND_LAST_ROLL_START" // Beim letzten Wurf einer Hand (rollsRemaining = 1)
  | "HAND_ACCEPTED" // Wenn die Hand angenommen wird (commit)
  | "HAND_SCORED"; // Nachdem die Hand gewertet wurde (after finalizeHand)

/**
 * Roll triggers (dice physics / values)
 * Tightly defined for precise timing
 */
export type RollTrigger =
  | "ROLL_COMMIT" // Vor dem Wurf (player presses ROLL, before physics)
  | "ROLL_SETTLED" // Nach dem Wurf (dice settle, values final)
  | "DIE_LOCK_TOGGLED"; // Wenn ein Würfel gesperrt/entsperrt wird

/**
 * Scoring triggers (the "Balatro moment")
 * During scoring calculation and reveal
 */
export type ScoringTrigger =
  | "SCORE_PRECALC" // Vor der Wertung (before getScoringBreakdown)
  | "SCORE_PER_DIE" // Beim Zählen pro Würfel (for each contributing die)
  | "SCORE_APPLIED"; // Nach der Wertung (after score applied to total)

/**
 * Economy / shop triggers
 * Money and purchase events
 */
export type EconomyTrigger =
  | "SHOP_GENERATE_OFFER" // Beim Anzeigen des Shops (generate items)
  | "SHOP_PURCHASE" // Beim Kaufen eines Items
  | "MONEY_GAIN" // Wenn Geld erhalten wird
  | "MONEY_SPEND"; // Wenn Geld ausgegeben wird

/**
 * All trigger types combined
 */
export type TriggerType =
  | RunTrigger
  | LevelTrigger
  | HandTrigger
  | RollTrigger
  | ScoringTrigger
  | EconomyTrigger;

/**
 * Trigger family groupings (for documentation/validation)
 */
export const TRIGGER_FAMILIES = {
  run: ["RUN_START", "RUN_END", "ITEM_GAINED", "ITEM_REMOVED"] as const,
  level: [
    "LEVEL_START",
    "LEVEL_WON",
    "LEVEL_RESULT_ENTER",
    "SHOP_ENTER",
    "SHOP_EXIT",
  ] as const,
  hand: [
    "HAND_START",
    "HAND_FIRST_ROLL_START",
    "HAND_LAST_ROLL_START",
    "HAND_ACCEPTED",
    "HAND_SCORED",
  ] as const,
  roll: ["ROLL_COMMIT", "ROLL_SETTLED", "DIE_LOCK_TOGGLED"] as const,
  scoring: ["SCORE_PRECALC", "SCORE_PER_DIE", "SCORE_APPLIED"] as const,
  economy: [
    "SHOP_GENERATE_OFFER",
    "SHOP_PURCHASE",
    "MONEY_GAIN",
    "MONEY_SPEND",
  ] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Event Context (Payload)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard selectors for targeting dice
 */
export type DiceSelector =
  | "all" // Alle Würfel
  | "locked" // Gesperrte Würfel
  | "unlocked" // Ungesperrte Würfel
  | "random" // Zufälliger Würfel
  | "highest" // Höchster Würfel
  | "lowest" // Niedrigster Würfel
  | { value: number } // Würfel mit Wert X
  | "contributing"; // Beitragende Würfel (from scoring)

/**
 * Standard selectors for targeting hands
 */
export type HandSelector =
  | "selected" // Gewählte Hand (selectedHandId)
  | "upper" // Oberer Block
  | "lower" // Unterer Block
  | { handId: string }; // Bestimmte Hand

/**
 * Limiter types for frequency control
 */
export type ItemLimiter =
  | { type: "perHand"; count: number } // X× pro Hand
  | { type: "perLevel"; count: number } // X× pro Level
  | { type: "perShop"; count: number } // X× pro Shop
  | { type: "charges"; count: number } // X Ladungen (then inert)
  | { type: "cooldown"; hands: number } // Abklingzeit: N Hände
  | { type: "scaling"; per: string }; // Skalierung: "pro gesperrtem Würfel", etc.

/**
 * Event context passed to all trigger handlers
 * Contains complete game state snapshot for item evaluation
 */
export interface TriggerContext {
  // Phase and level info
  phase: GamePhase;
  currentLevelIndex: number;

  // Economy
  money: number;

  // Level progress
  levelScore: number;
  levelGoal: number;
  handsRemaining: number;

  // Hand attempt state
  rollsRemaining: number;
  hasRolledThisHand: boolean;

  // Dice state
  diceValues: number[]; // [5] current face values
  lockedMask: boolean[]; // [5] which dice are locked

  // Hand selection
  selectedHandId: string | null;

  // Enhancements (pip states)
  enhancements: DieEnhancement[];

  // Scoring context (only for scoring events)
  breakdown?: ScoringBreakdown;
  contributingIndices?: number[]; // Indices of dice that contribute to scoring

  // Per-die context (only for SCORE_PER_DIE)
  currentDieIndex?: number;
  currentDieValue?: number;

  // Economy context (only for economy events)
  moneyDelta?: number; // Amount gained/spent
  purchasedItemId?: string;

  // Item context (only for ITEM_GAINED/ITEM_REMOVED)
  itemId?: string;

  // Lock context (only for DIE_LOCK_TOGGLED)
  toggledDieIndex?: number;
  isNowLocked?: boolean;
}

/**
 * Mutable context for effects that modify game state
 * Effects write to this, then the store applies changes
 */
export interface EffectContext {
  // Scoring modifiers (additive)
  bonusPoints: number; // +Punkte
  bonusPips: number; // +Pips (virtual)
  bonusMult: number; // +Mult

  // Scoring modifiers (multiplicative)
  multMultiplier: number; // ×Mult (default 1.0)

  // Roll manipulation
  extraRolls: number; // Additional rolls granted
  refundRoll: boolean; // Refund the current roll

  // Dice manipulation
  diceModifications: Array<{
    index: number;
    newValue?: number;
    bump?: number; // +1 (capped at 6)
  }>;

  // Lock manipulation
  lockChanges: Array<{
    index: number;
    shouldLock: boolean;
  }>;

  // Economy
  moneyChange: number; // +/- money

  // Hand upgrades
  handLevelChanges: Array<{
    handId: string;
    change: number;
  }>;

  // Shop manipulation
  discounts: Array<{
    itemId: string;
    amount: number; // absolute discount
  }>;

  // Meta-flags
  cancelAction: boolean; // Prevent the triggering action
}

/**
 * Create a fresh effect context with defaults
 */
export function createEffectContext(): EffectContext {
  return {
    bonusPoints: 0,
    bonusPips: 0,
    bonusMult: 0,
    multMultiplier: 1.0,
    extraRolls: 0,
    refundRoll: false,
    diceModifications: [],
    lockChanges: [],
    moneyChange: 0,
    handLevelChanges: [],
    discounts: [],
    cancelAction: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Definition Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler function called when a trigger fires
 */
export type TriggerHandler = (
  context: TriggerContext,
  effects: EffectContext
) => void;

/**
 * Condition function to check if effect should apply
 */
export type TriggerCondition = (context: TriggerContext) => boolean;

/**
 * Item trigger subscription
 */
export interface ItemTriggerSubscription {
  triggerId: TriggerType;
  condition?: TriggerCondition;
  handler: TriggerHandler;
  priority?: number; // Lower = earlier (default 0)
}

/**
 * Registered item with its trigger subscriptions
 */
export interface RegisteredItem {
  id: string;
  name: string;
  subscriptions: ItemTriggerSubscription[];
  // Limiter state (managed by the system)
  usageThisHand: number;
  usageThisLevel: number;
  usageThisShop: number;
  chargesRemaining: number;
  cooldownHandsRemaining: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Emitter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global registry of active items
 * Items register their triggers here when equipped/added to run
 */
const registeredItems: Map<string, RegisteredItem> = new Map();

/**
 * Trigger listeners indexed by trigger type for O(1) lookup
 */
const triggerListeners: Map<
  TriggerType,
  Array<{ itemId: string; subscription: ItemTriggerSubscription }>
> = new Map();

/**
 * Register an item with the trigger system
 */
export function registerItem(item: RegisteredItem): void {
  registeredItems.set(item.id, item);

  // Index subscriptions by trigger type
  for (const sub of item.subscriptions) {
    let listeners = triggerListeners.get(sub.triggerId);
    if (!listeners) {
      listeners = [];
      triggerListeners.set(sub.triggerId, listeners);
    }
    listeners.push({ itemId: item.id, subscription: sub });
    // Sort by priority
    listeners.sort(
      (a, b) => (a.subscription.priority ?? 0) - (b.subscription.priority ?? 0)
    );
  }
}

/**
 * Unregister an item from the trigger system
 */
export function unregisterItem(itemId: string): void {
  const item = registeredItems.get(itemId);
  if (!item) return;

  // Remove from listeners
  for (const sub of item.subscriptions) {
    const listeners = triggerListeners.get(sub.triggerId);
    if (listeners) {
      const idx = listeners.findIndex((l) => l.itemId === itemId);
      if (idx >= 0) {
        listeners.splice(idx, 1);
      }
    }
  }

  registeredItems.delete(itemId);
}

/**
 * Clear all registered items (e.g., on new run)
 */
export function clearAllItems(): void {
  registeredItems.clear();
  triggerListeners.clear();
}

/**
 * Emit a trigger event, calling all subscribed item handlers
 * Returns the accumulated effect context
 */
export function emitTrigger(
  triggerId: TriggerType,
  context: TriggerContext
): EffectContext {
  const effects = createEffectContext();

  const listeners = triggerListeners.get(triggerId);
  if (!listeners || listeners.length === 0) {
    return effects;
  }

  for (const { itemId, subscription } of listeners) {
    const item = registeredItems.get(itemId);
    if (!item) continue;

    // Check condition if present
    if (subscription.condition && !subscription.condition(context)) {
      continue;
    }

    // TODO: Check limiter state (charges, cooldowns, per-hand/level limits)
    // For now, just call the handler

    // Call the handler
    subscription.handler(context, effects);
  }

  return effects;
}

/**
 * Get all registered items (for display/debugging)
 */
export function getRegisteredItems(): RegisteredItem[] {
  return Array.from(registeredItems.values());
}

/**
 * Reset per-hand usage counters (call at HAND_START)
 */
export function resetHandUsage(): void {
  Array.from(registeredItems.values()).forEach((item) => {
    item.usageThisHand = 0;
  });
}

/**
 * Reset per-level usage counters (call at LEVEL_START)
 */
export function resetLevelUsage(): void {
  Array.from(registeredItems.values()).forEach((item) => {
    item.usageThisLevel = 0;
    item.usageThisHand = 0;
  });
}

/**
 * Reset per-shop usage counters (call at SHOP_ENTER)
 */
export function resetShopUsage(): void {
  Array.from(registeredItems.values()).forEach((item) => {
    item.usageThisShop = 0;
  });
}

/**
 * Decrement cooldowns (call at HAND_SCORED)
 */
export function tickCooldowns(): void {
  Array.from(registeredItems.values()).forEach((item) => {
    if (item.cooldownHandsRemaining > 0) {
      item.cooldownHandsRemaining--;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Builders (used by gameStore to create TriggerContext)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a TriggerContext from the current game state
 * This is the canonical way to create context for emitTrigger
 */
export interface GameStateSnapshot {
  phase: GamePhase;
  currentLevelIndex: number;
  money: number;
  levelScore: number;
  levelGoal: number;
  handsRemaining: number;
  rollsRemaining: number;
  hasRolledThisHand: boolean;
  diceValues: number[];
  selectedDice: boolean[];
  selectedHandId: string | null;
  diceEnhancements: DieEnhancement[];
}

export function buildTriggerContext(
  state: GameStateSnapshot,
  extras?: Partial<TriggerContext>
): TriggerContext {
  return {
    phase: state.phase,
    currentLevelIndex: state.currentLevelIndex,
    money: state.money,
    levelScore: state.levelScore,
    levelGoal: state.levelGoal,
    handsRemaining: state.handsRemaining,
    rollsRemaining: state.rollsRemaining,
    hasRolledThisHand: state.hasRolledThisHand,
    diceValues: state.diceValues,
    lockedMask: state.selectedDice,
    selectedHandId: state.selectedHandId,
    enhancements: state.diceEnhancements,
    ...extras,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Common Condition Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if any dice have a specific value
 */
export function hasDiceValue(context: TriggerContext, value: number): boolean {
  return context.diceValues.includes(value);
}

/**
 * Count dice with a specific value
 */
export function countDiceValue(context: TriggerContext, value: number): number {
  return context.diceValues.filter((v) => v === value).length;
}

/**
 * Count locked dice
 */
export function countLockedDice(context: TriggerContext): number {
  return context.lockedMask.filter((locked) => locked).length;
}

/**
 * Check if this is the first roll of the hand
 */
export function isFirstRoll(context: TriggerContext): boolean {
  return context.rollsRemaining === 2 && context.hasRolledThisHand;
}

/**
 * Check if this is the last roll of the hand
 */
export function isLastRoll(context: TriggerContext): boolean {
  return context.rollsRemaining === 0;
}

/**
 * Check if a specific hand type is selected
 */
export function isHandSelected(
  context: TriggerContext,
  handId: string
): boolean {
  return context.selectedHandId === handId;
}

/**
 * Check if any upper section hand is selected
 */
export function isUpperHandSelected(context: TriggerContext): boolean {
  const upperHands = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  return (
    !!context.selectedHandId && upperHands.includes(context.selectedHandId)
  );
}

/**
 * Check if any lower section hand is selected
 */
export function isLowerHandSelected(context: TriggerContext): boolean {
  const lowerHands = [
    "threeOfAKind",
    "fourOfAKind",
    "fullHouse",
    "smallStraight",
    "largeStraight",
    "yahtzee",
    "chance",
  ];
  return (
    !!context.selectedHandId && lowerHands.includes(context.selectedHandId)
  );
}
