# Purchasable Items Guide

Items can be purchased in the shop and provide permanent effects for the run. Each item follows the trigger grammar and integrates with the item trigger system.

For detailed information about the trigger system, see `utils/item-system/CLAUDE.md`.

---

## Adding a New Item (3 Steps)

### Step 1: Create Item File

Create a new file in `items/` directory:

```typescript
// items/my_item.ts
import type { ItemDefinition } from "../utils/itemDefinitions";
import type { TriggerHandler } from "../utils/itemTriggers";

const myEffect: TriggerHandler = (context, effects) => {
  // Modify effects based on context
  effects.bonusPoints += 10;
};

export const MY_ITEM: ItemDefinition = {
  id: "my_item", // Unique identifier
  name: "Mein Item", // Display name (German)
  description: "Beim Start des Levels: +10 Punkte.", // German description
  rarity: "uncommon", // common | uncommon | rare | epic
  cost: 7, // Shop price ($)
  icon: "my_icon.png", // From assets/items/
  triggers: [
    {
      triggerId: "LEVEL_START",
      handler: myEffect,
    },
  ],
};
```

### Step 2: Register in Shop

Add to `items/index.ts`:

```typescript
import { MY_ITEM } from "./my_item";

export const SHOP_ITEMS: ItemDefinition[] = [
  FOKUS_ITEM,
  MY_ITEM, // Add here
];

// Export for direct imports
export { MY_ITEM } from "./my_item";
```

### Step 3: Add Icon Mapping

**In `components/ui/ShopContent.tsx`**:

```typescript
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/brain.png"),
  my_item: require("../../assets/items/my_icon.png"), // Add here
};
```

**In `components/scoring/SpecialSection.tsx`**:

```typescript
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/brain.png"),
  my_item: require("../../assets/items/my_icon.png"), // Add here
};
```

---

## Current Items

| ID      | Name  | Cost | Trigger       | Effect                                        |
| ------- | ----- | ---- | ------------- | --------------------------------------------- |
| `fokus` | Fokus | $7   | `LEVEL_START` | Converts extra hands into rolls (4H+3R→1H+6R) |

---

## Item UI Flow (5 Steps)

### 1. Shop Display

Items appear in the shop grid (`ShopContent.tsx`) with:

- Item icon (from `assets/items/`)
- Item name
- Price (gold coin icon + cost)
- Affordable/unaffordable/soon states

**Shop grid layout**: 2×2 grid with shop item cards

### 2. Detail Modal

Tapping an item shows `ItemDetailModal` with:

- Large icon in recessed container
- Item name (displayMedium)
- Full description with highlighted keywords
- Rarity badge (chip)
- **"KAUFEN" CTA** (with price, only in shop context)

### 3. Purchase

On purchase:

1. Item is added to `ownedItems` in gameStore
2. Money is deducted
3. Item is registered with trigger system via `registerItem()`
4. Modal closes
5. Shop updates to show item as purchased

### 4. Display in Scoring Grid

Owned items appear in `SpecialSection` at top of scoring grid:

- Row of item icons with borders
- Tappable to view details
- Always visible during gameplay

### 5. Info Modal (No Purchase)

Tapping an owned item shows the same detail modal but:

- **No "KAUFEN" button** (item already owned)
- Shows full description and effect
- Dismiss with tap outside or close button

---

## EffectContext Fields

Items modify effect fields in handlers. Available fields in `EffectContext` (`utils/itemEffects.ts`):

| Field               | Type   | Purpose                        |
| ------------------- | ------ | ------------------------------ |
| `bonusPoints`       | number | Add to scoring points          |
| `bonusMult`         | number | Add to scoring mult            |
| `extraRolls`        | number | Grant additional rolls         |
| `handsToRemove`     | number | Reduce available hands (Fokus) |
| `moneyChange`       | number | Add/remove money               |
| `diceModifications` | Map    | Set/bump die values            |
| `lockChanges`       | Map    | Lock/unlock dice               |

**Usage example**:

```typescript
const myHandler: TriggerHandler = (context, effects) => {
  effects.bonusPoints += 20; // +20 points
  effects.extraRolls += 1; // +1 roll
};
```

---

## ItemDetailModal Features

### Highlighted Keywords

Specific words are automatically highlighted in the description:

| German Word               | Color | Purpose                        |
| ------------------------- | ----- | ------------------------------ |
| "Hände", "Hand"           | Cyan  | Emphasize hand references      |
| "Würfe", "Wurf", "Würfel" | Gold  | Emphasize roll/dice references |

### Icon Container

The item icon appears in a recessed container for visual depth:

- Darker background than panel
- Top shadow for "sunken" effect
- Icon centered within

### Optional Purchase CTA

When in shop context:

- Shows "KAUFEN" button with price
- Button state: affordable (mint) or unaffordable (muted)
- Price displayed with coin icon

When viewing owned item:

- No CTA button
- Modal is informational only

---

## Item Icon Guidelines

### Asset Requirements

- **Format**: PNG with transparency
- **Size**: 64×64px minimum (icons scale to DIMENSIONS.iconSize.xxl)
- **Location**: `assets/items/`
- **Naming**: lowercase with underscores (e.g., `lucky_charm.png`)

### Visual Style

- Clear silhouette (easily recognizable at small size)
- High contrast for visibility on dark backgrounds
- Consistent style with existing icons (brain.png reference)

---

## Testing Checklist

Before committing a new item:

- [ ] Item file created in `items/`
- [ ] Exported from `items/index.ts` and added to `SHOP_ITEMS`
- [ ] Icon mapping added to both `ShopContent.tsx` and `SpecialSection.tsx`
- [ ] Icon asset exists in `assets/items/`
- [ ] Description follows German grammar (consult ITEM_SEMANTICS.md)
- [ ] Trigger fires at correct game event
- [ ] Effect applies correctly (test in-game)
- [ ] Limiter works as expected (if applicable)
- [ ] Item appears in shop grid
- [ ] Detail modal opens on tap
- [ ] Purchase flow works (money deduction, item registration)
- [ ] Item appears in SpecialSection after purchase
- [ ] Info modal works when tapping owned item

---

## Example: Complete Item Implementation

```typescript
// items/lucky_clover.ts
import type { ItemDefinition } from "../utils/itemDefinitions";
import { addBonusPoints } from "../utils/itemEffects";

export const LUCKY_CLOVER: ItemDefinition = {
  id: "lucky_clover",
  name: "Glücksklee",
  description: "Nach der Wertung: Wenn alle Würfel gesperrt sind, +30 Punkte.",
  rarity: "rare",
  cost: 12,
  icon: "lucky_clover.png",
  triggers: [
    {
      triggerId: "SCORE_APPLIED",
      condition: (ctx) => ctx.lockedDice.every((locked) => locked),
      handler: addBonusPoints(30),
    },
  ],
};
```

**In items/index.ts**:

```typescript
import { LUCKY_CLOVER } from "./lucky_clover";
export const SHOP_ITEMS = [FOKUS_ITEM, LUCKY_CLOVER];
export { LUCKY_CLOVER } from "./lucky_clover";
```

**Icon mappings** (both ShopContent.tsx and SpecialSection.tsx):

```typescript
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/brain.png"),
  lucky_clover: require("../../assets/items/lucky_clover.png"),
};
```

---

## Fokus Item Reference

The Fokus item is the first purchasable item and serves as a template:

**Effect**: Converts extra hands into rolls at level start

- 4 hands + 3 rolls → 1 hand + 6 rolls (net: -3 hands, +3 rolls)
- German description: "Beim Start des Levels: Tausche 3 Hände in 3 Würfe."

**Implementation**: See `items/fokus.ts` for complete code

**Key patterns**:

- Uses `LEVEL_START` trigger (fires once per level)
- Modifies `handsToRemove` and `extraRolls` in effect context
- Clear trade-off: more rolls but fewer attempts

---

## Related Documentation

- **Item trigger system**: See `utils/item-system/CLAUDE.md` for trigger grammar, effect factories, limiters
- **Item semantics**: See `ITEM_SEMANTICS.md` for German phrasing conventions
- **Shop UI**: See `components/ui/ShopContent.tsx` for shop grid implementation
- **Detail modal**: See `components/modals/ItemDetailModal.tsx` for modal UI
- **Special section**: See `components/scoring/SpecialSection.tsx` for owned items display
