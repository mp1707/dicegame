/**
 * Fokus Item - Converts extra hands into extra rolls
 *
 * Effect: At the start of the first hand, all available hands > 1
 * are converted into rolls. Player has only 1 hand but more rolls.
 * (e.g., 4 hands + 3 rolls → 1 hand + 6 rolls)
 */

import type { ItemDefinition } from "../utils/itemDefinitions";
import type { TriggerHandler } from "../utils/itemTriggers";

/**
 * Custom effect handler for Fokus
 * Converts handsRemaining - 1 into extra rolls
 */
const convertHandsToRolls: TriggerHandler = (context, effects) => {
  // Only trigger if we have more than 1 hand remaining
  // This will be applied at LEVEL_START
  if (context.handsRemaining > 1) {
    const handsToConvert = context.handsRemaining - 1;
    effects.extraRolls += handsToConvert;
    effects.handsToRemove = handsToConvert;
  }
};

export const FOKUS_ITEM: ItemDefinition = {
  id: "fokus",
  name: "Fokus",
  description:
    "Beim Start des Levels: Alle zusätzlichen Hände werden in Würfe umgewandelt. Du hast nur eine Hand aber mehr Würfe.",
  rarity: "rare",
  cost: 7,
  icon: "skull.png",
  triggers: [
    {
      triggerId: "LEVEL_START",
      handler: convertHandsToRolls,
    },
  ],
};
