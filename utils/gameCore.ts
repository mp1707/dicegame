/**
 * Game Core - Pure TypeScript module for roguelike Yahtzee
 * No React dependencies. Contains scoring, validation, and configuration.
 */

import { CategoryId, CATEGORIES, isCategoryValid } from "./yahtzeeScoring";

// Re-export CategoryId as HandId for semantic clarity
export type HandId = CategoryId;

// ─────────────────────────────────────────────────────────────────────────────
// Level Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelConfig {
  level: number;
  goal: number;
}

export const LEVEL_CONFIG: LevelConfig[] = [
  { level: 1, goal: 50 },
  { level: 2, goal: 80 },
  { level: 3, goal: 120 },
  { level: 4, goal: 180 },
  { level: 5, goal: 250 },
  { level: 6, goal: 350 },
  { level: 7, goal: 480 },
  { level: 8, goal: 650 },
];

export const MAX_HANDS_PER_LEVEL = 4;
export const MAX_ROLLS_PER_HAND = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Hand Scoring Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface HandBaseConfig {
  base: number; // Base points at level 1
  mult: number; // Multiplier
}

export const HAND_BASE_CONFIG: Record<HandId, HandBaseConfig> = {
  // Upper section (pips = sum of matching dice only)
  ones: { base: 10, mult: 1 },
  twos: { base: 10, mult: 1 },
  threes: { base: 10, mult: 1 },
  fours: { base: 10, mult: 1 },
  fives: { base: 10, mult: 1 },
  sixes: { base: 10, mult: 1 },
  // Lower section (pips = sum of all dice)
  threeOfKind: { base: 20, mult: 2 },
  fourOfKind: { base: 20, mult: 3 },
  fullHouse: { base: 20, mult: 3 },
  smallStraight: { base: 20, mult: 2 },
  largeStraight: { base: 40, mult: 3 },
  yahtzee: { base: 50, mult: 4 },
  chance: { base: 20, mult: 2 },
};

// Upper section hand IDs (pips = matching dice only)
const UPPER_HAND_IDS: HandId[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

// Map upper hands to their target number
const UPPER_HAND_TARGET: Record<string, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get base points for a hand at a given level
 * Formula: basePointsLV1 + (level - 1) * 5
 */
export function getBasePoints(handId: HandId, level: number): number {
  const config = HAND_BASE_CONFIG[handId];
  return config.base + (level - 1) * 5;
}

/**
 * Get multiplier for a hand (constant, doesn't change with level)
 */
export function getMultiplier(handId: HandId): number {
  return HAND_BASE_CONFIG[handId].mult;
}

/**
 * Check if a hand is an upper section hand (ones through sixes)
 */
export function isUpperHand(handId: HandId): boolean {
  return UPPER_HAND_IDS.includes(handId);
}

/**
 * Calculate pips for a hand
 * - Upper section: sum of dice matching the target number
 * - Lower section: sum of all dice
 */
export function calculatePips(handId: HandId, dice: number[]): number {
  if (isUpperHand(handId)) {
    const target = UPPER_HAND_TARGET[handId];
    return dice.filter((d) => d === target).reduce((sum, d) => sum + d, 0);
  }
  // Lower section: sum all dice
  return dice.reduce((sum, d) => sum + d, 0);
}

/**
 * Calculate final score for a hand
 * Formula: (basePoints + pips) * mult
 */
export function calculateHandScore(
  handId: HandId,
  level: number,
  dice: number[]
): number {
  const base = getBasePoints(handId, level);
  const pips = calculatePips(handId, dice);
  const mult = getMultiplier(handId);
  return (base + pips) * mult;
}

/**
 * Get indices of contributing dice for animation
 * - Upper section: indices of dice matching the target number
 * - Lower section: all indices [0, 1, 2, 3, 4]
 */
export function getContributingDiceIndices(
  handId: HandId,
  dice: number[]
): number[] {
  if (isUpperHand(handId)) {
    const target = UPPER_HAND_TARGET[handId];
    return dice
      .map((d, i) => (d === target ? i : -1))
      .filter((i) => i !== -1);
  }
  // Lower section: all dice contribute
  return [0, 1, 2, 3, 4];
}

/**
 * Get scoring breakdown for display
 */
export interface ScoringBreakdown {
  handId: HandId;
  handName: string;
  basePoints: number;
  pips: number;
  mult: number;
  finalScore: number;
  contributingIndices: number[];
}

export function getScoringBreakdown(
  handId: HandId,
  level: number,
  dice: number[]
): ScoringBreakdown {
  const category = CATEGORIES.find((c) => c.id === handId);
  return {
    handId,
    handName: category?.labelDe || handId,
    basePoints: getBasePoints(handId, level),
    pips: calculatePips(handId, dice),
    mult: getMultiplier(handId),
    finalScore: calculateHandScore(handId, level, dice),
    contributingIndices: getContributingDiceIndices(handId, dice),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a hand is valid for current dice
 * Re-exports from yahtzeeScoring for consistency
 */
export function isHandValid(handId: HandId, dice: number[]): boolean {
  return isCategoryValid(dice, handId);
}

/**
 * Get all valid hands for current dice that haven't been used this level
 */
export function getValidHands(
  dice: number[],
  usedHands: Set<HandId>
): HandId[] {
  return CATEGORIES.filter(
    (c) => !usedHands.has(c.id) && isHandValid(c.id, dice)
  ).map((c) => c.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reward Calculation
// ─────────────────────────────────────────────────────────────────────────────

export const REWARD_CONFIG = {
  baseWin: 10,
  perUnusedHand: 2,
  perUnusedRoll: 1,
  tier1Multiplier: 1.25, // Score >= goal * 1.25
  tier2Multiplier: 1.5, // Score >= goal * 1.50
  tier1Bonus: 5,
  tier2Bonus: 10,
  upgradeCostBase: 6, // cost = 6 + handLevel
};

export type TierLevel = 0 | 1 | 2;

/**
 * Calculate which tier the player achieved based on score vs goal
 */
export function calculateTier(score: number, goal: number): TierLevel {
  if (score >= goal * REWARD_CONFIG.tier2Multiplier) return 2;
  if (score >= goal * REWARD_CONFIG.tier1Multiplier) return 1;
  return 0;
}

export interface RewardBreakdown {
  currentMoney: number;
  baseReward: number;
  unusedHandsCount: number;
  unusedHandsBonus: number;
  unusedRollsCount: number;
  unusedRollsBonus: number;
  tier: TierLevel;
  tierBonus: number;
  totalPayout: number;
  newMoney: number;
}

export interface RewardParams {
  currentMoney: number;
  score: number;
  goal: number;
  handsRemaining: number;
  rollsUsedThisLevel: number;
}

/**
 * Calculate all rewards for completing a level
 */
export function calculateRewards(params: RewardParams): RewardBreakdown {
  const { currentMoney, score, goal, handsRemaining, rollsUsedThisLevel } =
    params;

  // Total possible rolls = MAX_HANDS_PER_LEVEL * MAX_ROLLS_PER_HAND = 12
  const totalPossibleRolls = MAX_HANDS_PER_LEVEL * MAX_ROLLS_PER_HAND;
  const unusedRolls = totalPossibleRolls - rollsUsedThisLevel;

  const tier = calculateTier(score, goal);
  const tierBonus =
    tier === 2
      ? REWARD_CONFIG.tier2Bonus
      : tier === 1
      ? REWARD_CONFIG.tier1Bonus
      : 0;

  const unusedHandsBonus = handsRemaining * REWARD_CONFIG.perUnusedHand;
  const unusedRollsBonus = unusedRolls * REWARD_CONFIG.perUnusedRoll;

  const totalPayout =
    REWARD_CONFIG.baseWin + unusedHandsBonus + unusedRollsBonus + tierBonus;

  return {
    currentMoney,
    baseReward: REWARD_CONFIG.baseWin,
    unusedHandsCount: handsRemaining,
    unusedHandsBonus,
    unusedRollsCount: unusedRolls,
    unusedRollsBonus,
    tier,
    tierBonus,
    totalPayout,
    newMoney: currentMoney + totalPayout,
  };
}

/**
 * Calculate upgrade cost for a hand at current level
 */
export function getUpgradeCost(currentLevel: number): number {
  return REWARD_CONFIG.upgradeCostBase + currentLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get initial hand levels (all hands start at level 1)
 */
export function getInitialHandLevels(): Record<HandId, number> {
  const levels: Partial<Record<HandId, number>> = {};
  for (const cat of CATEGORIES) {
    levels[cat.id] = 1;
  }
  return levels as Record<HandId, number>;
}

/**
 * Get 3 random unique hands for upgrade selection
 */
export function getRandomUpgradeOptions(): HandId[] {
  const allHands = CATEGORIES.map((c) => c.id);
  const shuffled = [...allHands].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/**
 * Get tier threshold values for display
 */
export function getTierThresholds(goal: number): {
  tier1: number;
  tier2: number;
} {
  return {
    tier1: Math.ceil(goal * REWARD_CONFIG.tier1Multiplier),
    tier2: Math.ceil(goal * REWARD_CONFIG.tier2Multiplier),
  };
}
