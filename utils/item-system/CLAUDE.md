# Item Trigger System

A Balatro-style item/relic system with event-driven triggers. Every item follows a consistent semantic grammar for predictable behavior and clear UI descriptions.

---

## Semantic Grammar

Every item follows this structure:

**WANN** (Trigger) → **WENN** (Condition) → **WAS** (Effect) → **WIE OFT** (Limit)

### UI Copy Convention (German)

Keep the order rigid in item descriptions:

> **Beim/Wenn/Nach …:** _Effekt._ _(Limit/Charges)_

**📖 Important**: When writing item descriptions, consult `ITEM_SEMANTICS.md` for the exact German phrasing for each trigger, condition, effect, and limiter.

---

## Trigger Families

All triggers are organized into families with precise timing:

| Family | Triggers | Purpose |
|--------|----------|---------|
| **Run** | `RUN_START`, `RUN_END`, `ITEM_GAINED`, `ITEM_REMOVED` | Meta-level run events |
| **Level** | `LEVEL_START`, `LEVEL_WON`, `LEVEL_RESULT_ENTER`, `SHOP_ENTER`, `SHOP_EXIT` | Between-round lifecycle |
| **Hand** | `HAND_START`, `HAND_FIRST_ROLL_START`, `HAND_LAST_ROLL_START`, `HAND_ACCEPTED`, `HAND_SCORED` | Hand attempt within level |
| **Roll** | `ROLL_COMMIT`, `ROLL_SETTLED`, `DIE_LOCK_TOGGLED` | Dice physics/values |
| **Scoring** | `SCORE_PRECALC`, `SCORE_PER_DIE`, `SCORE_APPLIED` | Scoring calculation |
| **Economy** | `SHOP_GENERATE_OFFER`, `SHOP_PURCHASE`, `MONEY_GAIN`, `MONEY_SPEND` | Money and shop events |

---

## Trigger Context

When triggers fire, handlers receive context with game state.

**See**: `TriggerContext` interface in `utils/itemTriggers.ts`

**Available fields**:
- `phase` - Current game phase
- `diceValues` - Array of current die values [1-6]
- `lockedDice` - Boolean array of locked states
- `money` - Current money amount
- `levelProgress` - Score, goal, hands remaining
- `selectedHandId` - Currently selected hand
- ... and more

Use context to create conditional effects based on game state.

---

## Effect Categories

Items can only perform effects from this constrained set:

### Scoring Math

Maps to scoring formula: `(basePoints + pips + bonusPoints) × (mult + bonusMult)`

- **+Punkte** → Adds to `bonusPoints`
- **+Pips** → Virtual pip count (increases pip total)
- **+Mult** / **×Mult** → Modifies `mult`

### Roll Manipulation

- **Extra roll** - Grant additional rolls for current hand
- **Refund roll** - Return a used roll
- **Set die value** - Force a die to show specific value
- **Bump value** - Increase die value by 1 (max 6)

### Lock Manipulation

- **Lock dice** - Lock specific dice automatically
- **Unlock dice** - Remove locks
- **Free locks** - Locking doesn't consume the lock action

### Economy

- **Discount** - Reduce shop item costs
- **Cashback** - Refund portion of purchase
- **Interest** - Earn money based on current balance
- **Bonus money** - Direct money gain

### Meta Progression

- **Upgrade hand level** - Increase hand level (+5 base points per level)
- **Add enhancement pips** - Grant pip enhancements to dice

---

## Creating Items

### Basic Example

```typescript
import {
  ItemDefinition,
  createRegisteredItem,
  registerItem,
  addBonusPoints,
  countDiceValue,
} from "../utils/itemSystem";

// Define an item
const myItem: ItemDefinition = {
  id: "snake_eyes",
  name: "Schlangenaugen",
  description: "Nach der Wertung: Wenn genau 2 Einsen, +10 Punkte.",
  rarity: "uncommon",
  cost: 7,
  icon: "snake.png",
  triggers: [
    {
      triggerId: "SCORE_APPLIED",
      condition: (ctx) => countDiceValue(ctx, 1) === 2,
      handler: addBonusPoints(10),
    },
  ],
};

// At run start, register the item
registerItem(createRegisteredItem(myItem));
```

### Breakdown

1. **id**: Unique identifier (used for tracking, persistence)
2. **name**: Display name (German)
3. **description**: Full effect description following grammar
4. **rarity**: "common" | "uncommon" | "rare" | "epic"
5. **cost**: Shop price
6. **icon**: Asset filename (from `assets/items/`)
7. **triggers**: Array of trigger definitions
   - **triggerId**: When to fire (from Trigger Families table)
   - **condition** (optional): Check if effect should apply
   - **handler**: What effect to apply

---

## Effect Factories

Reusable effect functions from `utils/itemEffects.ts`:

### Scoring

```typescript
addBonusPoints(amount: number)         // +10 points
addBonusMult(amount: number)           // +1 mult
multiplyMult(multiplier: number)       // ×2 mult
```

### Scaling Effects

```typescript
addPointsPerLockedDie(pointsPerDie: number)     // +5 per locked die
addMultPerDieValue(dieValue: number)            // +1 mult per 6
addInterest(percentage: number)                 // +10% of current money
```

### Roll/Lock

```typescript
grantExtraRolls(count: number)         // +1 roll
refundRoll()                           // Return last roll
lockDie(dieIndex: number)              // Lock die 0-4
unlockDie(dieIndex: number)            // Unlock die 0-4
```

### Economy

```typescript
addMoney(amount: number)               // +$5
applyDiscount(percentage: number)      // 20% off
```

---

## Limiters

Control trigger frequency with limiters.

**See**: `LimiterType` in `utils/itemDefinitions.ts`

| Limiter Type | Reset Timing | Use Case |
|--------------|--------------|----------|
| **perHand** | `HAND_START` | Once per hand attempt (resets 4× per level) |
| **perLevel** | `LEVEL_START` | Once per level (resets 8× per run) |
| **perShop** | `SHOP_ENTER` | Once per shop visit |
| **charges** | Never | Total uses across entire run |
| **cooldown** | Ticks at `HAND_SCORED` | Hands between triggers |

### Example with Limiter

```typescript
const limitedItem: ItemDefinition = {
  id: "lucky_charm",
  name: "Glücksbringer",
  description: "Beim ersten Wurf: +1 Wurf. (1× pro Level)",
  rarity: "rare",
  cost: 12,
  icon: "lucky.png",
  triggers: [
    {
      triggerId: "HAND_FIRST_ROLL_START",
      handler: grantExtraRolls(1),
      limiter: { type: "perLevel", count: 1 }, // Only once per level
    },
  ],
};
```

---

## Trigger Emission Points

Triggers are emitted in `store/gameStore.ts` at these action points:

| Action | Triggers Emitted | Notes |
|--------|------------------|-------|
| `startNewRun()` | `RUN_START` | Run initialization |
| `startLevel()` | `LEVEL_START`, `HAND_START` | Level + first hand |
| `triggerRoll()` | `ROLL_COMMIT`, `HAND_FIRST_ROLL_START`\*, `HAND_LAST_ROLL_START`\* | \*Conditional |
| `completeRoll()` | `ROLL_SETTLED` | After dice settle |
| `toggleDiceLock()` | `DIE_LOCK_TOGGLED` | On lock/unlock |
| `acceptHand()` | `HAND_ACCEPTED` | Before scoring |
| `finalizeHand()` | `HAND_SCORED`, `LEVEL_WON`\*, `HAND_START`\*, `RUN_END`\* | \*Conditional |
| `cashOutNow()` | `LEVEL_RESULT_ENTER` | Transition to result |
| `openShop()` | `MONEY_GAIN`\*, `SHOP_ENTER`, `SHOP_GENERATE_OFFER` | \*Conditional |
| `closeShopNextLevel()` | `SHOP_EXIT`, `RUN_END`\* | \*Conditional |

\*Conditional triggers fire based on game state (e.g., `LEVEL_WON` only if goal reached)

---

## File Structure

```
utils/
├── itemTriggers.ts      # Core trigger types, emitter, context (591 lines)
├── itemEffects.ts       # Effect categories, factories, applicators (352 lines)
├── itemDefinitions.ts   # Item types, catalog, example items (429 lines)
└── itemSystem.ts        # Barrel exports (117 lines)

items/
├── index.ts             # Items registry + getShopItemById, SHOP_ITEMS
└── fokus.ts             # Fokus item (hands → rolls conversion)
```

**Note**: These files remain flat in `utils/` (not in a subdirectory), but documentation is grouped in `utils/item-system/` for logical organization.

---

## Integration Notes

### Registration

```typescript
// At run start (store/gameStore.ts)
clearAllItems();  // Clear previous run's items
ownedItems.forEach(itemDef => {
  registerItem(createRegisteredItem(itemDef));
});
```

### Usage Counter Resets

- **perHand**: Reset at `HAND_START` (4× per level)
- **perLevel**: Reset at `LEVEL_START` (8× per run)
- **perShop**: Reset at `SHOP_ENTER` (1× per level)

### Cooldowns

- Tick down at `HAND_SCORED`
- Prevent trigger until cooldown reaches 0

### Effect Accumulation

```typescript
// Effects accumulate in EffectContext
const effects = new EffectContext();
emitTrigger("SCORE_APPLIED", context, effects);

// Apply accumulated effects
applyEffects(effects);  // Modifies game state
```

---

## Testing Items

1. **Define item** in `items/my_item.ts`
2. **Register in shop** in `items/index.ts` → `SHOP_ITEMS`
3. **Add icon mapping** in `components/ui/ShopContent.tsx` and `components/scoring/SpecialSection.tsx`
4. **Test in-game**:
   - Purchase from shop
   - Verify trigger fires at correct timing
   - Check effect applies correctly
   - Validate limiter behavior

---

## Example: Complete Item

```typescript
// items/double_sixes.ts
import type { ItemDefinition } from "../utils/itemDefinitions";
import { addBonusPoints, countDiceValue } from "../utils/itemEffects";

export const DOUBLE_SIXES: ItemDefinition = {
  id: "double_sixes",
  name: "Doppelte Sechs",
  description: "Nach der Wertung: Wenn genau 2 Sechsen, +20 Punkte. (2× pro Level)",
  rarity: "uncommon",
  cost: 8,
  icon: "double_six.png",
  triggers: [
    {
      triggerId: "SCORE_APPLIED",
      condition: (ctx) => countDiceValue(ctx, 6) === 2,
      handler: addBonusPoints(20),
      limiter: { type: "perLevel", count: 2 },
    },
  ],
};
```

---

## Related Documentation

- **Item creation guide**: See `items/CLAUDE.md` for adding purchasable items
- **Item semantics**: See `ITEM_SEMANTICS.md` for German phrasing conventions
- **Game store**: See `store/gameStore.ts` for trigger emission points
- **Effect types**: See `utils/itemEffects.ts` for all available effect factories
