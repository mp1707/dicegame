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
├── App.tsx                  # Main layout + screen routing
├── constants/theme.ts       # Colors, typography, spacing
├── utils/
│   ├── yahtzeeScoring.ts    # Hand validation logic
│   └── gameCore.ts          # Scoring, levels, rewards (pure TS)
├── store/gameStore.ts       # Zustand state (run/level/hand model)
├── components/
│   ├── Die.tsx              # 3D die with tap-to-lock
│   ├── DiceTray.tsx         # 3D scene with physics
│   ├── ui/
│   │   ├── GlassHeader.tsx  # Level, score, money
│   │   ├── ScoreRow.tsx     # Selected hand + reveal animation
│   │   └── FooterControls.tsx
│   ├── scoring/
│   │   ├── UpperSection.tsx # 6 dice slots (1-6)
│   │   └── LowerSection.tsx # 7 poker hand slots
│   ├── screens/
│   │   ├── ResultScreen.tsx # Level complete rewards
│   │   ├── ShopScreen.tsx   # Shop with upgrades
│   │   ├── UpgradePickerScreen.tsx
│   │   └── EndScreen.tsx    # Win/Lose screens
│   └── modals/
│       └── OverviewModal.tsx # Hand levels + formulas
```

### Game State (`store/gameStore.ts`)

Key state properties:

- **Run state** (persists across levels):
  - `currentLevelIndex` (0-7), `money`, `handLevels` (Record<HandId, number>)
- **Level state** (resets each level):
  - `levelScore`, `levelGoal`, `handsRemaining` (4→0), `usedHandsThisLevel`
- **Hand attempt state** (resets each hand):
  - `rollsRemaining` (3→0), `hasRolledThisHand`
- **Dice state**: `diceValues`, `selectedDice`, `isRolling`, `rollTrigger`
- **UI state**: `phase`, `selectedHandId`, `revealState`

Key actions: `rollDice`, `selectHand`, `acceptHand`, `finalizeHand`, `cashOutNow`, `pressOn`, `startNewRun`, `startLevel`

### Game Phase Model

- `LEVEL_PLAY`: Main gameplay. Roll dice (up to 3 per hand), lock/unlock, select a hand, press ANNEHMEN to accept. When `levelWon === true`, CASH OUT button appears in grid.
- `CASHOUT_CHOICE`: Modal after reveal animation if score >= goal. Choose CASH OUT or PRESS ON.
- `LEVEL_RESULT`: Shows reward breakdown (base win, unused hands/rolls, tier bonus). CTA: SHOP.
- `SHOP_MAIN`: Shop grid with 3 placeholder items + UPGRADE HAND. CTA: NEXT LEVEL.
- `SHOP_PICK_UPGRADE`: Pick 1 of 3 random hands to upgrade. Cost: $6 + handLevel.
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
- Per unused roll: $1
- Tier 1 bonus (≥125% goal): $5
- Tier 2 bonus (≥150% goal): $10

Hand upgrade cost: $6 + current hand level

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

**4. ScoreRow counting animation**

- Iterates through `contributingIndices` one by one
- Updates `currentDieIndex` to highlight each die in turn
- Accumulates pips and animates score display
- After all dice counted, shows final score for 2 seconds, then calls `finalizeHand()`

**5. Die visual states during reveal**

- **Highlighted** (current die): Gold color, pulse scale (1.0 → 1.12 → 1.0)
- **Contributing**: Normal opacity, awaiting highlight
- **Non-contributing**: Dimmed to 30% opacity

**Key timing constants:**

- Position lerp speed: 8 (exponential decay)
- Delta cap: 33ms (prevents instant jumps after frame gaps)
- Highlight pulse: 200ms (35% attack, 65% settle)
- Per-die counting delay: 700ms
- Final score display: 2000ms

### Slot Visual States

All 13 hand slots use 3 states defined in `theme.ts`:

- **Active**: Cyan glow, tappable (valid hand for current dice, not used this level)
- **Used**: Muted gold, not tappable (already used this level, resets each level)
- **Invalid**: Grey dash, not tappable (doesn't match current dice)

### Dice Tray Sizing

To change the dice tray size in the UI and keep the 3D scene in sync, adjust the UI height in `App.tsx` via `calculateDiceTrayHeight` (in `constants/theme.ts`) and pass both `containerHeight` and `containerWidth` into `DiceTray`. Inside `components/DiceTray.tsx`, derive the 3D floor dimensions from the canvas aspect ratio (e.g., `floorDepth = floorWidth / aspect`) and compute the camera height from the floor size and FOV so the floor fills the viewport without cropping. This keeps the tray full width across devices, prevents dice from rolling out of view, and makes the 3D bounds track the UI layout.

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
