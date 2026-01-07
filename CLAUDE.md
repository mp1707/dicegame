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
│   │   ├── PlayConsole.tsx  # Unified container: HUDHeader + TrayWindow + ScoreLip
│   │   ├── ScoreLip.tsx     # Integrated score readout strip (inside PlayConsole)
│   │   ├── FooterControls.tsx
│   │   ├── CashoutResultList.tsx # Inline reward breakdown
│   │   ├── ShopContent.tsx  # Shop grid with upgrade items + purchasable items
│   │   ├── DieEditorContent.tsx # Die selection panel (DICE_EDITOR_DIE phase)
│   │   ├── FaceEditorContent.tsx # Face selection panel (DICE_EDITOR_FACE phase)
│   │   └── DiePreview3D.tsx # 3D die viewer for face selection
│   ├── ui-kit/              # Material layer system
│   │   ├── Surface.tsx      # Base container (panel, inset, chip, overlay)
│   │   ├── HUDCard.tsx      # Panel wrapper with optional header
│   │   ├── InsetSlot.tsx    # Recessed sub-surface
│   │   ├── Chip.tsx         # Non-interactive status badge
│   │   ├── ProgressBar.tsx  # Horizontal progress bar with animation
│   │   ├── NumericCapsule.tsx # Fixed-width number display (prevents layout shift)
│   │   ├── SectionHeader.tsx # Section title with icon
│   │   ├── Divider.tsx      # Visual separator
│   │   ├── index.ts         # Barrel exports
│   │   └── flow/
│   │       └── PhaseDeck.tsx # Sliding transition orchestrator
│   ├── scoring/
│   │   ├── SpecialSection.tsx # Owned items display (tap to view details)
│   │   ├── UpperSection.tsx # 6 dice slots (1-6)
│   │   └── LowerSection.tsx # 7 poker hand slots
│   ├── screens/
│   │   ├── ResultScreen.tsx # Level complete rewards (exports ResultPanel)
│   │   ├── ShopScreen.tsx   # Shop with upgrades (exports ShopPanel)
│   │   ├── UpgradePickerScreen.tsx # (exports UpgradePickerPanel)
│   │   └── EndScreen.tsx    # Win/Lose screens (exports EndPanel)
│   └── modals/
│       ├── OverviewModal.tsx # Hand levels + formulas
│       └── ItemDetailModal.tsx # Item details with highlighted keywords
```

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

**Shop Integration**: See `DICE_UPGRADE_CONFIG` in `utils/gameCore.ts` for spawn rates and costs

**Dice Editor Flow** (Phase-based, integrated into PhaseDeck):

1. **DICE_EDITOR_DIE phase** (`DieEditorContent.tsx`): Single row of 5 TileButtons for die selection. Icons use `die.png`. Labels: "Würfel 1" through "Würfel 5". CTAs: ZURÜCK (back to shop) + WEITER (advance to face selection).

   - **TileButton Enhancement Pills**: Each die tile shows enhancement summary pills in bottom corners:
     - Bottom-left (blue): Sum of points enhancements on all faces (e.g., "+30" = 3 pips enhanced)
     - Bottom-right (red): Sum of mult enhancements on all faces
   - **3D Die Preview**: PlayConsole tray shows selected die with continuous multi-axis rotation (Y + X axes) for full face inspection
   - **Manual Rotation**: User can drag to rotate; auto-rotation pauses during drag and resumes from current position on release (no flicker/snap)

2. **DICE_EDITOR_FACE phase** (`FaceEditorContent.tsx`): 2x3 grid of TileButtons for face selection. Icons use `1die.png` through `6die.png`. Labels: "Seite 1" through "Seite 6". CTAs: ZURÜCK (back to die selection) + VERBESSERN (apply upgrade).
   - **TileButton Enhancement Pills**: Each face tile shows enhancement count for that specific face
   - **3D Die in Tray**: Same rotatable 3D preview, but with face snapping enabled
   - **3D Rotation**: Uses World Axis quaternion rotation for consistent "follow-finger" dragging
   - **Face Sync**: Tapping a face button rotates the 3D die to that face; manually rotating the die updates the selected face button
   - **Snap Behavior**: Snaps to nearest face on release with haptic feedback (only in this phase)

**Colored Pip Rendering** (`Die.tsx`):

- Enhanced pips render in blue (`COLORS.upgradePoints`) or red (`COLORS.upgradeMult`)
- Emissive material with 0.5 intensity for glow effect

**Scoring Formula with Enhancements**:

When a hand is scored, enhancement bonuses are calculated from contributing dice only:

```
finalScore = (basePoints + pips + bonusPoints) × (mult + bonusMult)
```

- `bonusPoints` = count of "points" pips across all contributing dice × 10
- `bonusMult` = count of "mult" pips across all contributing dice × 1

**Scoring Helpers** (`utils/gameCore.ts`):

```typescript
bonusPointsForDieFace(dieIndex, faceValue, enhancements); // count × 10
bonusMultForDieFace(dieIndex, faceValue, enhancements); // count × 1
getScoringBreakdown(handId, level, dice, enhancements); // includes bonusPoints, bonusMult
```

**ScoreLip Display** (`components/ui/ScoreLip.tsx`):

- During scoring reveal, displays bonus indicators: blue `(+10)` for points, red `(+1)` for mult
- Mult number turns red when enhanced (uses `COLORS.upgradeMult`)
- Mult bonus triggers pulse animation before showing final score

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

### Counting Animation Flow

When a player accepts a hand, a coordinated reveal animation plays across multiple components:

**1. Trigger: `acceptHand()` in gameStore**

- Sets `revealState.active = true` with scoring breakdown
- Unlocks all dice (locks no longer needed during scoring)

**2. DiceTray orchestration**

- `CameraController`: Zooms camera to 60% of default height (40% closer)
- Slot assignment: Sorts dice by X position (left-to-right) and assigns arranged slots
- Each Die receives: `isRevealActive`, `arrangedPosition`, `isHighlighted`, `isContributing`

**3. Die animation (in useFrame)**

- **First reveal frame**:
  - Switches die to dynamic type (in case it was kinematic from locking)
  - Captures physics position/rotation
  - Computes target quaternion to show top face
  - Applies captured position immediately (no lerp) and returns early
  - Calls `invalidate()` to ensure next frame renders
- **Subsequent frames**:
  - Caps `delta` to max 33ms to prevent instant jumps after long pauses (`frameloop="demand"`)
  - Lerps position toward arranged slot
  - Slerps rotation toward flat orientation
  - Physics disabled by zeroing velocities while animation runs

**4. ScoreRow counting animation (3 phases)**

- **Counting phase**: Iterates through `contributingIndices` one by one
  - Updates `currentDieIndex` to highlight each die in turn
  - Accumulates pips and animates score display
  - Per-die delay: 560ms (was 700ms, 20% faster)
- **Final phase** (1s): Shows hand score in white (e.g., "120")
- **Total phase** (1.6s): Shows new total score, starting gold with glow, fading to white over 1s
  - This ensures the total is always visible before phase transitions (e.g., LEVEL_RESULT)
  - After total phase completes, calls `finalizeHand()`

**5. Die visual states during reveal**

- **Highlighted** (current die): Gold color, pulse scale (1.0 → 1.12 → 1.0)
- **Contributing**: Normal opacity, awaiting highlight
- **Non-contributing**: Dimmed to 30% opacity

For timing constants, see `ANIMATION.counting.*` in `constants/theme.ts`.

### Slot Visual States

All 13 hand slots use 3 states defined in `theme.ts`:

- **Active**: Cyan glow, tappable (valid hand for current dice, not used this level)
- **Used**: Muted gold, not tappable (already used this level, resets each level)
- **Invalid**: Grey dash, not tappable (doesn't match current dice)

### Dice Tray Sizing

To change the dice tray size in the UI and keep the 3D scene in sync, adjust the UI height in `App.tsx` via `calculateDiceTrayHeight` (in `constants/theme.ts`) and pass both `containerHeight` and `containerWidth` into `DiceTray`. Inside `components/DiceTray.tsx`, derive the 3D floor dimensions from the canvas aspect ratio (e.g., `floorDepth = floorWidth / aspect`) and compute the camera height from the floor size and FOV so the floor fills the viewport without cropping. This keeps the tray full width across devices, prevents dice from rolling out of view, and makes the 3D bounds track the UI layout.

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

### UI Kit (`components/ui-kit/`)

The UI kit provides material layers to differentiate containers from interactive elements. Containers should look flat and matte; only buttons should have 3D bevels and glows.

**Material Hierarchy (back to front):**

1. **Background** (`COLORS.bg`) - Main app background
2. **Panel** (`Surface variant="panel"`) - Card/section containers
3. **Inset** (`Surface variant="inset"`) - Recessed data displays inside panels
4. **Interactive** (`PrimaryButton`, `TileButton`) - Tappable elements with 3D effect

**Components:**

```typescript
import { Surface, HUDCard, InsetSlot, Chip, SectionHeader, Divider } from "../ui-kit";

// Surface - Base container with variants
<Surface variant="panel">...</Surface>  // Flat matte panel
<Surface variant="inset">...</Surface>  // Recessed sub-container
<Surface variant="chip">...</Surface>   // Minimal badge background
<Surface variant="overlay">...</Surface> // Semi-transparent modal

// HUDCard - Panel wrapper with optional header
<HUDCard header="REWARDS">
  <InsetSlot>Data row here</InsetSlot>
</HUDCard>

// Chip - Non-interactive status badge (NOT tappable)
<Chip label="NEW" color="cyan" />
<Chip label="TIER 2" color="gold" size="sm" />

// SectionHeader - Section title with optional icon/accessory
<SectionHeader title="UPGRADES" icon={<Icon />} />

// Divider - Visual separator
<Divider spacing="md" />

// ProgressBar - Horizontal progress with animation
<ProgressBar value={score} max={goal} size="sm" />
```

**ProgressBar Features:**

- InsetSlot-style track (recessed appearance)
- Smooth fill animation with subtle overshoot and settle
- Gradient fill with leading edge shine
- Color transition: cyan → gold at 100%
- Glow effect when near/at goal
- Sizes: `sm` (8px height), `md` (14px height)

**Visual Rules:**

- Panels: Flat fill (`COLORS.surface`), subtle top border (`overlays.whiteMild`), NO outer glow
- Insets: Darker fill (`COLORS.bg`), top dark border for recessed effect
- Chips: Minimal flat badge, NO bevel, color variants (cyan, gold, mint, coral, muted)
- ProgressBar: Inset track, animated gradient fill, leading shine
- Only `PrimaryButton` and `TileButton` should have 3D bevels and glows

### New Feature UI Guidelines

When building new features (modals, screens, flows), follow these guidelines to maintain UI consistency:

**Component Selection Hierarchy:**

1. **Interactive elements** → Use `PrimaryButton` (CTAs) or `TileButton` (grid items)
2. **Containers** → Use `Surface` (panel, inset, chip, overlay variants)
3. **Status badges** → Use `Chip` component
4. **Text** → Use `GameText` with typography variants
5. **Spacing** → Use `SPACING.*` constants
6. **Dimensions** → Use `DIMENSIONS.*` or `LAYOUT.*` constants

**Pre-Implementation Checklist:**

Before writing new UI code, verify:

- [ ] Am I using an existing UI kit component instead of a raw `View`/`Pressable`?
- [ ] Are all colors from `COLORS.*` (no hex literals)?
- [ ] Are all spacings from `SPACING.*` (no magic numbers)?
- [ ] Are all dimensions from `DIMENSIONS.*` or `LAYOUT.*`?
- [ ] Are touch targets at least `LAYOUT.minTouchTarget` (44px)?
- [ ] Do interactive elements have proper 3D bevels (via `PrimaryButton`/`TileButton`)?

**Gap Handling Protocol:**

If you need a component, color, or dimension that doesn't exist in the theme:

1. **Stop and ask the user** before creating custom styles
2. Propose adding the new token to `constants/theme.ts`
3. Propose adding a new UI kit component if the pattern will be reused
4. Only proceed with inline styles if the user confirms it's a one-off

**Common Mistakes to Avoid:**

| ❌ Wrong                                | ✅ Right                           |
| --------------------------------------- | ---------------------------------- |
| `<Pressable style={{...}}>` for CTAs    | `<PrimaryButton label="..." />`    |
| `<View style={{border: 1}}>` for badges | `<Chip label="..." color="..." />` |
| `width: 72` hardcoded                   | `width: DIMENSIONS.tileHeight`     |
| `height: 40` for touch targets          | `height: LAYOUT.minTouchTarget`    |
| `backgroundColor: "#352B58"`            | `backgroundColor: COLORS.surface`  |
| `gap: 8`                                | `gap: SPACING.sm`                  |

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

### PhaseDeck Layout (`components/ui-kit/flow/PhaseDeck.tsx`)

PhaseDeck is the main game layout orchestrator. PlayConsole is **always visible** - only the bottom panel content switches based on phase.

**Architecture:**

1. **PlayConsole** - Always visible (HUDHeader + TrayWindow + ScoreLip)
2. **BottomPanel** - Switches content based on phase
3. **Footer** - Phase-aware CTA buttons

**Layout Structure:**

```
PhaseDeck
├── PlayConsole (ALWAYS VISIBLE)
│   ├── HUDHeader (LV, Money, Goal)
│   ├── TrayWindow (Dice 3D scene OR SingleDiePreview)
│   └── ScoreLip (Score + Progress)
├── BottomPanel (CONTENT SWITCHES)
│   ├── LEVEL_PLAY → ScoringGrid
│   ├── LEVEL_RESULT → CashoutResultList
│   ├── SHOP_MAIN → ShopContent
│   ├── SHOP_PICK_UPGRADE → UpgradeContent
│   ├── DICE_EDITOR_DIE → DieEditorContent
│   ├── DICE_EDITOR_FACE → FaceEditorContent
│   └── WIN/LOSE_SCREEN → EndContent
└── Footer (FooterControls)
```

**Note:** During `DICE_EDITOR_DIE` and `DICE_EDITOR_FACE` phases, the TrayWindow shows a single large rotatable die (`SingleDiePreview`) instead of the normal `DiceTray` with 5 dice.

**PlayConsole Phase-Aware Header:**

The goal header in PlayConsole changes based on phase:

- **LEVEL_PLAY**: Normal "ERREICHE X PUNKTE" goal display with progress bar
- **SHOP phases**: Shows "SHOP" in large text, progress bar hidden
- **DICE_EDITOR phases**: Shows "WÜRFEL VERBESSERN" with colored upgrade pill (+10 Punkte or +1 Mult)

**TrayOverlay Titles:**

Tray overlays use `TrayOverlayTitle` with fade-in + move-up animation (FadeInUp/FadeOutDown):

- **ShopTrayOverlay**: "Wähle ein Upgrade" (no subtitle, SHOP is in header)
- **UpgradeTrayOverlay**: "Verbessere eine Hand" / "+5 Punkte"
- **DiceEditorTrayOverlay**: "Würfel wählen" or "Seite wählen" / "Schritt 1/2" or "Schritt 2/2"

**Phase → BottomPanel Content:**

| Phase             | Content             | Footer CTA          |
| ----------------- | ------------------- | ------------------- |
| LEVEL_PLAY        | ScoringGrid         | Roll/Accept         |
| LEVEL_RESULT      | CashoutRewardsPanel | SHOP                |
| SHOP_MAIN         | ShopContent         | NEXT LEVEL          |
| SHOP_PICK_UPGRADE | UpgradeContent      | ZURÜCK              |
| DICE_EDITOR_DIE   | DieEditorContent    | ZURÜCK + WEITER     |
| DICE_EDITOR_FACE  | FaceEditorContent   | ZURÜCK + VERBESSERN |
| WIN/LOSE_SCREEN   | EndContent          | NEUER RUN           |

**Content Components (in `components/ui/`):**

- `BottomPanel.tsx` - Phase-based content switcher (easing-based slide transitions)
- `CashoutRewardsPanel.tsx` - Celebratory reward breakdown with hero payout, staggered rows, sparkles
- `ShopContent.tsx` - Shop with header, money capsule, 2x2 ShopItemCard grid
- `ShopItemCard.tsx` - Shop item card with affordable/unaffordable/soon states, shimmer animation
- `UpgradeContent.tsx` - Cascade-animated upgrade cards with selection feedback
- `DieEditorContent.tsx` - Die selection row with 5 TileButtons (DICE_EDITOR_DIE phase)
- `FaceEditorContent.tsx` - Face selection 2x3 grid with TileButtons (DICE_EDITOR_FACE phase)
- `SparkleEffect.tsx` - Particle micro-animation for celebratory effects
- `EndContent.tsx` - Compact win/lose display with stats

**Special Components:**

- `SingleDiePreview.tsx` (in `components/`) - Wrapper for `DiePreview3D` that connects to store; used during DICE_EDITOR_FACE phase to show single rotatable die in PlayConsole tray

**Integration in App.tsx:**

```typescript
import { PhaseDeck } from "./components/ui-kit/flow";

<PhaseDeck
  diceTray={<DiceTray containerHeight={...} containerWidth={...} />}
/>
```

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

This app runs 3D physics simulation, complex animations, and reactive state. **Thermal management is critical** - the device should stay cool during normal gameplay. Follow these patterns to prevent performance regressions.

### Critical Rule: Idle State = Near-Zero Work

When the player is "thinking" (dice settled, no animations running), the app should do **almost nothing**:

- No render loop invalidations (use `frameloop="demand"`)
- No JS intervals/timeouts ticking
- Animations cancelled or complete

> **Note**: Physics is NOT paused when idle. Pausing/unpausing Rapier causes WASM collision detection JIT on first roll, creating lag. With only 5 dice, idle physics is negligible.

### Physics Considerations (`DiceTray.tsx`)

**Why physics is NOT paused**: Pausing Rapier physics and resuming causes WASM collision detection code to JIT-compile on the first floor impact, creating noticeable lag on the first roll after app load.

**Pattern: Frame guard for settle detection**

```typescript
// Die.tsx - Skip settle detection for first N frames after roll
const framesSinceRollRef = useRef(100); // Start high so existing dice don't trigger

// In roll trigger effect:
framesSinceRollRef.current = 0; // Reset on new roll

// In useFrame:
framesSinceRollRef.current += 1;
if (framesSinceRollRef.current > 10) {
  // Now safe to check settle conditions
}
```

This prevents race conditions where dice report "settled" before physics has time to apply impulses.

### 3D Render Loop (`frameloop="demand"`)

The Canvas uses `frameloop="demand"` which only renders when `invalidate()` is called. This saves massive GPU cycles.

**Pattern: Only invalidate during active animations**

```typescript
// DieOutline.tsx - Only invalidate during active pulse phases
useFrame((state) => {
  // ✅ Only invalidate when actually animating
  if (pulsePhaseRef.current === "up" || pulsePhaseRef.current === "down") {
    state.invalidate();
  }
  // ❌ DON'T invalidate during "idle" or "wait" phases
});
```

**Pattern: Gate position updates on settle state**

```typescript
// Die.tsx - Stop updating after dice settle
if (
  !isRevealActive &&
  rigidBody.current &&
  isVisible &&
  !settleReportedRef.current
) {
  onPositionUpdate(index, rigidBody.current.translation().x);
}
// After settle is reported, this callback stops firing
```

**Pattern: Early exit when at target**

```typescript
// DiePreview3D.tsx - Skip lerping when camera settled
const posDist = camera.position.distanceTo(CAMERA_TARGET_POS);
if (posDist < 0.01) return; // Already at target, skip work
```

**Anti-patterns:**

- ❌ Calling `invalidate()` unconditionally in useFrame
- ❌ Lerping values that are already at target
- ❌ Running useFrame logic when component is offscreen

### Object Pooling in useFrame

Creating objects inside `useFrame` causes GC pressure (stutters every few seconds).

**Pattern: Pre-allocate reusable objects**

```typescript
// Die.tsx - Pooled objects outside useFrame
const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
const tempVector = useMemo(() => new THREE.Vector3(), []);
const tempUpVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);

useFrame(() => {
  // ✅ Reuse pooled objects
  tempQuaternion.copy(someQuat);
  tempVector.set(x, y, z);

  // ❌ DON'T allocate inside useFrame
  // const newQuat = new THREE.Quaternion(); // BAD - 60 allocations/sec
});
```

**Anti-patterns:**

- ❌ `new THREE.Vector3()` inside useFrame
- ❌ `.clone()` inside useFrame (allocates new object)
- ❌ Array spreads `[...arr]` inside useFrame

### Animation Lifecycle Management

Animations must stop when not visible or relevant.

**Pattern: Cancel animations when leaving phase**

```typescript
// ShopItemCard.tsx - Stop shimmer when leaving shop
const phase = useGameStore((s) => s.phase);
const isInShop = phase === "SHOP_MAIN" || phase === "SHOP_PICK_UPGRADE";

useEffect(() => {
  if (state === "soon" && isInShop) {
    shimmerPosition.value = withRepeat(...);
  } else {
    cancelAnimation(shimmerPosition);  // ← CRITICAL
    shimmerPosition.value = -1;
  }
  return () => cancelAnimation(shimmerPosition);
}, [state, isInShop]);
```

**Pattern: Use Reanimated callbacks instead of setTimeout**

```typescript
// UpgradeContent.tsx - Sync with animation completion
selectionProgress.value = withTiming(
  1,
  { duration: ANIMATION.tile.select.shineDuration },
  (finished) => {
    if (finished) {
      runOnJS(pickUpgradeHand)(handId); // ← Called at exact animation end
    }
  }
);

// ❌ DON'T use setTimeout with hardcoded delays
// setTimeout(() => pickUpgradeHand(handId), 400); // Timing drift risk
```

**Anti-patterns:**

- ❌ `withRepeat(..., -1)` without phase-awareness (infinite loop)
- ❌ `setInterval` on JS thread for animations (use Reanimated)
- ❌ Hardcoded `setTimeout` delays that don't match animation durations
- ❌ Not cleaning up animations in useEffect return

### Zustand State Management

Improper subscriptions cause cascade re-renders across many components.

**Pattern: Batch selectors with useShallow**

```typescript
// PlayConsole.tsx - Single batched subscription
import { useShallow } from "zustand/react/shallow";

const {
  money,
  levelGoal,
  levelScore,
  phase,
  // ... other fields
} = useGameStore(
  useShallow((s) => ({
    money: s.money,
    levelGoal: s.levelGoal,
    levelScore: s.levelScore,
    phase: s.phase,
  }))
);

// ❌ DON'T use separate subscriptions for each field
// const money = useGameStore((s) => s.money);      // Re-render on money change
// const levelGoal = useGameStore((s) => s.levelGoal); // Re-render on goal change
// This causes N re-renders instead of 1
```

**Pattern: Stable action references**

```typescript
// Actions don't need useShallow - they're stable references
const rollDice = useGameStore((s) => s.rollDice);
const selectHand = useGameStore((s) => s.selectHand);
```

### React.memo for Repeated Components

Components rendered in lists (13 HandSlots, 5 dice, shop cards) must be memoized.

**Pattern: Wrap with React.memo**

```typescript
// ScoringGrid.tsx - Memoize to prevent 13× re-renders
const HandSlot = React.memo(({ handId, labelLine1 }: Props) => {
  // Batch internal selectors too
  const { handLevel, isUsed, isSelected } = useGameStore(
    useShallow((s) => ({
      handLevel: s.handLevels[handId],
      isUsed: s.usedHandsThisLevel.includes(handId),
      isSelected: s.selectedHandId === handId,
    }))
  );
  // ...
});
```

**Memoized components in this codebase:**

- `HandSlot` (13 instances in ScoringGrid)
- `TileButton`, `Surface`, `InsetSlot`, `Chip` (UI-kit)
- Layout context value (`useLayoutUnits.ts`)

### Context Memoization

Context values must be memoized to prevent provider re-renders cascading to all consumers.

**Pattern: Memoize context value**

```typescript
// useLayoutUnits.ts
return useMemo(
  () => ({
    headerHeight,
    diceTrayHeight,
    // ... all properties
  }),
  [headerHeight, diceTrayHeight /* ... dependencies */]
);
```

### Performance Checklist for New Features

Before adding new features, verify:

- [ ] **useFrame**: Am I allocating objects? Use pooled/memoized objects.
- [ ] **useFrame**: Am I always invalidating? Add early-exit conditions.
- [ ] **Animations**: Do they stop when offscreen/phase changes? Add cleanup.
- [ ] **Zustand**: Am I using `useShallow` for multi-field selectors?
- [ ] **Lists**: Are repeated components wrapped in `React.memo`?
- [ ] **Timers**: Am I using `setTimeout`? Consider Reanimated callbacks instead.

### Key Files with Performance-Critical Code

| File                 | Critical Patterns                                        |
| -------------------- | -------------------------------------------------------- |
| `DiceTray.tsx`       | Settle detection, shader warmup                          |
| `Die.tsx`            | Object pooling, frame guard for settle, reveal animation |
| `DieOutline.tsx`     | Conditional invalidate, material caching                 |
| `DiePreview3D.tsx`   | Camera early exit, pre-allocated vectors                 |
| `PlayConsole.tsx`    | Batched Zustand selectors                                |
| `ScoringGrid.tsx`    | Memoized HandSlot components                             |
| `ShopItemCard.tsx`   | Phase-aware shimmer cancellation                         |
| `UpgradeContent.tsx` | Reanimated callbacks                                     |
| `BottomPanel.tsx`    | Memoized animation configs                               |
| `useLayoutUnits.ts`  | Memoized context value                                   |

---

## Item Trigger System (`utils/itemSystem.ts`)

A Balatro-style item/relic system with event-driven triggers. Every item follows the semantic grammar:

**WANN** (Trigger) → **WENN** (Condition) → **WAS** (Effect) → **WIE OFT** (Limit)

In UI copy (German), keep the order rigid:

> **Beim/Wenn/Nach …:** _Effekt._ _(Limit/Charges)_

> **📖 When writing item descriptions, consult `ITEM_SEMANTICS.md` for the exact German phrasing for each trigger, condition, effect, and limiter.**

### Trigger Families

All triggers are organized into families with precise timing:

| Family  | Triggers                                                                                      | Purpose                   |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| Run     | `RUN_START`, `RUN_END`, `ITEM_GAINED`, `ITEM_REMOVED`                                         | Meta-level run events     |
| Level   | `LEVEL_START`, `LEVEL_WON`, `LEVEL_RESULT_ENTER`, `SHOP_ENTER`, `SHOP_EXIT`                   | Between-round lifecycle   |
| Hand    | `HAND_START`, `HAND_FIRST_ROLL_START`, `HAND_LAST_ROLL_START`, `HAND_ACCEPTED`, `HAND_SCORED` | Hand attempt within level |
| Roll    | `ROLL_COMMIT`, `ROLL_SETTLED`, `DIE_LOCK_TOGGLED`                                             | Dice physics/values       |
| Scoring | `SCORE_PRECALC`, `SCORE_PER_DIE`, `SCORE_APPLIED`                                             | Scoring calculation       |
| Economy | `SHOP_GENERATE_OFFER`, `SHOP_PURCHASE`, `MONEY_GAIN`, `MONEY_SPEND`                           | Money and shop events     |

### Trigger Context

When triggers fire, handlers receive context with game state. See `TriggerContext` interface in `utils/itemTriggers.ts` for available fields (phase, dice values, locked mask, money, level progress, etc.).

### Effect Categories

Items can only do things from this constrained set:

**Scoring Math** (maps to `(basePoints + pips + bonusPoints) × (mult + bonusMult)`):

- `+Punkte` → adds to bonusPoints
- `+Pips` → virtual pip count
- `+Mult` / `×Mult` → modifies mult

**Roll Manipulation**:

- Extra roll, refund roll, set die value, bump value (+1, max 6)

**Lock Manipulation**:

- Lock/unlock dice, free locks

**Economy**:

- Discount, cashback, interest, bonus money

**Meta Progression**:

- Upgrade hand level, add enhancement pips

### Creating Items

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

### Effect Factories

See `utils/itemEffects.ts` for factory functions:
- Scoring: `addBonusPoints()`, `addBonusMult()`, `multiplyMult()`
- Scaling: `addPointsPerLockedDie()`, `addMultPerDieValue()`, `addInterest()`
- Roll/Lock: `grantExtraRolls()`, `refundRoll()`, `lockDie()`, `unlockDie()`
- Economy: `addMoney()`, `applyDiscount()`

### Limiters

Control trigger frequency. See `LimiterType` in `utils/itemDefinitions.ts`:
- `perHand`, `perLevel`, `perShop` - Usage count resets
- `charges` - Total uses across run
- `cooldown` - Hands between triggers

### Trigger Emission Points

Triggers are emitted in `gameStore.ts` at these action points:

| Action                 | Triggers Emitted                                                 |
| ---------------------- | ---------------------------------------------------------------- |
| `startNewRun()`        | `RUN_START`                                                      |
| `startLevel()`         | `LEVEL_START`, `HAND_START`                                      |
| `triggerRoll()`        | `ROLL_COMMIT`, `HAND_FIRST_ROLL_START`_, `HAND_LAST_ROLL_START`_ |
| `completeRoll()`       | `ROLL_SETTLED`                                                   |
| `toggleDiceLock()`     | `DIE_LOCK_TOGGLED`                                               |
| `acceptHand()`         | `HAND_ACCEPTED`                                                  |
| `finalizeHand()`       | `HAND_SCORED`, `LEVEL_WON`_, `HAND_START`, `RUN_END`_            |
| `cashOutNow()`         | `LEVEL_RESULT_ENTER`                                             |
| `openShop()`           | `MONEY_GAIN`\*, `SHOP_ENTER`, `SHOP_GENERATE_OFFER`              |
| `closeShopNextLevel()` | `SHOP_EXIT`, `RUN_END`\*                                         |

\*Conditional based on game state

### File Structure

```
utils/
├── itemTriggers.ts      # Core trigger types, emitter, context
├── itemEffects.ts       # Effect categories, factories, applicators
├── itemDefinitions.ts   # Item types, catalog, example items (templates)
└── itemSystem.ts        # Barrel exports

items/
├── index.ts             # Items registry + getShopItemById, SHOP_ITEMS
└── fokus.ts             # Fokus item definition
```

### Integration Notes

- Items are registered with `registerItem()` and cleared with `clearAllItems()` on new run
- Usage counters reset at: `HAND_START` (per-hand), `LEVEL_START` (per-level), `SHOP_ENTER` (per-shop)
- Cooldowns tick down at `HAND_SCORED`
- Effects accumulate in `EffectContext` and are applied by `applyEffects()`

---

## Purchasable Items System

Items can be purchased in the shop and provide permanent effects for the run. Each item follows the trigger grammar and integrates with the item trigger system.

### Adding a New Item

1. **Create item file** in `items/`:

```typescript
// items/my_item.ts
import type { ItemDefinition } from "../utils/itemDefinitions";
import type { TriggerHandler } from "../utils/itemTriggers";

const myEffect: TriggerHandler = (context, effects) => {
  // Modify effects based on context
  effects.bonusPoints += 10;
};

export const MY_ITEM: ItemDefinition = {
  id: "my_item",
  name: "Mein Item",
  description: "Beim Start des Levels: +10 Punkte.",
  rarity: "uncommon",
  cost: 7,
  icon: "my_icon.png", // From assets/items/
  triggers: [
    {
      triggerId: "LEVEL_START",
      handler: myEffect,
    },
  ],
};
```

2. **Register in `items/index.ts`**:

```typescript
import { MY_ITEM } from "./my_item";
export const SHOP_ITEMS: ItemDefinition[] = [FOKUS_ITEM, MY_ITEM];
export { MY_ITEM } from "./my_item";
```

3. **Add icon mapping** in `ShopContent.tsx` and `SpecialSection.tsx`:

```typescript
const ITEM_ICONS: Record<string, any> = {
  fokus: require("../../assets/items/brain.png"),
  my_item: require("../../assets/items/my_icon.png"),
};
```

### Current Items

| ID      | Name  | Cost | Trigger       | Effect                                        |
| ------- | ----- | ---- | ------------- | --------------------------------------------- |
| `fokus` | Fokus | $7   | `LEVEL_START` | Converts extra hands into rolls (4H+3R→1H+6R) |

### Item UI Flow

1. **Shop Display**: Items appear in the shop grid (ShopContent) with icon, name, and price
2. **Detail Modal**: Tapping shows `ItemDetailModal` with description and "KAUFEN" CTA
3. **Purchase**: On purchase, item is added to `ownedItems` and registered with trigger system
4. **Display**: Owned items appear in `SpecialSection` (top of scoring grid)
5. **Info Modal**: Tapping owned item shows detail modal (without purchase CTA)

### EffectContext Fields

Items modify effect fields in handlers. See `EffectContext` in `utils/itemEffects.ts` for available fields (bonusPoints, bonusMult, extraRolls, handsToRemove, moneyChange, diceModifications, lockChanges).

### ItemDetailModal Features

- **Highlighted keywords**: "Hände"/"Hand" → cyan, "Würfe"/"Wurf"/"Würfel" → gold
- **InsetSlot icon container**: Item icon in recessed container
- **Optional purchase CTA**: Shows "KAUFEN" with price when in shop context
