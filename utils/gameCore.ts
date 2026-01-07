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
// Dice Enhancement System
// ─────────────────────────────────────────────────────────────────────────────

/** State of a single pip on a die face */
export type PipState = "none" | "points" | "mult";

/** Enhancement state for a single die (6 faces, variable pips per face) */
export interface DieEnhancement {
  /** Array of 6 faces (index 0 = face value 1, etc.) */
  faces: PipState[][];
}

/** Dice enhancement upgrade type */
export type DiceUpgradeType = "points" | "mult";

/** Config for dice upgrade shop items */
export const DICE_UPGRADE_CONFIG = {
  costPoints: 8, // Cost for +10 points pip upgrade
  costMult: 14, // Cost for +1 mult pip upgrade
  pointsPerPip: 10, // Bonus points per blue pip
  multPerPip: 1, // Bonus mult per red pip
  rarityPoints: 0.8, // 80% chance for points upgrade
  rarityMult: 0.2, // 20% chance for mult upgrade
} as const;

/**
 * Deterministic pip fill order per face value.
 * When enhancing a face, pips are colored in this order.
 * Index in array = pip position for rendering.
 */
export const PIP_FILL_ORDER: Record<number, number[]> = {
  1: [0], // center
  2: [0, 1], // top-left → bottom-right
  3: [0, 1, 2], // top-left → center → bottom-right
  4: [0, 1, 2, 3], // TL → TR → BL → BR
  5: [0, 1, 2, 3, 4], // TL → TR → center → BL → BR
  6: [0, 1, 2, 3, 4, 5], // TL → ML → BL → TR → MR → BR
};

/**
 * Get initial empty enhancements for all 5 dice
 */
export function getInitialDiceEnhancements(): DieEnhancement[] {
  return Array.from({ length: 5 }, () => ({
    faces: [
      Array(1).fill("none"), // Face 1: 1 pip
      Array(2).fill("none"), // Face 2: 2 pips
      Array(3).fill("none"), // Face 3: 3 pips
      Array(4).fill("none"), // Face 4: 4 pips
      Array(5).fill("none"), // Face 5: 5 pips
      Array(6).fill("none"), // Face 6: 6 pips
    ],
  }));
}

/**
 * Calculate bonus points from enhanced pips on a die face
 */
export function bonusPointsForDieFace(
  dieIndex: number,
  faceValue: number,
  enhancements: DieEnhancement[]
): number {
  const die = enhancements[dieIndex];
  if (!die) return 0;
  const face = die.faces[faceValue - 1]; // faceValue is 1-6, array is 0-indexed
  if (!face) return 0;
  const count = face.filter((s) => s === "points").length;
  return count * DICE_UPGRADE_CONFIG.pointsPerPip;
}

/**
 * Calculate bonus mult from enhanced pips on a die face
 */
export function bonusMultForDieFace(
  dieIndex: number,
  faceValue: number,
  enhancements: DieEnhancement[]
): number {
  const die = enhancements[dieIndex];
  if (!die) return 0;
  const face = die.faces[faceValue - 1];
  if (!face) return 0;
  const count = face.filter((s) => s === "mult").length;
  return count * DICE_UPGRADE_CONFIG.multPerPip;
}

/**
 * Check if a face can be enhanced (has at least one "none" pip)
 */
export function isFaceEnhanceable(
  dieIndex: number,
  faceValue: number,
  enhancements: DieEnhancement[]
): boolean {
  const die = enhancements[dieIndex];
  if (!die) return false;
  const face = die.faces[faceValue - 1];
  if (!face) return false;
  return face.some((s) => s === "none");
}

/**
 * Check if a die has any enhanceable faces
 */
export function hasDieAnyEnhanceableFace(
  dieIndex: number,
  enhancements: DieEnhancement[]
): boolean {
  for (let faceValue = 1; faceValue <= 6; faceValue++) {
    if (isFaceEnhanceable(dieIndex, faceValue, enhancements)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if any die can be enhanced (for shop spawn eligibility)
 */
export function hasAnyEnhanceableDie(enhancements: DieEnhancement[]): boolean {
  for (let dieIndex = 0; dieIndex < 5; dieIndex++) {
    if (hasDieAnyEnhanceableFace(dieIndex, enhancements)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the index of the next pip that will be enhanced on a face.
 * Returns -1 if no pip is available to enhance.
 */
export function getNextEnhanceablePipIndex(
  dieIndex: number,
  faceValue: number,
  enhancements: DieEnhancement[]
): number {
  const die = enhancements[dieIndex];
  if (!die) return -1;
  const face = die.faces[faceValue - 1];
  if (!face) return -1;
  return face.findIndex((s) => s === "none");
}

/**
 * Apply an enhancement to the next available pip on a face.
 * Returns a new enhancements array (immutable).
 */
export function applyDiceEnhancement(
  dieIndex: number,
  faceValue: number,
  upgradeType: DiceUpgradeType,
  enhancements: DieEnhancement[]
): DieEnhancement[] {
  const newEnhancements = enhancements.map((die, i) => {
    if (i !== dieIndex) return die;
    return {
      faces: die.faces.map((face, faceIdx) => {
        if (faceIdx !== faceValue - 1) return face;
        // Find first "none" pip and upgrade it
        const newFace = [...face];
        const noneIdx = newFace.findIndex((s) => s === "none");
        if (noneIdx !== -1) {
          newFace[noneIdx] = upgradeType;
        }
        return newFace;
      }),
    };
  });
  return newEnhancements;
}

/**
 * Get upgrade cost for dice enhancement
 */
export function getDiceUpgradeCost(type: DiceUpgradeType): number {
  return type === "points"
    ? DICE_UPGRADE_CONFIG.costPoints
    : DICE_UPGRADE_CONFIG.costMult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Die System (D20)
// ─────────────────────────────────────────────────────────────────────────────

/** Enhancement state for the artifact die (20 faces, one pip each) */
export interface ArtifactDieEnhancement {
  /** Array of 20 faces (index 0 = face value 1, etc.) - true if has +1 mult */
  faces: boolean[];
}

/** Config for artifact die upgrades */
export const ARTIFACT_UPGRADE_CONFIG = {
  cost: 10, // Cost per enhancement
  multPerEnhancement: 1, // +1 mult per enhanced face
} as const;

/**
 * Get initial empty artifact enhancement (all 20 faces unenhanced)
 */
export function getInitialArtifactEnhancement(): ArtifactDieEnhancement {
  return {
    faces: Array(20).fill(false),
  };
}

/**
 * Check if an artifact face is enhanced
 */
export function isArtifactFaceEnhanced(
  faceValue: number,
  enhancement: ArtifactDieEnhancement
): boolean {
  return enhancement.faces[faceValue - 1] ?? false;
}

/**
 * Apply enhancement to an artifact face (immutable)
 */
export function applyArtifactEnhancement(
  faceValue: number,
  enhancement: ArtifactDieEnhancement
): ArtifactDieEnhancement {
  const newFaces = [...enhancement.faces];
  newFaces[faceValue - 1] = true;
  return { faces: newFaces };
}

/**
 * Count total artifact enhancements
 */
export function countArtifactEnhancements(
  enhancement: ArtifactDieEnhancement
): number {
  return enhancement.faces.filter(Boolean).length;
}

/**
 * Check if artifact face can be enhanced (not already enhanced)
 */
export function isArtifactFaceEnhanceable(
  faceValue: number,
  enhancement: ArtifactDieEnhancement
): boolean {
  return !enhancement.faces[faceValue - 1];
}

/**
 * Check if any artifact face can be enhanced
 */
export function hasAnyArtifactEnhanceableFace(
  enhancement: ArtifactDieEnhancement
): boolean {
  return enhancement.faces.some((f) => !f);
}

/**
 * Get artifact upgrade cost
 */
export function getArtifactUpgradeCost(): number {
  return ARTIFACT_UPGRADE_CONFIG.cost;
}

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
    return dice.map((d, i) => (d === target ? i : -1)).filter((i) => i !== -1);
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
  bonusPoints: number; // From blue (points) pip enhancements
  bonusMult: number; // From red (mult) pip enhancements
  artifactMult: number; // From artifact die enhancement
  finalScore: number;
  contributingIndices: number[];
}

export function getScoringBreakdown(
  handId: HandId,
  level: number,
  dice: number[],
  enhancements?: DieEnhancement[],
  artifactValue?: number | null,
  artifactEnhancement?: ArtifactDieEnhancement
): ScoringBreakdown {
  const category = CATEGORIES.find((c) => c.id === handId);
  const basePoints = getBasePoints(handId, level);
  const pips = calculatePips(handId, dice);
  const mult = getMultiplier(handId);
  const contributingIndices = getContributingDiceIndices(handId, dice);

  // Calculate enhancement bonuses from contributing dice only
  let bonusPoints = 0;
  let bonusMult = 0;

  if (enhancements) {
    for (const dieIndex of contributingIndices) {
      const faceValue = dice[dieIndex];
      bonusPoints += bonusPointsForDieFace(dieIndex, faceValue, enhancements);
      bonusMult += bonusMultForDieFace(dieIndex, faceValue, enhancements);
    }
  }

  // Calculate artifact mult bonus
  let artifactMult = 0;
  if (artifactValue && artifactEnhancement) {
    if (isArtifactFaceEnhanced(artifactValue, artifactEnhancement)) {
      artifactMult = ARTIFACT_UPGRADE_CONFIG.multPerEnhancement;
    }
  }

  // Enhanced scoring formula: (base + pips + bonusPoints) × (mult + bonusMult + artifactMult)
  const totalPoints = basePoints + pips + bonusPoints;
  const totalMult = mult + bonusMult + artifactMult;
  const finalScore = totalPoints * totalMult;

  return {
    handId,
    handName: category?.labelDe || handId,
    basePoints,
    pips,
    mult,
    bonusPoints,
    bonusMult,
    artifactMult,
    finalScore,
    contributingIndices,
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
  // Roll reward removed per user request
  upgradeCostBase: 6, // cost = 6 + handLevel
};

export interface RewardBreakdown {
  currentMoney: number;
  baseReward: number;
  unusedHandsCount: number;
  unusedHandsBonus: number;
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
  const { currentMoney, handsRemaining } = params;

  const unusedHandsBonus = handsRemaining * REWARD_CONFIG.perUnusedHand;

  const totalPayout = REWARD_CONFIG.baseWin + unusedHandsBonus;

  return {
    currentMoney,
    baseReward: REWARD_CONFIG.baseWin,
    unusedHandsCount: handsRemaining,
    unusedHandsBonus,
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
  const allHands = CATEGORIES.map((c) => c.id).filter((id) => id !== "chance");
  const shuffled = [...allHands].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
