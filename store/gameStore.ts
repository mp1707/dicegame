import { create } from "zustand";
import {
  HandId,
  LEVEL_CONFIG,
  MAX_HANDS_PER_LEVEL,
  MAX_ROLLS_PER_HAND,
  getInitialHandLevels,
  getValidHands,
  calculateHandScore,
  getScoringBreakdown,
  calculateRewards,
  getRandomUpgradeOptions,
  getUpgradeCost,
  ScoringBreakdown,
  // Dice enhancement imports
  DieEnhancement,
  DiceUpgradeType,
  getInitialDiceEnhancements,
  getDiceUpgradeCost,
  applyDiceEnhancement,
  hasAnyEnhanceableDie,
  DICE_UPGRADE_CONFIG,
} from "../utils/gameCore";
import { CATEGORIES } from "../utils/yahtzeeScoring";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GamePhase =
  | "LEVEL_PLAY" // Rolling/selecting/accepting (CASH OUT button appears when levelWon=true)
  | "LEVEL_RESULT" // Result screen with rewards
  | "SHOP_MAIN" // Shop grid (3 placeholder + 1 upgrade)
  | "SHOP_PICK_UPGRADE" // Pick 1 of 3 hands to upgrade
  | "WIN_SCREEN" // Beat level 8
  | "LOSE_SCREEN"; // Ran out of hands with score < goal

export interface RevealState {
  active: boolean;
  breakdown: ScoringBreakdown | null;
  // Animation tracking
  animationPhase: "counting" | "final" | "total";
  currentDieIndex: number; // Which die is being animated (-1 = none yet)
  accumulatedPips: number; // Running total of pips counted so far
  displayTotal?: number; // The total level score to display in "total" phase
}

interface GameState {
  // Run state (persists across levels)
  currentLevelIndex: number; // 0-7
  money: number;
  handLevels: Record<HandId, number>;
  diceEnhancements: DieEnhancement[]; // 5 dice with pip upgrades

  // Level state (resets each level)
  levelScore: number;
  levelGoal: number;
  handsRemaining: number;
  usedHandsThisLevel: HandId[];
  rollsUsedThisLevel: number;
  levelWon: boolean;
  winShownYet: boolean;
  isWinAnimating: boolean;

  // Hand attempt state (resets each hand)
  rollsRemaining: number;
  hasRolledThisHand: boolean;

  // Dice state
  diceValues: number[];
  selectedDice: boolean[];
  isRolling: boolean;
  rollTrigger: number;
  diceVisible: boolean;

  // UI state
  phase: GamePhase;
  selectedHandId: HandId | null;
  overviewVisible: boolean;

  // Score reveal animation state
  revealState: RevealState | null;

  // Shop state
  upgradeOptions: HandId[];
  shopDiceUpgradeType: DiceUpgradeType | null; // Which dice upgrade is available in shop

  // Dice editor state
  diceEditorOpen: boolean;
  pendingUpgradeType: DiceUpgradeType | null;
  selectedEditorDie: number | null; // 0-4
  selectedEditorFace: number | null; // 1-6

  // Actions
  startNewRun: () => void;
  startLevel: (levelIndex: number) => void;

  // Dice actions
  triggerRoll: () => void;
  completeRoll: (values: number[]) => void;
  setRolling: (isRolling: boolean) => void;
  toggleDiceLock: (index: number) => void;

  // Hand selection
  selectHand: (handId: HandId) => void;
  deselectHand: () => void;
  acceptHand: () => void;
  updateRevealAnimation: (update: Partial<RevealState>) => void;
  finalizeHand: () => void;

  // Cash out flow
  cashOutNow: () => void;

  // Shop actions
  openShop: () => void;
  selectUpgradeItem: () => void;
  pickUpgradeHand: (handId: HandId) => void;
  closeShopNextLevel: () => void;

  // Dice editor actions
  openDiceEditor: (type: DiceUpgradeType) => void;
  closeDiceEditor: () => void;
  selectEditorDie: (index: number) => void;
  selectEditorFace: (face: number) => void;
  applyDiceUpgrade: () => void;

  // Utility
  toggleOverview: () => void;
  forceWin: () => void;
  setIsWinAnimating: (isAnimating: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial States
// ─────────────────────────────────────────────────────────────────────────────

const getInitialRunState = () => ({
  currentLevelIndex: 0,
  money: 0,
  handLevels: getInitialHandLevels(),
  diceEnhancements: getInitialDiceEnhancements(),
});

const getInitialLevelState = (levelIndex: number) => ({
  levelScore: 0,
  levelGoal: LEVEL_CONFIG[levelIndex]?.goal ?? 50,
  handsRemaining: MAX_HANDS_PER_LEVEL,
  usedHandsThisLevel: [] as HandId[],
  rollsUsedThisLevel: 0,
  levelWon: false,
  winShownYet: false,
  isWinAnimating: false,
});

const getInitialHandState = () => ({
  rollsRemaining: MAX_ROLLS_PER_HAND,
  hasRolledThisHand: false,
});

const getInitialDiceState = () => ({
  diceValues: [1, 1, 1, 1, 1],
  selectedDice: [false, false, false, false, false],
  isRolling: false,
  rollTrigger: 0,
  diceVisible: false,
});

const getInitialUIState = () => ({
  phase: "LEVEL_PLAY" as GamePhase,
  selectedHandId: null as HandId | null,
  overviewVisible: false,
  revealState: null as RevealState | null,
  upgradeOptions: [] as HandId[],
  shopDiceUpgradeType: null as DiceUpgradeType | null,
  diceEditorOpen: false,
  pendingUpgradeType: null as DiceUpgradeType | null,
  selectedEditorDie: null as number | null,
  selectedEditorFace: null as number | null,
});

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  ...getInitialRunState(),
  ...getInitialLevelState(0),
  ...getInitialHandState(),
  ...getInitialDiceState(),
  ...getInitialUIState(),

  // ───────────────────────────────────────────────────────────────────────────
  // Run Lifecycle
  // ───────────────────────────────────────────────────────────────────────────

  startNewRun: () => {
    set({
      ...getInitialRunState(),
      ...getInitialLevelState(0),
      ...getInitialHandState(),
      ...getInitialDiceState(),
      ...getInitialUIState(),
    });
  },

  startLevel: (levelIndex: number) => {
    const { handLevels, money } = get();
    set({
      currentLevelIndex: levelIndex,
      money,
      handLevels,
      ...getInitialLevelState(levelIndex),
      ...getInitialHandState(),
      ...getInitialDiceState(),
      phase: "LEVEL_PLAY",
      selectedHandId: null,
      revealState: null,
      upgradeOptions: [],
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Dice Actions
  // ───────────────────────────────────────────────────────────────────────────

  triggerRoll: () => {
    const { rollsRemaining, phase, selectedHandId, isRolling } = get();

    // Can only roll in LEVEL_PLAY phase, with rolls remaining, no hand selected
    if (
      phase !== "LEVEL_PLAY" ||
      rollsRemaining <= 0 ||
      selectedHandId !== null ||
      isRolling
    ) {
      return;
    }

    set((state) => ({
      rollTrigger: state.rollTrigger + 1,
      isRolling: true,
      rollsRemaining: state.rollsRemaining - 1,
      rollsUsedThisLevel: state.rollsUsedThisLevel + 1,
      hasRolledThisHand: true,
      diceVisible: true,
    }));
  },

  completeRoll: (values: number[]) => {
    const { rollsRemaining } = get();

    set({
      diceValues: values,
      isRolling: false,
      // Auto-unlock dice when no rolls remain (locks become useless)
      ...(rollsRemaining === 0 && {
        selectedDice: [false, false, false, false, false],
      }),
    });
  },

  setRolling: (isRolling: boolean) => {
    set({ isRolling });
  },

  toggleDiceLock: (index: number) => {
    const { hasRolledThisHand, isRolling, selectedHandId } = get();

    // Can only lock after first roll, when not rolling, and no hand selected
    if (!hasRolledThisHand || isRolling || selectedHandId !== null) {
      return;
    }

    set((state) => {
      const newSelected = [...state.selectedDice];
      newSelected[index] = !newSelected[index];
      return { selectedDice: newSelected };
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Hand Selection
  // ───────────────────────────────────────────────────────────────────────────

  selectHand: (handId: HandId) => {
    const {
      phase,
      hasRolledThisHand,
      isRolling,
      usedHandsThisLevel,
      diceValues,
    } = get();

    // Can only select in LEVEL_PLAY after rolling
    if (phase !== "LEVEL_PLAY" || !hasRolledThisHand || isRolling) {
      return;
    }

    // Check if hand is valid and not used
    const validHands = getValidHands(diceValues, new Set(usedHandsThisLevel));
    if (!validHands.includes(handId)) {
      return;
    }

    set({ selectedHandId: handId });
  },

  deselectHand: () => {
    set({ selectedHandId: null });
  },

  acceptHand: () => {
    const { selectedHandId, handLevels, diceValues, phase } = get();

    if (phase !== "LEVEL_PLAY" || !selectedHandId) {
      return;
    }

    // Get scoring breakdown for animation
    const level = handLevels[selectedHandId];
    const breakdown = getScoringBreakdown(selectedHandId, level, diceValues);

    // Start reveal animation and unlock all dice (locks no longer needed during scoring)
    set({
      selectedDice: [false, false, false, false, false],
      revealState: {
        active: true,
        breakdown,
        animationPhase: "counting",
        currentDieIndex: -1,
        accumulatedPips: 0,
      },
    });
  },

  updateRevealAnimation: (update: Partial<RevealState>) => {
    const { revealState } = get();
    if (!revealState) return;

    set({
      revealState: {
        ...revealState,
        ...update,
      },
    });
  },

  finalizeHand: () => {
    const {
      revealState,
      selectedHandId,
      levelScore,
      levelGoal,
      handsRemaining,
      usedHandsThisLevel,
    } = get();

    if (!revealState?.breakdown || !selectedHandId) {
      return;
    }

    const newScore = levelScore + revealState.breakdown.finalScore;
    const newHandsRemaining = handsRemaining - 1;
    const newUsedHands = [...usedHandsThisLevel, selectedHandId];
    const nowWon = newScore >= levelGoal;

    // Check for level end conditions
    if (newHandsRemaining === 0 && !nowWon) {
      // Lost - no hands remaining and didn't reach goal
      set({
        levelScore: newScore,
        handsRemaining: newHandsRemaining,
        usedHandsThisLevel: newUsedHands,
        phase: "LOSE_SCREEN",
        revealState: null,
        selectedHandId: null,
        diceVisible: false,
      });
      return;
    }

    // Player won - set levelWon: true and stay in LEVEL_PLAY
    // The CASH OUT button will appear in the footer
    set({
      levelScore: newScore,
      handsRemaining: newHandsRemaining,
      usedHandsThisLevel: newUsedHands,
      levelWon: nowWon,
      ...getInitialHandState(),
      selectedDice: [false, false, false, false, false],
      diceVisible: nowWon && !get().winShownYet, // Keep visible for animation if new win
      phase: "LEVEL_PLAY",
      revealState: null,
      selectedHandId: null,
    });

    // Trigger win moment if just won and not shown yet
    if (nowWon && !get().winShownYet) {
      set({
        winShownYet: true,
        isWinAnimating: true, // Blocks interaction
        diceVisible: true, // Explicitly ensure they are visible
      });
      // Animation sequence will be handled by UI components observing this state
      // They will call setIsWinAnimating(false) when done
    }
  },

  setIsWinAnimating: (isAnimating: boolean) => {
    // When animation ends, hide dice
    set({
      isWinAnimating: isAnimating,
      diceVisible: isAnimating ? true : false,
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Cash Out Flow
  // ───────────────────────────────────────────────────────────────────────────

  cashOutNow: () => {
    set({
      phase: "LEVEL_RESULT",
      diceVisible: false,
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Shop Actions
  // ───────────────────────────────────────────────────────────────────────────

  openShop: () => {
    // Calculate and apply rewards before entering shop
    const {
      money,
      levelScore,
      levelGoal,
      handsRemaining,
      rollsUsedThisLevel,
      diceEnhancements,
    } = get();

    const rewards = calculateRewards({
      currentMoney: money,
      score: levelScore,
      goal: levelGoal,
      handsRemaining,
      rollsUsedThisLevel,
    });

    // Determine dice upgrade type for shop (80/20 rarity)
    // Only spawn if player has at least one enhanceable face
    let shopDiceUpgrade: DiceUpgradeType | null = null;
    if (hasAnyEnhanceableDie(diceEnhancements)) {
      shopDiceUpgrade =
        Math.random() < DICE_UPGRADE_CONFIG.rarityPoints ? "points" : "mult";
    }

    set({
      money: rewards.newMoney,
      phase: "SHOP_MAIN",
      shopDiceUpgradeType: shopDiceUpgrade,
    });
  },

  selectUpgradeItem: () => {
    const options = getRandomUpgradeOptions();
    set({
      upgradeOptions: options,
      phase: "SHOP_PICK_UPGRADE",
    });
  },

  pickUpgradeHand: (handId: HandId) => {
    const { money, handLevels } = get();
    const currentLevel = handLevels[handId];
    const cost = getUpgradeCost(currentLevel);

    if (money < cost) {
      return; // Can't afford
    }

    const newHandLevels = { ...handLevels };
    newHandLevels[handId] = currentLevel + 1;

    set({
      money: money - cost,
      handLevels: newHandLevels,
      phase: "SHOP_MAIN",
    });
  },

  closeShopNextLevel: () => {
    const { currentLevelIndex } = get();
    const nextLevelIndex = currentLevelIndex + 1;

    if (nextLevelIndex >= LEVEL_CONFIG.length) {
      // Completed all 8 levels - show win screen
      set({ phase: "WIN_SCREEN" });
    } else {
      // Start next level
      get().startLevel(nextLevelIndex);
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Dice Editor Actions
  // ───────────────────────────────────────────────────────────────────────────

  openDiceEditor: (type: DiceUpgradeType) => {
    set({
      diceEditorOpen: true,
      pendingUpgradeType: type,
      selectedEditorDie: null,
      selectedEditorFace: null,
    });
  },

  closeDiceEditor: () => {
    set({
      diceEditorOpen: false,
      pendingUpgradeType: null,
      selectedEditorDie: null,
      selectedEditorFace: null,
    });
  },

  selectEditorDie: (index: number) => {
    set({
      selectedEditorDie: index,
      selectedEditorFace: null, // Reset face when selecting new die
    });
  },

  selectEditorFace: (face: number) => {
    set({ selectedEditorFace: face });
  },

  applyDiceUpgrade: () => {
    const {
      money,
      pendingUpgradeType,
      selectedEditorDie,
      selectedEditorFace,
      diceEnhancements,
    } = get();

    // Validate state
    if (
      pendingUpgradeType === null ||
      selectedEditorDie === null ||
      selectedEditorFace === null
    ) {
      return;
    }

    // Check affordability
    const cost = getDiceUpgradeCost(pendingUpgradeType);
    if (money < cost) {
      return;
    }

    // Apply the enhancement
    const newEnhancements = applyDiceEnhancement(
      selectedEditorDie,
      selectedEditorFace,
      pendingUpgradeType,
      diceEnhancements
    );

    set({
      money: money - cost,
      diceEnhancements: newEnhancements,
      diceEditorOpen: false,
      pendingUpgradeType: null,
      selectedEditorDie: null,
      selectedEditorFace: null,
      // Mark the shop item as purchased
      shopDiceUpgradeType: null,
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Utility
  // ───────────────────────────────────────────────────────────────────────────

  toggleOverview: () => {
    set((state) => ({ overviewVisible: !state.overviewVisible }));
  },

  forceWin: () => {
    // Debug helper - sets levelWon: true so CASH OUT button appears
    const { levelGoal } = get();
    set({
      levelScore: levelGoal,
      levelWon: true,
      winShownYet: true, // Mark as shown so we don't re-trigger animation
      phase: "LEVEL_PLAY",
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────

export const useValidHands = () => {
  const diceValues = useGameStore((s) => s.diceValues);
  const usedHandsThisLevel = useGameStore((s) => s.usedHandsThisLevel);
  const hasRolled = useGameStore((s) => s.hasRolledThisHand);
  const isRolling = useGameStore((s) => s.isRolling);

  if (!hasRolled || isRolling) return [];

  return getValidHands(diceValues, new Set(usedHandsThisLevel));
};

export const useRewardBreakdown = () => {
  const money = useGameStore((s) => s.money);
  const levelScore = useGameStore((s) => s.levelScore);
  const levelGoal = useGameStore((s) => s.levelGoal);
  const handsRemaining = useGameStore((s) => s.handsRemaining);
  const rollsUsedThisLevel = useGameStore((s) => s.rollsUsedThisLevel);

  return calculateRewards({
    currentMoney: money,
    score: levelScore,
    goal: levelGoal,
    handsRemaining,
    rollsUsedThisLevel,
  });
};

// Re-export types for convenience
export type { HandId, DiceUpgradeType };
