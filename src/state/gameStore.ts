import { create } from "zustand";

type GameState = {
  money: number;
  turn: number; // 1..13
  roll: number; // 1..3
  diceCount: number;
  held: boolean[]; // which dice are locked/held
  faces: number[]; // settled results (1..6)
  isRolling: boolean;

  toggleHeld: (i: number) => void;
  startRoll: () => void;
  commitRollResult: (faces: number[]) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  money: 10,
  turn: 1,
  roll: 1,
  diceCount: 5,
  held: Array(5).fill(false),
  faces: Array(5).fill(1),
  isRolling: false,

  toggleHeld: (i) =>
    set((s) => {
      const held = s.held.slice();
      held[i] = !held[i];
      return { held };
    }),

  startRoll: () => set({ isRolling: true }),

  commitRollResult: (faces) => {
    const { roll } = get();
    set({
      faces,
      isRolling: false,
      roll: Math.min(3, roll + 1),
    });
  },
}));
