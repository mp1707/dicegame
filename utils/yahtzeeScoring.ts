/**
 * Yahtzee Scoring Logic
 * Pure utility functions for calculating scores
 */

export type CategoryId =
  // Upper section
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  // Lower section
  | "threeOfKind"
  | "fourOfKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yahtzee"
  | "chance";

export interface CategoryInfo {
  id: CategoryId;
  labelDe: string;
  section: "upper" | "lower";
}

export const CATEGORIES: CategoryInfo[] = [
  // Upper section
  { id: "ones", labelDe: "Einser", section: "upper" },
  { id: "twos", labelDe: "Zweier", section: "upper" },
  { id: "threes", labelDe: "Dreier", section: "upper" },
  { id: "fours", labelDe: "Vierer", section: "upper" },
  { id: "fives", labelDe: "Fünfer", section: "upper" },
  { id: "sixes", labelDe: "Sechser", section: "upper" },
  // Lower section
  { id: "threeOfKind", labelDe: "Dreier Pasch", section: "lower" },
  { id: "fourOfKind", labelDe: "Vierer Pasch", section: "lower" },
  { id: "fullHouse", labelDe: "Full House", section: "lower" },
  { id: "smallStraight", labelDe: "Kleine Straße", section: "lower" },
  { id: "largeStraight", labelDe: "Große Straße", section: "lower" },
  { id: "yahtzee", labelDe: "Yahtzee", section: "lower" },
  { id: "chance", labelDe: "Chance", section: "lower" },
];

// Get counts of each die value
function getDiceCounts(dice: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const die of dice) {
    counts.set(die, (counts.get(die) || 0) + 1);
  }
  return counts;
}

// Sum of all dice
function sumAll(dice: number[]): number {
  return dice.reduce((a, b) => a + b, 0);
}

// Upper section: sum of specific number
export function calculateUpperScore(
  dice: number[],
  targetNumber: number
): number {
  return dice.filter((d) => d === targetNumber).reduce((a, b) => a + b, 0);
}

// Three of a kind: at least 3 dice same, scores sum of all
export function isThreeOfKind(dice: number[]): boolean {
  const counts = getDiceCounts(dice);
  return Array.from(counts.values()).some((count) => count >= 3);
}

export function scoreThreeOfKind(dice: number[]): number {
  return isThreeOfKind(dice) ? sumAll(dice) : 0;
}

// Four of a kind: at least 4 dice same, scores sum of all
export function isFourOfKind(dice: number[]): boolean {
  const counts = getDiceCounts(dice);
  return Array.from(counts.values()).some((count) => count >= 4);
}

export function scoreFourOfKind(dice: number[]): number {
  return isFourOfKind(dice) ? sumAll(dice) : 0;
}

// Full House: 3 of one kind + 2 of another, scores 25 fixed
export function isFullHouse(dice: number[]): boolean {
  const counts = getDiceCounts(dice);
  const values = Array.from(counts.values()).sort((a, b) => a - b);
  return values.length === 2 && values[0] === 2 && values[1] === 3;
}

export function scoreFullHouse(dice: number[]): number {
  return isFullHouse(dice) ? 25 : 0;
}

// Small Straight: 4 consecutive dice, scores 30 fixed
export function isSmallStraight(dice: number[]): boolean {
  const uniqueSorted = [...new Set(dice)].sort((a, b) => a - b);
  const patterns = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];

  return patterns.some((pattern) =>
    pattern.every((num) => uniqueSorted.includes(num))
  );
}

export function scoreSmallStraight(dice: number[]): number {
  return isSmallStraight(dice) ? 30 : 0;
}

// Large Straight: 5 consecutive dice, scores 40 fixed
export function isLargeStraight(dice: number[]): boolean {
  const sorted = [...dice].sort((a, b) => a - b);
  const pattern1 = [1, 2, 3, 4, 5];
  const pattern2 = [2, 3, 4, 5, 6];

  return (
    JSON.stringify(sorted) === JSON.stringify(pattern1) ||
    JSON.stringify(sorted) === JSON.stringify(pattern2)
  );
}

export function scoreLargeStraight(dice: number[]): number {
  return isLargeStraight(dice) ? 40 : 0;
}

// Yahtzee: all 5 dice same, scores 50 fixed
export function isYahtzee(dice: number[]): boolean {
  return new Set(dice).size === 1;
}

export function scoreYahtzee(dice: number[]): number {
  return isYahtzee(dice) ? 50 : 0;
}

// Chance: any combination, scores sum of all
export function scoreChance(dice: number[]): number {
  return sumAll(dice);
}

// Calculate score for any category
export function calculateScore(dice: number[], category: CategoryId): number {
  switch (category) {
    case "ones":
      return calculateUpperScore(dice, 1);
    case "twos":
      return calculateUpperScore(dice, 2);
    case "threes":
      return calculateUpperScore(dice, 3);
    case "fours":
      return calculateUpperScore(dice, 4);
    case "fives":
      return calculateUpperScore(dice, 5);
    case "sixes":
      return calculateUpperScore(dice, 6);
    case "threeOfKind":
      return scoreThreeOfKind(dice);
    case "fourOfKind":
      return scoreFourOfKind(dice);
    case "fullHouse":
      return scoreFullHouse(dice);
    case "smallStraight":
      return scoreSmallStraight(dice);
    case "largeStraight":
      return scoreLargeStraight(dice);
    case "yahtzee":
      return scoreYahtzee(dice);
    case "chance":
      return scoreChance(dice);
    default:
      return 0;
  }
}

// Check if a category would score > 0
export function isCategoryValid(dice: number[], category: CategoryId): boolean {
  return calculateScore(dice, category) > 0;
}

// Get all valid (scorable) categories for current dice
export function getValidCategories(
  dice: number[],
  filledCategories: Set<CategoryId>
): CategoryId[] {
  return CATEGORIES.filter(
    (cat) => !filledCategories.has(cat.id) && isCategoryValid(dice, cat.id)
  ).map((cat) => cat.id);
}

// Calculate upper section bonus (35 points if upper total >= 63)
export function calculateUpperBonus(
  upperScores: Record<string, number>
): number {
  const upperTotal = Object.values(upperScores).reduce((a, b) => a + b, 0);
  return upperTotal >= 63 ? 35 : 0;
}

// Format large numbers (1000+ becomes 1.0k)
export function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(n);
}
