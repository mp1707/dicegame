import { create } from "zustand";
import {
  CategoryId,
  CATEGORIES,
  calculateScore,
  getValidCategories,
} from "../utils/yahtzeeScoring";

// Game phases
export type GamePhase =
  | "rolling" // Player can roll/lock dice
  | "scoring" // Player must select a category (or scratch)
  | "won" // Game won, awaiting shop
  | "lost" // Game lost, awaiting retry
  | "shop"; // In shop view

// Category slot state
export interface CategorySlot {
  score: number | null; // null = unfilled, number = filled
  scratched: boolean; // true if player entered 0 by scratching
}

interface GameState {
  // Core game state
  round: number; // 1-13
  rollsRemaining: number; // 0-3 (3 = fresh round, 0 = must score)
  hasRolledThisRound: boolean; // Track if player has rolled at least once

  // Dice state
  diceValues: number[]; // Current face values [1-6]
  selectedDice: boolean[]; // true = locked (won't reroll)
  isRolling: boolean; // Animation in progress
  rollTrigger: number; // Increment to trigger physics
  diceVisible: boolean; // Controls dice opacity for the player

  // Categories
  categories: Record<CategoryId, CategorySlot>;

  // Score tracking
  currentScore: number;
  targetScore: number;
  money: number;

  // Game phase
  phase: GamePhase;

  // Actions
  triggerRoll: () => void;
  completeRoll: (values: number[]) => void;
  setRolling: (isRolling: boolean) => void;
  setDiceValues: (values: number[]) => void;
  toggleDiceLock: (index: number) => void;
  submitCategory: (categoryId: CategoryId) => void;
  scratchCategory: (categoryId: CategoryId) => void;
  goToShop: () => void;
  startNextRun: () => void;
  retryRun: () => void;
  resetForNewRound: () => void;
}

// Initial categories state
function getInitialCategories(): Record<CategoryId, CategorySlot> {
  const categories: Partial<Record<CategoryId, CategorySlot>> = {};
  for (const cat of CATEGORIES) {
    categories[cat.id] = { score: null, scratched: false };
  }
  return categories as Record<CategoryId, CategorySlot>;
}

// Check if all categories are filled
function allCategoriesFilled(
  categories: Record<CategoryId, CategorySlot>
): boolean {
  return CATEGORIES.every((cat) => categories[cat.id].score !== null);
}

// Calculate total score from categories
function calculateTotalScore(
  categories: Record<CategoryId, CategorySlot>
): number {
  let total = 0;
  let upperTotal = 0;

  for (const cat of CATEGORIES) {
    const slot = categories[cat.id];
    if (slot.score !== null) {
      total += slot.score;
      if (cat.section === "upper") {
        upperTotal += slot.score;
      }
    }
  }

  // Upper section bonus
  if (upperTotal >= 63) {
    total += 35;
  }

  return total;
}

const INITIAL_TARGET = 200;
const TARGET_MULTIPLIER = 1.5;
const MONEY_PER_UNUSED_ROLL = 3;

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  round: 1,
  rollsRemaining: 3,
  hasRolledThisRound: false,
  diceValues: [1, 1, 1, 1, 1],
  selectedDice: [false, false, false, false, false],
  isRolling: false,
  rollTrigger: 0,
  diceVisible: false,
  categories: getInitialCategories(),
  currentScore: 0,
  targetScore: INITIAL_TARGET,
  money: 0,
  phase: "rolling",

  // Roll dice
  triggerRoll: () => {
    const { rollsRemaining, phase } = get();
    if (rollsRemaining <= 0 || phase !== "rolling") return;

    set((state) => ({
      rollTrigger: state.rollTrigger + 1,
      isRolling: true,
      rollsRemaining: state.rollsRemaining - 1,
      hasRolledThisRound: true,
      diceVisible: true,
    }));
  },

  // Complete roll with final dice values (batch update for performance)
  completeRoll: (values: number[]) => {
    set({
      diceValues: values,
      isRolling: false,
    });
  },

  setRolling: (isRolling) => set({ isRolling }),

  setDiceValues: (values) => set({ diceValues: values }),

  // Toggle die lock/unlock
  toggleDiceLock: (index) => {
    const { hasRolledThisRound, isRolling } = get();
    // Can only lock after first roll and when not rolling
    if (!hasRolledThisRound || isRolling) return;

    set((state) => {
      const newSelected = [...state.selectedDice];
      newSelected[index] = !newSelected[index];
      return { selectedDice: newSelected };
    });
  },

  // Submit score to a category
  submitCategory: (categoryId) => {
    const {
      diceValues,
      categories,
      round,
      hasRolledThisRound,
      rollsRemaining,
    } = get();

    // Can't submit if hasn't rolled or category already filled
    if (!hasRolledThisRound) return;
    if (categories[categoryId].score !== null) return;

    const score = calculateScore(diceValues, categoryId);

    const newCategories = { ...categories };
    newCategories[categoryId] = { score, scratched: false };

    const newCurrentScore = calculateTotalScore(newCategories);
    const newRound = round + 1;

    // Check if game is over
    if (newRound > 13 || allCategoriesFilled(newCategories)) {
      // Calculate bonus money from unused rolls
      const bonusMoney = rollsRemaining * MONEY_PER_UNUSED_ROLL;
      const targetScore = get().targetScore;
      const won = newCurrentScore >= targetScore;

      set({
        categories: newCategories,
        currentScore: newCurrentScore,
        round: 13,
        phase: won ? "won" : "lost",
        money: get().money + bonusMoney,
        diceVisible: false,
      });
    } else {
      // Next round
      set({
        categories: newCategories,
        currentScore: newCurrentScore,
        round: newRound,
        rollsRemaining: 3,
        hasRolledThisRound: false,
        selectedDice: [false, false, false, false, false],
        phase: "rolling",
        diceVisible: false,
      });
    }
  },

  // Scratch a category (enter 0)
  scratchCategory: (categoryId) => {
    const { categories, round, hasRolledThisRound, rollsRemaining } = get();

    if (!hasRolledThisRound) return;
    if (categories[categoryId].score !== null) return;

    const newCategories = { ...categories };
    newCategories[categoryId] = { score: 0, scratched: true };

    const newCurrentScore = calculateTotalScore(newCategories);
    const newRound = round + 1;

    // Check if game is over
    if (newRound > 13 || allCategoriesFilled(newCategories)) {
      const bonusMoney = rollsRemaining * MONEY_PER_UNUSED_ROLL;
      const targetScore = get().targetScore;
      const won = newCurrentScore >= targetScore;

      set({
        categories: newCategories,
        currentScore: newCurrentScore,
        round: 13,
        phase: won ? "won" : "lost",
        money: get().money + bonusMoney,
        diceVisible: false,
      });
    } else {
      set({
        categories: newCategories,
        currentScore: newCurrentScore,
        round: newRound,
        rollsRemaining: 3,
        hasRolledThisRound: false,
        selectedDice: [false, false, false, false, false],
        phase: "rolling",
        diceVisible: false,
      });
    }
  },

  // Go to shop after winning
  goToShop: () => {
    set({ phase: "shop" });
  },

  // Start next run with higher target
  startNextRun: () => {
    const { targetScore } = get();
    set({
      round: 1,
      rollsRemaining: 3,
      hasRolledThisRound: false,
      diceValues: [1, 1, 1, 1, 1],
      selectedDice: [false, false, false, false, false],
      isRolling: false,
      diceVisible: false,
      categories: getInitialCategories(),
      currentScore: 0,
      targetScore: Math.round(targetScore * TARGET_MULTIPLIER),
      phase: "rolling",
      // Keep money
    });
  },

  // Retry after losing
  retryRun: () => {
    set({
      round: 1,
      rollsRemaining: 3,
      hasRolledThisRound: false,
      diceValues: [1, 1, 1, 1, 1],
      selectedDice: [false, false, false, false, false],
      isRolling: false,
      diceVisible: false,
      categories: getInitialCategories(),
      currentScore: 0,
      targetScore: INITIAL_TARGET,
      money: 0, // Reset money on loss
      phase: "rolling",
    });
  },

  // Reset for new round (utility)
  resetForNewRound: () => {
    set({
      rollsRemaining: 3,
      hasRolledThisRound: false,
      selectedDice: [false, false, false, false, false],
    });
  },
}));

// Selector helpers
export const useValidCategories = () => {
  const diceValues = useGameStore((s) => s.diceValues);
  const categories = useGameStore((s) => s.categories);
  const hasRolled = useGameStore((s) => s.hasRolledThisRound);
  const isRolling = useGameStore((s) => s.isRolling);

  if (!hasRolled || isRolling) return [];

  const filledSet = new Set<CategoryId>(
    CATEGORIES.filter((c) => categories[c.id].score !== null).map((c) => c.id)
  );

  return getValidCategories(diceValues, filledSet);
};

export const useHasValidCategories = () => {
  return useValidCategories().length > 0;
};
