import { create } from "zustand";

interface GameState {
  diceValues: number[];
  isRolling: boolean;
  rollTrigger: number; // Increment to signal a re-roll
  setRolling: (isRolling: boolean) => void;
  setDiceValues: (values: number[]) => void;
  triggerRoll: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  diceValues: [1, 1, 1, 1, 1], // Default state
  isRolling: false,
  rollTrigger: 0,
  setRolling: (isRolling) => set({ isRolling }),
  setDiceValues: (values) => set({ diceValues: values }),
  triggerRoll: () =>
    set((state) => ({ rollTrigger: state.rollTrigger + 1, isRolling: true })),
}));
