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
  getNextEnhanceablePipIndex,
  DICE_UPGRADE_CONFIG,
} from "../utils/gameCore";
import { CATEGORIES } from "../utils/yahtzeeScoring";
// Item trigger system
import {
  emitTrigger,
  buildTriggerContext,
  clearAllItems,
  resetLevelUsage,
  resetHandUsage,
  resetShopUsage,
  tickCooldowns,
  applyEffects,
  registerItem,
  createRegisteredItem,
  type TriggerType,
  type GameStateSnapshot,
} from "../utils/itemSystem";
// Items registry
import { SHOP_ITEMS, getShopItemById } from "../items";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GamePhase =
  | "LEVEL_PLAY" // Rolling/selecting/accepting (CASH OUT button appears when levelWon=true)
  | "LEVEL_RESULT" // Result screen with rewards
  | "SHOP_MAIN" // Shop grid (3 placeholder + 1 upgrade)
  | "SHOP_PICK_UPGRADE" // Pick 1 of 3 hands to upgrade
  | "DICE_EDITOR_DIE" // Select which die to enhance
  | "DICE_EDITOR_FACE" // Select which face to enhance
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
  ownedItems: string[]; // IDs of purchased items

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
  shopItemId: string | null; // Which purchasable item is available in shop (null if none/purchased)

  // Item modal state (global, rendered in App.tsx)
  itemModalId: string | null; // Item ID to show in modal (null = closed)
  itemModalShowPurchase: boolean; // Whether to show purchase CTA

  // Dice editor state (controlled by phase, not modal)
  pendingUpgradeType: DiceUpgradeType | null;
  selectedEditorDie: number | null; // 0-4
  selectedEditorFace: number | null; // 1-6
  enhancedFace: number | null; // Face that was just enhanced (for animation)
  enhancedPipIndex: number | null; // Pip index that was just enhanced (for animation)

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
  purchaseItem: (itemId: string) => void;

  // Dice editor actions
  openDiceEditor: (type: DiceUpgradeType) => void;
  closeDiceEditor: () => void;
  advanceToFaceEditor: () => void;
  backFromFaceEditor: () => void;
  selectEditorDie: (index: number) => void;
  selectEditorFace: (face: number) => void;
  applyDiceUpgrade: () => void;

  // Utility
  toggleOverview: () => void;
  forceWin: () => void;
  setIsWinAnimating: (isAnimating: boolean) => void;

  // Item modal actions
  openItemModal: (itemId: string, showPurchase: boolean) => void;
  closeItemModal: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial States
// ─────────────────────────────────────────────────────────────────────────────

const getInitialRunState = () => ({
  currentLevelIndex: 0,
  money: 0,
  handLevels: getInitialHandLevels(),
  diceEnhancements: getInitialDiceEnhancements(),
  ownedItems: [] as string[],
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
  shopItemId: null as string | null,
  itemModalId: null as string | null,
  itemModalShowPurchase: false,
  pendingUpgradeType: null as DiceUpgradeType | null,
  selectedEditorDie: null as number | null,
  selectedEditorFace: null as number | null,
  enhancedFace: null as number | null,
  enhancedPipIndex: null as number | null,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Convert GameState to GameStateSnapshot for trigger context
// ─────────────────────────────────────────────────────────────────────────────

const getSnapshot = (state: GameState): GameStateSnapshot => ({
  phase: state.phase,
  currentLevelIndex: state.currentLevelIndex,
  money: state.money,
  levelScore: state.levelScore,
  levelGoal: state.levelGoal,
  handsRemaining: state.handsRemaining,
  rollsRemaining: state.rollsRemaining,
  hasRolledThisHand: state.hasRolledThisHand,
  diceValues: state.diceValues,
  selectedDice: state.selectedDice,
  selectedHandId: state.selectedHandId,
  diceEnhancements: state.diceEnhancements,
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
    // Clear all items from previous run
    clearAllItems();

    set({
      ...getInitialRunState(),
      ...getInitialLevelState(0),
      ...getInitialHandState(),
      ...getInitialDiceState(),
      ...getInitialUIState(),
    });

    // Emit RUN_START trigger (items would register before this in full implementation)
    const state = get();
    emitTrigger("RUN_START", buildTriggerContext(getSnapshot(state)));
  },

  startLevel: (levelIndex: number) => {
    const { handLevels, money } = get();

    // Reset item usage counters for new level
    resetLevelUsage();
    resetHandUsage();

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

    // Emit LEVEL_START trigger after state is set
    const state = get();
    const effects = emitTrigger(
      "LEVEL_START",
      buildTriggerContext(getSnapshot(state))
    );

    // Apply Fokus item effects: convert extra hands into extra rolls
    if (effects.handsToRemove > 0 || effects.extraRolls > 0) {
      set((s) => ({
        rollsRemaining: s.rollsRemaining + effects.extraRolls,
        handsRemaining: Math.max(1, s.handsRemaining - effects.handsToRemove),
      }));
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Dice Actions
  // ───────────────────────────────────────────────────────────────────────────

  triggerRoll: () => {
    const state = get();
    const {
      rollsRemaining,
      phase,
      selectedHandId,
      isRolling,
      hasRolledThisHand,
    } = state;

    // Can only roll in LEVEL_PLAY phase, with rolls remaining, no hand selected
    if (
      phase !== "LEVEL_PLAY" ||
      rollsRemaining <= 0 ||
      selectedHandId !== null ||
      isRolling
    ) {
      return;
    }

    // Emit ROLL_COMMIT trigger (before physics)
    // Check if this is the first or last roll for conditional triggers
    const isFirst = !hasRolledThisHand;
    const isLast = rollsRemaining === 1;

    emitTrigger("ROLL_COMMIT", buildTriggerContext(getSnapshot(state)));

    // Also emit specific first/last roll triggers
    if (isFirst) {
      emitTrigger(
        "HAND_FIRST_ROLL_START",
        buildTriggerContext(getSnapshot(state))
      );
    }
    if (isLast) {
      emitTrigger(
        "HAND_LAST_ROLL_START",
        buildTriggerContext(getSnapshot(state))
      );
    }

    set((s) => ({
      rollTrigger: s.rollTrigger + 1,
      isRolling: true,
      rollsRemaining: s.rollsRemaining - 1,
      rollsUsedThisLevel: s.rollsUsedThisLevel + 1,
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

    // Emit ROLL_SETTLED trigger (dice settled, values final)
    const state = get();
    emitTrigger("ROLL_SETTLED", buildTriggerContext(getSnapshot(state)));
  },

  setRolling: (isRolling: boolean) => {
    set({ isRolling });
  },

  toggleDiceLock: (index: number) => {
    const { hasRolledThisHand, isRolling, selectedHandId, selectedDice } =
      get();

    // Can only lock after first roll, when not rolling, and no hand selected
    if (!hasRolledThisHand || isRolling || selectedHandId !== null) {
      return;
    }

    const wasLocked = selectedDice[index];

    set((state) => {
      const newSelected = [...state.selectedDice];
      newSelected[index] = !newSelected[index];
      return { selectedDice: newSelected };
    });

    // Emit DIE_LOCK_TOGGLED trigger
    const newState = get();
    emitTrigger(
      "DIE_LOCK_TOGGLED",
      buildTriggerContext(getSnapshot(newState), {
        toggledDieIndex: index,
        isNowLocked: !wasLocked,
      })
    );
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
    const { selectedHandId, handLevels, diceValues, phase, diceEnhancements } =
      get();

    if (phase !== "LEVEL_PLAY" || !selectedHandId) {
      return;
    }

    // Get scoring breakdown for animation (including enhancement bonuses)
    const level = handLevels[selectedHandId];
    const breakdown = getScoringBreakdown(
      selectedHandId,
      level,
      diceValues,
      diceEnhancements
    );

    // Emit HAND_ACCEPTED trigger before revealing
    emitTrigger(
      "HAND_ACCEPTED",
      buildTriggerContext(getSnapshot(get()), {
        breakdown,
        contributingIndices: breakdown.contributingIndices,
      })
    );

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

    // Emit HAND_SCORED trigger (after scoring calculated)
    emitTrigger(
      "HAND_SCORED",
      buildTriggerContext(getSnapshot(get()), {
        breakdown: revealState.breakdown,
        contributingIndices: revealState.breakdown.contributingIndices,
      })
    );

    // Tick cooldowns after hand is scored
    tickCooldowns();

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

      // Emit RUN_END trigger for lose
      emitTrigger("RUN_END", buildTriggerContext(getSnapshot(get())));
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

    // Reset hand usage counters for new hand
    resetHandUsage();

    // Emit HAND_START trigger for the new hand
    emitTrigger("HAND_START", buildTriggerContext(getSnapshot(get())));

    // Trigger win moment if just won and not shown yet
    if (nowWon && !get().winShownYet) {
      // Emit LEVEL_WON trigger
      emitTrigger("LEVEL_WON", buildTriggerContext(getSnapshot(get())));

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

    // Emit LEVEL_RESULT_ENTER trigger
    emitTrigger("LEVEL_RESULT_ENTER", buildTriggerContext(getSnapshot(get())));
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
      ownedItems,
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

    // Determine which item to spawn in shop
    // For now, spawn Fokus if not already owned
    let shopItem: string | null = null;
    const availableItems = SHOP_ITEMS.filter(
      (item) => !ownedItems.includes(item.id)
    );
    if (availableItems.length > 0) {
      // Pick a random available item (for now just pick the first one)
      shopItem = availableItems[0].id;
    }

    set({
      money: rewards.newMoney,
      phase: "SHOP_MAIN",
      shopDiceUpgradeType: shopDiceUpgrade,
      shopItemId: shopItem,
    });

    // Reset shop usage counters
    resetShopUsage();

    // Emit MONEY_GAIN trigger for rewards
    const moneyGained = rewards.newMoney - money;
    if (moneyGained > 0) {
      emitTrigger(
        "MONEY_GAIN",
        buildTriggerContext(getSnapshot(get()), {
          moneyDelta: moneyGained,
        })
      );
    }

    // Emit SHOP_ENTER trigger
    emitTrigger("SHOP_ENTER", buildTriggerContext(getSnapshot(get())));

    // Emit SHOP_GENERATE_OFFER for items to hook into
    emitTrigger("SHOP_GENERATE_OFFER", buildTriggerContext(getSnapshot(get())));
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
    // Emit SHOP_EXIT trigger before leaving
    emitTrigger("SHOP_EXIT", buildTriggerContext(getSnapshot(get())));

    const { currentLevelIndex } = get();
    const nextLevelIndex = currentLevelIndex + 1;

    if (nextLevelIndex >= LEVEL_CONFIG.length) {
      // Completed all 8 levels - show win screen
      set({ phase: "WIN_SCREEN" });

      // Emit RUN_END trigger for win
      emitTrigger("RUN_END", buildTriggerContext(getSnapshot(get())));
    } else {
      // Start next level (triggers LEVEL_START internally)
      get().startLevel(nextLevelIndex);
    }
  },

  purchaseItem: (itemId: string) => {
    const { money, ownedItems } = get();

    // Get item definition
    const itemDef = getShopItemById(itemId);
    if (!itemDef) {
      console.warn(`[purchaseItem] Unknown item ID: ${itemId}`);
      return;
    }

    // Check if already owned
    if (ownedItems.includes(itemId)) {
      console.warn(`[purchaseItem] Already owned: ${itemId}`);
      return;
    }

    // Check affordability
    if (money < itemDef.cost) {
      console.warn(`[purchaseItem] Cannot afford: ${itemId}`);
      return;
    }

    // Purchase the item
    set({
      money: money - itemDef.cost,
      ownedItems: [...ownedItems, itemId],
      shopItemId: null, // Remove from shop after purchase
    });

    // Register the item with the trigger system
    registerItem(createRegisteredItem(itemDef));

    // Emit SHOP_PURCHASE trigger
    emitTrigger(
      "SHOP_PURCHASE",
      buildTriggerContext(getSnapshot(get()), {
        purchasedItemId: itemId,
        moneyDelta: -itemDef.cost,
      })
    );
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Dice Editor Actions
  // ───────────────────────────────────────────────────────────────────────────

  openDiceEditor: (type: DiceUpgradeType) => {
    set({
      phase: "DICE_EDITOR_DIE",
      pendingUpgradeType: type,
      selectedEditorDie: 0, // Default to Die 1
      selectedEditorFace: null,
    });
  },

  closeDiceEditor: () => {
    set({
      phase: "SHOP_MAIN",
      pendingUpgradeType: null,
      selectedEditorDie: null,
      selectedEditorFace: null,
    });
  },

  advanceToFaceEditor: () => {
    const { selectedEditorDie } = get();
    if (selectedEditorDie !== null) {
      set({
        phase: "DICE_EDITOR_FACE",
        selectedEditorFace: 1, // Default to Face 1
      });
    }
  },

  backFromFaceEditor: () => {
    set({
      phase: "DICE_EDITOR_DIE",
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

    // Get the pip index that will be enhanced (for animation)
    const pipIndex = getNextEnhanceablePipIndex(
      selectedEditorDie,
      selectedEditorFace,
      diceEnhancements
    );

    // Apply the enhancement
    const newEnhancements = applyDiceEnhancement(
      selectedEditorDie,
      selectedEditorFace,
      pendingUpgradeType,
      diceEnhancements
    );

    // Set state to show animation (keep phase, set enhanced info)
    set({
      money: money - cost,
      diceEnhancements: newEnhancements,
      enhancedFace: selectedEditorFace,
      enhancedPipIndex: pipIndex,
      // Mark the shop item as purchased
      shopDiceUpgradeType: null,
    });

    // Delay transition to allow animation to play (600ms)
    setTimeout(() => {
      set({
        phase: "SHOP_MAIN",
        pendingUpgradeType: null,
        selectedEditorDie: null,
        selectedEditorFace: null,
        enhancedFace: null,
        enhancedPipIndex: null,
      });
    }, 600);
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

  // ───────────────────────────────────────────────────────────────────────────
  // Item Modal Actions
  // ───────────────────────────────────────────────────────────────────────────

  openItemModal: (itemId: string, showPurchase: boolean) => {
    set({
      itemModalId: itemId,
      itemModalShowPurchase: showPurchase,
    });
  },

  closeItemModal: () => {
    set({
      itemModalId: null,
      itemModalShowPurchase: false,
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
