# Roguelike Yahtzee Migration

This document tracks the migration from classic 13-round Yahtzee to a Balatro-inspired roguelike loop.

## Overview

**Completed**: Core game loop migration from round-based to run/level/hand model.

### Game Structure

| Aspect | Before | After |
|--------|--------|-------|
| Game Unit | 13 rounds | 8 levels per run |
| Actions per unit | 1 category per round | 4 hands per level |
| Rolls | 3 per round | 3 per hand attempt |
| Scoring | Classic Yahtzee | Balatro formula: `(base + pips) × mult` |
| Progression | Higher target score | Level goals + hand upgrades |
| End condition | 13 rounds complete | Beat level 8 or run out of hands |

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `utils/gameCore.ts` | Pure TS scoring, validation, level config, reward calculation |
| `components/ui/ScoreRow.tsx` | Selected hand display with reveal animation |
| `components/screens/ResultScreen.tsx` | Level complete rewards breakdown |
| `components/screens/ShopScreen.tsx` | Shop grid with upgrade option |
| `components/screens/UpgradePickerScreen.tsx` | Pick 1 of 3 hands to upgrade |
| `components/screens/EndScreen.tsx` | Win/Lose screens |
| `components/screens/index.ts` | Barrel exports |

### Modified Files

| File | Changes |
|------|---------|
| `store/gameStore.ts` | Complete refactor to run/level/hand state model |
| `components/ui/GlassHeader.tsx` | 2-row layout: Level+Hands+Money / Stand+Ziel |
| `components/ui/FooterControls.tsx` | New phase buttons, removed scratch mode |
| `components/scoring/UpperSection.tsx` | Uses `usedHandsThisLevel`, dynamic hand levels |
| `components/scoring/LowerSection.tsx` | Same + Cash Out button when level won |
| `components/modals/OverviewModal.tsx` | Shows hand levels + formulas |
| `App.tsx` | Conditional screen rendering based on phase |

### Removed Features

- Scratch mode (no more scratching categories)
- Classic Yahtzee upper section bonus (63+ = 35 points)
- Round-based progression

---

## Game Loop Flow

```
START RUN
    ↓
LEVEL 1 (goal: 50)
    ↓
[LEVEL_PLAY Phase]
    ├── Roll dice (3 rolls per hand)
    ├── Lock/unlock dice
    ├── Select valid hand → shows formula "(BP + pips) × mult"
    ├── Press ANNEHMEN → reveal animation
    │   ├── Pips count up
    │   └── Final score displayed
    ├── Hand marked as used
    └── Score added to level total
    ↓
Score >= Goal?
    ├── YES → [CASHOUT_CHOICE Phase]
    │   ├── CASH OUT → [LEVEL_RESULT Phase]
    │   └── PRESS ON → continue [LEVEL_PLAY] (Cash Out button visible)
    └── NO → Continue if hands remain, else [LOSE_SCREEN]
    ↓
[LEVEL_RESULT Phase]
    ├── Show reward breakdown
    └── CTA: SHOP
    ↓
[SHOP_MAIN Phase]
    ├── 3 placeholder items (disabled)
    ├── UPGRADE HAND → [SHOP_PICK_UPGRADE]
    │   ├── Pick 1 of 3 random hands
    │   └── Cost: $6 + handLevel
    └── CTA: NEXT LEVEL
    ↓
Level 8 complete? → [WIN_SCREEN] : Start next level
```

---

## Scoring System

### Formula

```
score = (basePoints + pips) × mult
```

### Base Points at Level 1

| Hand | Base | Mult |
|------|------|------|
| Ones - Sixes | 10 | 1 |
| Three of Kind | 20 | 2 |
| Four of Kind | 20 | 3 |
| Full House | 20 | 3 |
| Small Straight | 20 | 2 |
| Large Straight | 40 | 3 |
| Yahtzee | 50 | 4 |
| Chance | 20 | 2 |

### Level-Up Bonus

- Each level adds +5 to base points
- Multiplier stays constant
- Cost: $6 + current level

### Pips Calculation

- **Upper section (Ones-Sixes)**: Sum of matching dice only
- **Lower section**: Sum of ALL 5 dice

---

## Reward System

### Level Complete Rewards

| Reward | Amount |
|--------|--------|
| Base Win | $10 |
| Per Unused Hand | $2 |
| Per Unused Roll | $1 |
| Tier 1 Bonus (≥ 125% goal) | $5 |
| Tier 2 Bonus (≥ 150% goal) | $10 |

---

## Level Configuration

```typescript
LEVEL_CONFIG = [
  { level: 1, goal: 50 },
  { level: 2, goal: 80 },
  { level: 3, goal: 120 },
  { level: 4, goal: 180 },
  { level: 5, goal: 250 },
  { level: 6, goal: 350 },
  { level: 7, goal: 480 },
  { level: 8, goal: 650 },
];
```

---

## Known TODOs / Future Work

### Deferred (Intentionally)

1. **Variety Mechanic**: Prevent repeating same 4 hands across levels
2. **Sound Effects**: All audio feedback
3. **Die Pulse Animation**: Highlight individual dice during score reveal
4. **Upper Section Bonus**: Classic 63+ bonus removed, may add variant
5. **Jokers/Special Items**: Future shop inventory

### Potential Improvements

1. Smooth transitions between phases
2. Level transition animation
3. Shop item variety (extra dice, jokers, etc.)
4. Achievements/stats tracking
5. Difficulty modes

---

## Testing Checklist

- [x] Level starts with score=0, goal shown, 4 hands, 3 rolls
- [x] WURF consumes rolls; max 3 per hand attempt
- [x] Selecting valid hand enables ANNEHMEN; invalid blocked
- [x] ANNEHMEN triggers reveal animation → shows final score
- [x] Hand marked used (dimmed) after accept
- [x] Score crossing goal shows CASH OUT / PRESS ON
- [x] Cash out computes rewards correctly
- [x] Shop shows 3 placeholder + 1 upgrade item
- [x] Upgrade picker shows 3 hands, charges cost
- [x] After shop → next level (or win screen if level 8)
- [x] Lose screen if hands exhausted and score < goal

---

## Migration Date

December 2024
