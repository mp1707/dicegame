# Roguelike Yahtzee - Implementation Guide

A roguelike dice game combining Yahtzee mechanics with progression systems. Built with **Expo**, **React Three Fiber**, and **Rapier Physics**.

## Tech Stack

See `package.json` for complete dependency list and versions.

**Key libraries**:

- **Expo** - React Native framework
- **React Three Fiber + Drei + Rapier** - 3D physics simulation
- **Zustand** - State management
- **Reanimated** - Native animations
- **polywasm** - WebAssembly polyfill for Hermes (see setup below)

---

## Critical: WebAssembly Polyfill for Hermes

**Hermes** (React Native's JS engine) does **NOT** natively support WebAssembly. Rapier physics uses WASM, so we need to polyfill it.

### Solution: `polywasm`

`polywasm` translates WebAssembly modules to pure JavaScript at runtime. It exports a `WebAssembly` object but **does NOT** auto-assign it to `globalThis`.

### Setup in `index.ts`

```typescript
// MUST be at the very top before any other imports
import { WebAssembly } from "polywasm";
(globalThis as any).WebAssembly = WebAssembly;

// Then other polyfills
import "react-native-get-random-values";
import "react-native-polyfill-globals/auto";

// Finally, app registration
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
```

> **Important**: The order matters! `polywasm` must be imported and assigned to `globalThis.WebAssembly` BEFORE any code that uses WebAssembly (including transitive dependencies like Rapier).

### Required Polyfill Dependencies

```bash
npm install polywasm react-native-get-random-values react-native-polyfill-globals \
  base-64 text-encoding react-native-url-polyfill react-native-fetch-api \
  event-target-polyfill web-streams-polyfill@3
```

---

## Metro Configuration

Metro needs to handle WASM files as assets, not source files:

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("wasm", "glb", "gltf");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== "wasm"
);

module.exports = config;
```

---

## Architecture

### File Structure

```
dice-game/
├── index.ts                 # Entry point with polyfills
├── App.tsx                  # Main layout + PhaseDeck integration
├── constants/theme.ts       # Colors, typography, spacing, animation
├── items/                   # Purchasable items/relics
│   ├── index.ts             # Items registry + exports
│   └── fokus.ts             # Fokus item (hands → rolls conversion)
├── utils/
│   ├── yahtzeeScoring.ts    # Hand validation logic
│   ├── gameCore.ts          # Scoring, levels, rewards, dice enhancements (pure TS)
│   ├── itemSystem.ts        # Item trigger system barrel exports
│   ├── itemTriggers.ts      # Trigger types, emitter, context
│   ├── itemEffects.ts       # Effect categories, factories, applicators
│   └── itemDefinitions.ts   # Item types, catalog, example items
├── store/gameStore.ts       # Zustand state (run/level/hand/dice model + trigger emissions)
├── components/
│   ├── Die.tsx              # 3D die with tap-to-lock + colored pips
│   ├── DiceTray.tsx         # 3D scene with physics
│   ├── ui/
│   │   ├── PhaseDeck.tsx    # Sliding transition orchestrator
│   │   ├── PHASE_DECK.md    # PhaseDeck documentation
│   │   ├── TopMenuStrip.tsx # Unified container (Level, Money, Goal, Selected Hand)
│   │   ├── FooterControls.tsx
│   │   ├── CashoutRewardsPanel.tsx # Inline reward breakdown
│   │   ├── ShopContent.tsx  # Shop grid with upgrade items + purchasable items
│   │   ├── DieEditorContent.tsx # Die selection panel (DICE_EDITOR_DIE phase)
│   │   ├── FaceEditorContent.tsx # Face selection panel (DICE_EDITOR_FACE phase)
│   │   └── DiePreview3D.tsx # 3D die viewer for face selection
│   ├── pixel-ui-kit/        # Pixel-art 9-slice UI components
│   │   ├── Surface.tsx      # Base container with pixel texture
│   │   ├── Pressable.tsx    # 3D press effect for buttons
│   │   ├── PixelChip.tsx    # Status badge
│   │   ├── PixelDivider.tsx # Visual separator
│   │   ├── Sparks.tsx       # Particle effects for celebrations
│   │   └── index.ts         # Barrel exports
│   ├── scoring/
│   │   ├── ScoringGrid.tsx  # 13 hand slots (upper + lower sections)
│   │   └── CLAUDE.md        # Scoring animation documentation
│   └── modals/
│       ├── OverviewModal.tsx # Hand levels + formulas
│       └── ItemDetailModal.tsx # Item details with highlighted keywords
```

### Documentation Map

**UI Components**:

- **`components/ui/PHASE_DECK.md`** - PhaseDeck layout orchestration, phase transitions
- **`components/ui/dice-editor/CLAUDE.md`** - Dice enhancement editor flow (DICE_EDITOR phases)
- **`components/scoring/CLAUDE.md`** - Scoring reveal animation choreography

**Game Systems**:

- **`utils/item-system/CLAUDE.md`** - Item trigger system deep-dive, effect factories, grammar
- **`items/CLAUDE.md`** - Creating purchasable items, shop integration guide

**Performance & Theme**:

- **`docs/PERFORMANCE.md`** - Optimization patterns, idle state rules, useFrame best practices
- **`constants/theme.ts`** - All design tokens (COLORS, TYPOGRAPHY, SPACING, ANIMATION, PHYSICS, LAYOUT)

### Game State (`store/gameStore.ts`)

Key state properties:

- **Run state** (persists across levels):
  - `currentLevelIndex` (0-7), `money`, `handLevels` (Record<HandId, number>)
  - `diceEnhancements` (DieEnhancement[5]) - pip upgrade states for all 5 dice
- **Level state** (resets each level):
  - `levelScore`, `levelGoal`, `handsRemaining` (4→0), `usedHandsThisLevel`
- **Hand attempt state** (resets each hand):
  - `rollsRemaining` (3→0), `hasRolledThisHand`
- **Dice state**: `diceValues`, `selectedDice`, `isRolling`, `rollTrigger`
- **UI state**: `phase`, `selectedHandId`, `revealState`

Key actions: `rollDice`, `selectHand`, `acceptHand`, `finalizeHand`, `cashOutNow`, `startNewRun`, `startLevel`

### Game Phase Model

- `LEVEL_PLAY`: Main gameplay. Roll dice (up to 3 per hand), lock/unlock, select a hand, press ANNEHMEN to accept. When `levelWon === true`, CASH OUT button appears in footer.
- `LEVEL_RESULT`: ScoringGrid slides out, CashoutResultList slides in showing reward breakdown (base win, unused hands/rolls, tier bonus). TrayModule, ScoreRow, Footer stay visible. CTA: SHOP (in footer).
- `SHOP_MAIN`: Shop grid with UPGRADE HAND + dice enhancement card + placeholders. CTA: NEXT LEVEL.
- `SHOP_PICK_UPGRADE`: Pick 1 of 3 random hands to upgrade. Cost: $6 + handLevel.
- `DICE_EDITOR_DIE`: Select which die to enhance. Single row of 5 TileButtons. CTAs: ZURÜCK + WEITER.
- `DICE_EDITOR_FACE`: Select which face to enhance. 2x3 grid of TileButtons. Single rotatable 3D die in tray. CTAs: ZURÜCK + VERBESSERN.
- `WIN_SCREEN`: Beat all 8 levels. CTA: NEW RUN.
- `LOSE_SCREEN`: Ran out of hands with score < goal. CTA: NEW RUN.

### Scoring System (`utils/gameCore.ts`)

Balatro-style formula: `score = (basePoints + pips) × mult`

- **Base Points**: Hand's base value + (5 × handLevel)
- **Pips**: Upper = sum of matching dice; Lower = sum of all 5 dice
- **Mult**: Fixed per hand type (1× upper, 2-4× lower)

With enhancements: `finalScore = (basePoints + pips + bonusPoints) × (mult + bonusMult)`

See `LEVEL_CONFIG` in `utils/gameCore.ts` for level goals (8 levels total).

### Reward System

See `REWARD_CONFIG` in `utils/gameCore.ts` for:

- Base win bonus per level
- Per unused hand bonus
- Hand upgrade cost formula

### Dice Enhancement System

Players can purchase pip upgrades from the shop to add permanent scoring bonuses to specific die faces.

**Data Model**: See `DieEnhancement` interface in `utils/gameCore.ts`

**Dice Editor Flow**: Two-phase editor (die selection → face selection) integrated into PhaseDeck. See **`components/ui/dice-editor/CLAUDE.md`** for complete implementation details.

### Dice Locking Pattern

Locked dice use Rapier's body type switching for truly immovable behavior:

```typescript
// Die.tsx - On roll trigger
if (isLocked) {
  // Switch to kinematicPosition - immovable but collidable (like walls)
  rigidBody.current.setBodyType(1, true); // 1 = kinematicPosition
  reportSettle(); // Immediately report since locked dice don't move
} else {
  // Ensure dynamic for rolling
  rigidBody.current.setBodyType(0, true); // 0 = dynamic
  // Apply impulse and roll normally...
}
```

This approach makes locked dice truly solid - other dice bounce off naturally without pushing them.

### Scoring Reveal Animation

When a player accepts a hand, a coordinated reveal animation choreographs dice arrangement, camera zoom, and score counting across multiple components.

**FloatingScoreOverlay**: Shows "level up" style floating numbers above each die as it's counted. Points float up-left, mult floats up-right. Dice with mult enhancement get a two-step animation (points pulse, then mult pulse).

**Choreography**: See **`components/scoring/CLAUDE.md`** for the complete 5-step animation flow and timing constants.

### Slot Visual States

All 13 hand slots use 3 states defined in `theme.ts`:

- **Active**: Cyan glow, tappable (valid hand for current dice, not used this level)
- **Used**: Muted gold, not tappable (already used this level, resets each level)
- **Invalid**: Grey dash, not tappable (doesn't match current dice)

### Dice Tray Sizing

To change the dice tray size in the UI and keep the 3D scene in sync, use the `useLayout()` hook to get `diceTrayHeight` and pass both `containerHeight` and `containerWidth` into `DiceTray`. Inside `components/DiceTray.tsx`, derive the 3D floor dimensions from the canvas aspect ratio (e.g., `floorDepth = floorWidth / aspect`) and compute the camera height from the floor size and FOV so the floor fills the viewport without cropping. This keeps the tray full width across devices, prevents dice from rolling out of view, and makes the 3D bounds track the UI layout.

### Layout System

The layout system uses percentage-based weights to create stable, game-like proportions across all screen sizes.

**Structure**: See `LAYOUT.weights` in `constants/theme.ts` for section percentages.
**Scoring grid**: See `LAYOUT.scoring` for Special/Upper/Lower ratios.

**Gap System:**

Major section gaps use `SPACING.sectionGap`, applied via `marginTop` in PhaseDeck:

```typescript
// PhaseDeck.tsx - Each layer after TrayModule gets marginTop
hudLayer: { marginTop: SPACING.sectionGap },      // ScoreRow
scoringAreaContainer: { marginTop: SPACING.sectionGap },  // ScoringGrid
footerLayer: { marginTop: SPACING.sectionGap },   // Footer
```

Internal distribution uses `justifyContent: "space-evenly"` for natural spacing.

**Accessing Layout Values:**

```typescript
import { useLayout } from "../utils/LayoutContext";

const MyComponent = () => {
  const layout = useLayout();

  return (
    <View style={{ height: layout.specialSlotHeight }}>
      {/* Uses calculated height from layout system */}
    </View>
  );
};

// Available properties:
// layout.headerHeight, diceTrayHeight, scoreRowHeight, scoringGridHeight, footerHeight
// layout.specialSlotHeight, upperSlotHeight, lowerSlotHeight, sectionLabelHeight
// layout.fontScale, screenWidth, screenHeight, usableHeight, insets
```

### Pixel UI Kit (`components/pixel-ui-kit/`)

The pixel UI kit provides 9-slice textured containers with the game's pixel-art aesthetic.

**Key Principle**: Containers use pixel textures; interactive elements have 3D depth effects.

**Components**: Surface, Pressable, PixelChip, PixelDivider

### Shared Components (`components/shared/`)

Reusable interactive components:

**Components**: Button, TileButton, SquareTileButton, GameText, Modal

See **`components/ui-kit/CLAUDE.md`** for component overview.

### Money/Cost Display Convention

All money and cost displays follow a consistent pattern:

**Visual Standard:**

- Icon: coin.png (18px default, 14px in compact contexts like shop cards)
- Color: COLORS.gold (always gold for currency)
- Gap: SPACING.xs (4px) or SPACING.xxs (2px) for compact
- No "$" prefix - the coin icon is the currency indicator

**States:**

- Affordable: Standard gold color + coin icon
- Unaffordable: Muted opacity (0.5-0.6) + textMuted color

**Reference Implementations:**

- Header: `PlayConsole.tsx` (18px coin, scoreboardSmall, gold)
- Shop prices: `ShopItemCard.tsx` (14px coin, bodySmall, gold/muted)

### PhaseDeck Layout (`components/ui/PhaseDeck.tsx`)

PhaseDeck is the main game layout orchestrator. TopMenuStrip is **always visible** - only the bottom panel content switches based on phase.

**Architecture**: TopMenuStrip (always visible) + BottomPanel (switches content) + Footer (phase-aware CTAs)

See **`components/ui/PHASE_DECK.md`** for complete phase mapping, content components, and integration guide.

---

## Common Issues & Solutions

| Issue                                  | Solution                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Property 'WebAssembly' doesn't exist` | Ensure `polywasm` is imported and assigned to `globalThis.WebAssembly` BEFORE other imports |
| `Invalid responseType: blob`           | Ignore - related to Environment preset loading                                              |
| Dice rolling in infinite loop          | Use `useRef` to track previous `rollTrigger` value                                          |
| White screen                           | Ensure Canvas has `style={{flex: 1}}` and parent View also                                  |
| Multiple Three.js instances warning    | Can be ignored, caused by separate bundles                                                  |

---

## Running the Project

```bash
# Install dependencies
npm install

# Start Metro bundler
npx expo start

# Build for iOS (required for native modules)
npx expo run:ios --device
```

> **Note**: Must use development build (`expo run:ios`), not Expo Go, due to native modules like `react-native-reanimated` and `react-native-get-random-values`.

---

## Theme System (`constants/theme.ts`)

The app uses a centralized theme with a single font (M6x11 pixel font) and no dark/light mode switching.

### Font

```typescript
import { FONT_FAMILY } from "../constants/theme";
// FONT_FAMILY = "M6x11-Regular"
```

Only one font is loaded in `App.tsx`. All text must use this font.

## Theme System (`constants/theme.ts`)

All visual and animation constants are centralized in `constants/theme.ts`. This single-source ensures consistency across the app.

### Structure

**Available constants**:

- `COLORS.*` - Core palette, overlays, shadows, enhancement colors
- `TYPOGRAPHY.*` - All text variants (use via `GameText` component)
- `SPACING.*` - Base scale (xxs→xxl) + semantic spacing
- `DIMENSIONS.*` - Border radii, widths, icon sizes, touch targets
- `ANIMATION.*` - All timing, springs, phase transitions
- `PHYSICS.*` - 3D dice simulation parameters
- `LAYOUT.*` - Section weights, grid ratios, responsive scaling

### Usage Pattern

```typescript
import { COLORS, SPACING, DIMENSIONS, ANIMATION } from "../constants/theme";
import { GameText } from "../shared";

// ✅ Good - Use theme constants
<View style={{
  backgroundColor: COLORS.surface,
  padding: SPACING.lg,
  borderRadius: DIMENSIONS.borderRadius
}}>
  <GameText variant="displayLarge" color={COLORS.gold}>
    SCORE: 1234
  </GameText>
</View>

// ❌ Bad - Hardcoded values
<View style={{ backgroundColor: "#352B58", padding: 16 }}>
  <Text style={{ fontSize: 32, color: "#FFC857" }}>SCORE: 1234</Text>
</View>
```

### Key Principles

**Single font**: M6x11 pixel font only. Use `GameText` component (wraps `Text` with font).

**Color categories**:

- Core: bg, surface, text (hierarchy)
- Accents: cyan (selection), gold (progress), coral (danger), mint (success)
- Overlays: Pre-mixed rgba values for borders/bevels (use `COLORS.overlays.*`)
- Shadows: Pre-mixed rgba for text glows (use `COLORS.shadows.*`)
- Enhancements: Separate blue/red for pip upgrades

**Spacing scale**: 4px increments (xxs=2, xs=4, sm=8, md=12, lg=16, xl=20, xxl=24)

**Animation timing**: See `ANIMATION.*` for all durations, springs, phase transitions. Use constants instead of hardcoding ms values.

**Bevel pattern** (3D effect):

```typescript
{
  borderTopWidth: DIMENSIONS.borderWidthThin,
  borderTopColor: COLORS.overlays.whiteStrong,
  borderBottomWidth: DIMENSIONS.borderWidthThick,
  borderBottomColor: COLORS.overlays.blackMedium,
}
```

For complete reference, see `constants/theme.ts`.

### Bevel Pattern (3D Button Effect)

Standard bevel for cards and buttons:

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: DIMENSIONS.borderWidth,
    borderColor: COLORS.cyan,
    // Top highlight
    borderTopWidth: DIMENSIONS.borderWidthThin,
    borderTopColor: COLORS.overlays.whiteStrong,
    // Bottom shadow
    borderBottomWidth: DIMENSIONS.borderWidthThick,
    borderBottomColor: COLORS.overlays.blackMedium,
  },
});
```

---

## Performance Guidelines

This app runs 3D physics simulation, complex animations, and reactive state. **Thermal management is critical** - the device should stay cool during normal gameplay.

**Critical Rule**: When the player is "thinking" (dice settled, no animations running), the app should do **almost nothing**.

See **`docs/PERFORMANCE.md`** for complete optimization patterns, useFrame best practices, and performance checklist.

---

## Item/Relic System

A Balatro-style item/relic system with event-driven triggers. Every item follows the semantic grammar:

**WANN** (Trigger) → **WENN** (Condition) → **WAS** (Effect) → **WIE OFT** (Limit)

**Trigger Families**: Run, Level, Hand, Roll, Scoring, Economy

**Effect Categories**: Scoring Math, Roll Manipulation, Lock Manipulation, Economy, Meta Progression

See **`utils/item-system/CLAUDE.md`** for complete trigger system, effect factories, and creating items.

See **`items/CLAUDE.md`** for adding purchasable items to the shop.

**Reference**: Consult `ITEM_SEMANTICS.md` for exact German phrasing conventions in item descriptions.
