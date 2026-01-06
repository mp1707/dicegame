# Roguelike Yahtzee - Implementation Guide

A roguelike dice game combining Yahtzee mechanics with progression systems. Built with **Expo**, **React Three Fiber**, and **Rapier Physics**.

## Tech Stack

| Library                     | Version  | Purpose                         |
| --------------------------- | -------- | ------------------------------- |
| `expo`                      | ~54.0.30 | React Native framework          |
| `three`                     | ^0.176.0 | 3D graphics engine              |
| `@react-three/fiber`        | ^9.1.2   | React renderer for Three.js     |
| `@react-three/drei`         | ^10.0.6  | Useful helpers for R3F          |
| `@react-three/rapier`       | ^2.1.0   | Rapier physics integration      |
| `@dimforge/rapier3d-compat` | ^0.15.0  | Rapier 3D physics engine (WASM) |
| `zustand`                   | ^5.0.5   | Lightweight state management    |
| `react-native-reanimated`   | ^4.2.1   | Native animations               |
| `polywasm`                  | ^0.2.0   | WebAssembly polyfill for Hermes |

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
├── utils/
│   ├── yahtzeeScoring.ts    # Hand validation logic
│   └── gameCore.ts          # Scoring, levels, rewards, dice enhancements (pure TS)
├── store/gameStore.ts       # Zustand state (run/level/hand/dice model)
├── components/
│   ├── Die.tsx              # 3D die with tap-to-lock + colored pips
│   ├── DiceTray.tsx         # 3D scene with physics
│   ├── ui/
│   │   ├── PlayConsole.tsx  # Unified container: HUDHeader + TrayWindow + ScoreLip
│   │   ├── ScoreLip.tsx     # Integrated score readout strip (inside PlayConsole)
│   │   ├── FooterControls.tsx
│   │   ├── CashoutResultList.tsx # Inline reward breakdown
│   │   ├── ShopContent.tsx  # Shop grid with upgrade items
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
│   │   ├── SpecialSection.tsx # Special row (placeholder, coming soon)
│   │   ├── UpperSection.tsx # 6 dice slots (1-6)
│   │   └── LowerSection.tsx # 7 poker hand slots
│   ├── screens/
│   │   ├── ResultScreen.tsx # Level complete rewards (exports ResultPanel)
│   │   ├── ShopScreen.tsx   # Shop with upgrades (exports ShopPanel)
│   │   ├── UpgradePickerScreen.tsx # (exports UpgradePickerPanel)
│   │   └── EndScreen.tsx    # Win/Lose screens (exports EndPanel)
│   └── modals/
│       └── OverviewModal.tsx # Hand levels + formulas
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

- **Base Points**: Start at hand's base value, +5 per hand level upgrade
- **Pips**: Upper section = sum of matching dice; Lower section = sum of all dice
- **Mult**: Fixed per hand type (1× for upper, 2-4× for lower)

Level goals: 50 → 80 → 120 → 180 → 250 → 350 → 480 → 650

### Reward System

On level complete:

- Base win: $10
- Per unused hand: $2

Hand upgrade cost: $6 + current hand level

### Dice Enhancement System

Players can purchase pip upgrades from the shop to add permanent scoring bonuses to specific die faces.

**Data Model** (`utils/gameCore.ts`):

```typescript
type PipState = "none" | "points" | "mult";
type DiceUpgradeType = "points" | "mult";

interface DieEnhancement {
  faces: PipState[][]; // 6 faces, each with variable pip count (1-6)
}
```

**Shop Integration**:

- Item spawns in SHOP_MAIN with 80% chance for Points (+10 pts/pip), 20% for Mult (+1 mult/pip)
- Only spawns if at least one pip across all dice is enhanceable
- Costs: Points = $8, Mult = $14

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

**Key timing constants:**

- Position lerp speed: 8 (exponential decay)
- Delta cap: 33ms (prevents instant jumps after frame gaps)
- Highlight pulse: 200ms (35% attack, 65% settle)
- Per-die counting delay: 560ms
- Initial delay before counting: 640ms
- Hand score display: 1000ms
- Total score display: 1600ms

### Slot Visual States

All 13 hand slots use 3 states defined in `theme.ts`:

- **Active**: Cyan glow, tappable (valid hand for current dice, not used this level)
- **Used**: Muted gold, not tappable (already used this level, resets each level)
- **Invalid**: Grey dash, not tappable (doesn't match current dice)

### Dice Tray Sizing

To change the dice tray size in the UI and keep the 3D scene in sync, adjust the UI height in `App.tsx` via `calculateDiceTrayHeight` (in `constants/theme.ts`) and pass both `containerHeight` and `containerWidth` into `DiceTray`. Inside `components/DiceTray.tsx`, derive the 3D floor dimensions from the canvas aspect ratio (e.g., `floorDepth = floorWidth / aspect`) and compute the camera height from the floor size and FOV so the floor fills the viewport without cropping. This keeps the tray full width across devices, prevents dice from rolling out of view, and makes the 3D bounds track the UI layout.

### Layout System

The layout system uses percentage-based weights to create stable, game-like proportions across all screen sizes.

**Section Weights (from `LAYOUT.weights` in theme.ts):**

Each major section gets a percentage of usable height (screen height minus safe areas):

| Section       | Weight | Purpose                                           |
| ------------- | ------ | ------------------------------------------------- |
| `header`      | 8%     | HUDHeader inside PlayConsole (LV, Goal, Progress) |
| `diceTray`    | 32%    | TrayWindow inside PlayConsole                     |
| `scoreRow`    | 6%     | ScoreLip inside PlayConsole                       |
| `scoringGrid` | 38%    | Three scoring sections                            |
| `footer`      | 12%    | Action buttons                                    |
| `gaps`        | 4%     | Spacing between sections                          |

**Gap System:**

Major section gaps use `SPACING.sectionGap` (16px), applied via `marginTop` in PhaseDeck:

```typescript
// PhaseDeck.tsx - Each layer after TrayModule gets marginTop
hudLayer: { marginTop: SPACING.sectionGap },      // ScoreRow
scoringAreaContainer: { marginTop: SPACING.sectionGap },  // ScoringGrid
footerLayer: { marginTop: SPACING.sectionGap },   // Footer
```

**ScoringGrid Structure (3 Equal Rows):**

The ScoringGrid contains three sections with equal height ratios (from `LAYOUT.scoring`):

| Section | Ratio      | Component                           |
| ------- | ---------- | ----------------------------------- |
| Special | 0.28 (28%) | `SpecialSection` - placeholder row  |
| Upper   | 0.28 (28%) | `UpperSection` - 6 dice slots (1-6) |
| Lower   | 0.28 (28%) | `LowerSection` - 7 poker hand slots |
| Labels  | 0.09 (9%)  | Section headers (3% each × 3)       |
| Gaps    | 0.07 (7%)  | Internal spacing                    |

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

### GameText Component

Use `GameText` instead of `Text` for all UI text:

```typescript
import { GameText } from "../shared";

<GameText variant="displayLarge" color={COLORS.gold}>
  SCORE: 1234
</GameText>

<GameText variant="bodyMedium" color={COLORS.textMuted}>
  Select a hand
</GameText>
```

**Available variants:**

- Display: `displayHuge` (44px), `displayLarge` (32px), `displayMedium` (24px), `displaySmall` (20px)
- Scoreboard: `scoreboardLarge` (28px), `scoreboardMedium` (22px), `scoreboardSmall` (18px) - with tabular nums
- Body: `bodyLarge` (16px), `bodyMedium` (14px), `bodySmall` (12px)
- Labels: `label` (11px, uppercase), `labelSmall` (10px, uppercase), `caption` (8px)
- Buttons: `buttonLarge` (28px), `buttonMedium` (20px), `buttonSmall` (14px)

### Color System

```typescript
import { COLORS } from "../constants/theme";

// Core colors
COLORS.bg; // #2A2242 - Main background
COLORS.surface; // #352B58 - Panel/card background
COLORS.text; // #FFFFFF - Primary text
COLORS.textMuted; // #AA9ECF - Secondary text
COLORS.textDark; // #1A1528 - Text on bright backgrounds

// Accent colors
COLORS.cyan; // #4DEEEA - Selection, info, neutral
COLORS.gold; // #FFC857 - Goals, progress, money
COLORS.coral; // #FF5A7A - Danger, cancel, locked
COLORS.mint; // #6CFFB8 - Success, confirm, buy

// Dice enhancement colors
COLORS.upgradePoints; // #3B9EFF - Blue pip (+10 points)
COLORS.upgradeMult; // #FF4D6D - Red pip (+1 mult)
```

### Overlay Colors

Use these for borders, bevels, and semi-transparent backgrounds instead of hardcoding rgba:

```typescript
// White overlays (for highlights, top bevels)
COLORS.overlays.whiteSubtle; // rgba(255,255,255,0.05)
COLORS.overlays.whiteMild; // rgba(255,255,255,0.1)
COLORS.overlays.whiteMedium; // rgba(255,255,255,0.15)
COLORS.overlays.whiteStrong; // rgba(255,255,255,0.2)

// Black overlays (for shadows, bottom bevels)
COLORS.overlays.blackSubtle; // rgba(0,0,0,0.1)
COLORS.overlays.blackMild; // rgba(0,0,0,0.2)
COLORS.overlays.blackMedium; // rgba(0,0,0,0.3)
COLORS.overlays.backdrop; // rgba(0,0,0,0.7) - Modal backdrops

// Accent overlays
COLORS.overlays.cyanSubtle; // rgba(77,238,234,0.1)
COLORS.overlays.cyanMild; // rgba(77,238,234,0.15)
COLORS.overlays.goldSubtle; // rgba(255,200,87,0.15)
COLORS.overlays.coralSubtle; // rgba(255,90,122,0.15)

// Mint overlays (for success/purchase states)
COLORS.overlays.mintSubtle; // rgba(108,255,184,0.15)
COLORS.overlays.mintMild; // rgba(108,255,184,0.25)
COLORS.overlays.mintGlow; // rgba(108,255,184,0.35)

// Glow overlays (for celebratory effects)
COLORS.overlays.goldGlow; // rgba(255,200,87,0.4)
```

### Shadow Colors (for text glow effects)

```typescript
COLORS.shadows.gold; // rgba(255,200,87,0.3)
COLORS.shadows.goldStrong; // rgba(255,200,87,0.5)
COLORS.shadows.cyan; // rgba(77,238,234,0.4)
COLORS.shadows.mint; // rgba(108,255,184,0.4)
COLORS.shadows.mintStrong; // rgba(108,255,184,0.6)
COLORS.shadows.black; // rgba(0,0,0,0.6)
```

### Spacing

```typescript
import { SPACING } from "../constants/theme";

// Base scale
SPACING.xxs; // 2
SPACING.xs; // 4
SPACING.sm; // 8
SPACING.md; // 12
SPACING.lg; // 16
SPACING.xl; // 20
SPACING.xxl; // 24

// Semantic
SPACING.sectionGap; // 16
SPACING.containerPaddingHorizontal; // 16
SPACING.modalPadding; // 20
```

### Dimensions

```typescript
import { DIMENSIONS } from "../constants/theme";

// Border radii
DIMENSIONS.borderRadius; // 12 (default)
DIMENSIONS.borderRadiusSmall; // 8
DIMENSIONS.borderRadiusLarge; // 16

// Border widths
DIMENSIONS.borderWidthThin; // 1
DIMENSIONS.borderWidth; // 2
DIMENSIONS.borderWidthThick; // 3

// Icon sizes
DIMENSIONS.iconSize.xs; // 14
DIMENSIONS.iconSize.sm; // 18
DIMENSIONS.iconSize.md; // 24
DIMENSIONS.iconSize.lg; // 28
DIMENSIONS.iconSize.xl; // 32
```

### Animation Constants

```typescript
import { ANIMATION } from "../constants/theme";

// Durations
ANIMATION.duration.fast; // 75ms
ANIMATION.duration.normal; // 100ms
ANIMATION.duration.slow; // 200ms

// Counting animation (ScoreRow)
ANIMATION.counting.initialDelay; // 640ms
ANIMATION.counting.perDieDelay; // 560ms
ANIMATION.counting.handScoreDisplay; // 1000ms
ANIMATION.counting.totalScoreDisplay; // 1600ms

// Spring configs (for reanimated)
ANIMATION.springs.button; // { damping: 20, stiffness: 400 }
ANIMATION.springs.modal; // { damping: 25, stiffness: 400, mass: 0.8 }
ANIMATION.springs.trophyPop; // { damping: 12, stiffness: 400 } - Bouncy trophy entrance
ANIMATION.springs.rowLand; // { damping: 18, stiffness: 350 } - Row landing tick
ANIMATION.springs.celebration; // { damping: 15, stiffness: 450 } - Celebratory bounce

// Phase transitions (PhaseDeck sliding panels)
ANIMATION.phase.springConfig; // { damping: 22, stiffness: 180 }
ANIMATION.phase.parallax.scoreRow; // 0.6 (60% of screen width)
ANIMATION.phase.parallax.scoringGrid; // 0.75
ANIMATION.phase.parallax.footer; // 0.9

// Cashout rewards panel
ANIMATION.cashout.heroPayoutDelay; // 120ms - After panel settles
ANIMATION.cashout.countUpDuration; // 750ms - Payout count-up
ANIMATION.cashout.rowStartDelay; // 120ms - After payout begins
ANIMATION.cashout.rowStagger; // 90ms - Between rows
ANIMATION.cashout.rowAnimDuration; // 200ms - Per-row animation
ANIMATION.cashout.sparkleCount; // 4 - Number of sparkle particles

// Shop panel
ANIMATION.shop.headerDelay; // 120ms
ANIMATION.shop.gridStagger; // 60ms - Between grid items
ANIMATION.shop.itemAnimDuration; // 210ms - Per-item animation
ANIMATION.shop.purchaseFlashDuration; // 180ms - Mint outline flash
ANIMATION.shop.shimmerInterval; // 4000ms - "SOON" shimmer interval

// Dice editor (enhancement selection modal)
ANIMATION.diceEditor.panelSlideIn; // { damping: 22, stiffness: 280 } - Modal entrance
ANIMATION.diceEditor.dieStagger; // 70ms - Between dice tile entrances
ANIMATION.diceEditor.dieEntrance; // 180ms - Individual die entrance
ANIMATION.diceEditor.selectionPulse; // 200ms - Die selection pulse
ANIMATION.diceEditor.screenTransition; // 250ms - A→B screen transition
ANIMATION.diceEditor.pipPopScale; // 1.15 - Pip upgrade pop scale
ANIMATION.diceEditor.successDelay; // 550ms - Hold after upgrade before close

// Transition timing
ANIMATION.transition.incomingDelay; // 40ms - Delay before incoming panel
ANIMATION.transition.ctaSwapProgress; // 0.6 - When to swap CTA (60% progress)
ANIMATION.transition.ctaGlowPulseDuration; // 400ms - Glow pulse behind new CTA
```

### Physics Constants

```typescript
import { PHYSICS } from "../constants/theme";

PHYSICS.die.size; // 0.8
PHYSICS.reveal.positionLerpSpeed; // 8
PHYSICS.settle.speedThreshold; // 0.05
```

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
